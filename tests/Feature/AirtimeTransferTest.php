<?php

use App\Models\AirtimeTransfer;
use App\Models\AirtimeWebhookEvent;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Models\User;
use App\Notifications\AirtimeTransferStatusNotification;
use App\Services\Airtime\StatumAirtimeClient;
use Illuminate\Support\Facades\Notification;
use Mockery\MockInterface;

test('authenticated users can submit airtime transfers', function () {
    $this->mock(StatumAirtimeClient::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andReturn([
                'accepted' => true,
                'transaction_id' => 'sttm_12345',
                'response_code' => '200',
                'response_description' => 'Accepted',
                'status' => 'ACCEPTED',
            ]);
    });

    $company = Company::factory()->create([
        'airtime_balance' => 500,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($user)->postJson(route('airtime.transfers.store'), [
        'recipient' => '254712345678',
        'amount' => 100,
        'sender' => 'COMPANY',
    ]);

    $response->assertCreated()
        ->assertJsonPath('transfer.status', 'accepted')
        ->assertJsonPath('transfer.external_reference', 'sttm_12345');

    $this->assertDatabaseHas('airtime_transfers', [
        'user_id' => $user->id,
        'recipient' => '254712345678',
        'status' => 'accepted',
        'external_reference' => 'sttm_12345',
    ]);

    $company->refresh();

    expect((float) $company->airtime_balance)->toBe(400.0)
        ->and(CompanyBillingTransaction::query()->where('type', 'debit')->count())->toBe(1);
});

test('airtime transfer payload is validated', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('airtime.transfers.store'), [
        'recipient' => '0712345678',
        'amount' => 0,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['recipient', 'amount']);
});

test('webhook updates transfer status', function () {
    Notification::fake();
    config()->set('services.statum.webhook_secret', 'secret-token');

    $transfer = AirtimeTransfer::factory()->create([
        'status' => 'accepted',
        'external_reference' => 'sttm_abc123',
    ]);

    $response = $this->postJson(route('airtime.webhook', ['token' => 'secret-token']), [
        'request_id' => 'sttm_abc123',
        'result_code' => '200',
        'result_desc' => 'You have topped up 254721553678 with Ksh. 50.',
    ]);

    $response->assertNoContent();

    $transfer->refresh();

    expect($transfer->status)->toBe('completed')
        ->and($transfer->result_code)->toBe('200')
        ->and($transfer->result_description)->toBe('You have topped up 254721553678 with Ksh. 50.')
        ->and($transfer->provider_response_description)->toBe('You have topped up 254721553678 with Ksh. 50.');

    expect(AirtimeWebhookEvent::query()->where('external_reference', 'sttm_abc123')->count())->toBe(1);
    Notification::assertSentTo($transfer->user, AirtimeTransferStatusNotification::class);
});

test('webhook maps failed payload message and reverses debited balance', function () {
    Notification::fake();
    config()->set('services.statum.webhook_secret', 'secret-token');

    $company = Company::factory()->create([
        'airtime_balance' => 100,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $transfer = AirtimeTransfer::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'amount' => 50,
        'status' => 'accepted',
        'external_reference' => 'sttm_failed_001',
        'meta' => [
            'billing_debited' => true,
            'billing_reversed' => false,
        ],
    ]);

    $response = $this->postJson(route('airtime.webhook', ['token' => 'secret-token']), [
        'request_id' => 'sttm_failed_001',
        'charge' => 1.5,
        'account_balance' => 5000,
        'result_code' => '500',
        'result_desc' => 'Top up failed due to upstream timeout.',
    ]);

    $response->assertNoContent();

    $transfer->refresh();
    $company->refresh();

    expect($transfer->status)->toBe('failed')
        ->and($transfer->result_code)->toBe('500')
        ->and($transfer->result_description)->toBe('Top up failed due to upstream timeout.')
        ->and($transfer->provider_response_description)->toBe('Top up failed due to upstream timeout.')
        ->and((float) $company->airtime_balance)->toBe(150.0)
        ->and(CompanyBillingTransaction::query()->where('type', 'reversal')->count())->toBe(1);

    $event = AirtimeWebhookEvent::query()->where('external_reference', 'sttm_failed_001')->first();

    expect($event)->not->toBeNull()
        ->and($event?->charge)->toBe('1.50')
        ->and($event?->account_balance)->toBe('5000.00');
    Notification::assertSentTo($user, AirtimeTransferStatusNotification::class);
});

test('webhook is unavailable when secret is missing', function () {
    config()->set('services.statum.webhook_secret', null);

    $response = $this->postJson(route('airtime.webhook'), [
        'transaction_id' => 'sttm_abc123',
        'status' => 'SUCCESS',
    ]);

    $response->assertServiceUnavailable();
});

test('failed webhook callback schedules retry for retryable provider codes', function () {
    Notification::fake();
    config()->set('services.statum.webhook_secret', 'secret-token');

    $company = Company::factory()->create();
    $user = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $transfer = AirtimeTransfer::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => 'accepted',
        'external_reference' => 'sttm_retry_001',
        'meta' => [
            'billing_debited' => false,
            'billing_reversed' => false,
            'retry_attempts' => 0,
        ],
    ]);

    $response = $this->postJson(route('airtime.webhook', ['token' => 'secret-token']), [
        'request_id' => 'sttm_retry_001',
        'result_code' => '503',
        'result_desc' => 'Service temporarily unavailable.',
    ]);

    $response->assertNoContent();

    $transfer->refresh();

    expect($transfer->status)->toBe('failed')
        ->and(data_get($transfer->meta, 'retryable'))->toBeTrue()
        ->and(data_get($transfer->meta, 'next_retry_at'))->not->toBeNull();
});

test('retry command retries failed retryable transfers', function () {
    Notification::fake();

    $this->mock(StatumAirtimeClient::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andReturn([
                'accepted' => true,
                'request_id' => 'sttm_retry_success',
                'status_code' => '200',
                'description' => 'Retry accepted by provider.',
                'status' => 'ACCEPTED',
            ]);
    });

    $company = Company::factory()->create([
        'airtime_balance' => 1000,
    ]);
    $user = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $transfer = AirtimeTransfer::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => 'failed',
        'amount' => 100,
        'meta' => [
            'billing_debited' => false,
            'billing_reversed' => false,
            'retryable' => true,
            'retry_attempts' => 0,
            'next_retry_at' => now()->subMinute()->toISOString(),
        ],
    ]);

    $this->artisan('airtime:transfers:retry')->assertSuccessful();

    $transfer->refresh();
    $company->refresh();

    expect($transfer->status)->toBe('accepted')
        ->and($transfer->external_reference)->toBe('sttm_retry_success')
        ->and(data_get($transfer->meta, 'retry_attempts'))->toBe(1)
        ->and(data_get($transfer->meta, 'retryable'))->toBeFalse()
        ->and((float) $company->airtime_balance)->toBe(900.0);
});

test('authenticated users can view transfer airtime page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('airtime.transfers.index'));

    $response->assertOk();
});

test('users only see airtime transfers from their company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->create([
        'company_id' => $companyA->id,
    ]);

    AirtimeTransfer::factory()->create([
        'company_id' => $companyA->id,
        'user_id' => $userA->id,
        'recipient' => '254700000001',
    ]);

    AirtimeTransfer::factory()->create([
        'company_id' => $companyB->id,
        'recipient' => '254799999999',
    ]);

    $response = $this->actingAs($userA)->get(route('airtime.transfers.index'));

    $response->assertOk()
        ->assertSee('254700000001')
        ->assertDontSee('254799999999');
});

test('airtime transfer fails when company balance is insufficient', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 20,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($user)->postJson(route('airtime.transfers.store'), [
        'recipient' => '254712345678',
        'amount' => 100,
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Insufficient airtime balance. Please top up first.');
});

test('authenticated user can update transfer sender', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $transfer = AirtimeTransfer::factory()->create([
        'company_id' => $company->id,
        'sender' => 'OLDNAME',
        'status' => 'failed',
    ]);

    $response = $this->actingAs($user)->patch(route('airtime.transfers.update', $transfer), [
        'sender' => 'NEWNAME',
    ]);

    $response->assertRedirect();

    $transfer->refresh();

    expect($transfer->sender)->toBe('NEWNAME');
});

test('authenticated user can delete failed non debited transfer', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $transfer = AirtimeTransfer::factory()->create([
        'company_id' => $company->id,
        'status' => 'failed',
        'meta' => [
            'billing_debited' => false,
        ],
    ]);

    $response = $this->actingAs($user)->delete(route('airtime.transfers.destroy', $transfer));

    $response->assertRedirect();

    $this->assertDatabaseMissing('airtime_transfers', [
        'id' => $transfer->id,
    ]);
});
