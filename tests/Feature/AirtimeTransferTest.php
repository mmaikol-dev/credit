<?php

use App\Models\AirtimeTransfer;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Models\User;
use App\Services\Airtime\StatumAirtimeClient;
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
    config()->set('services.statum.webhook_secret', 'secret-token');

    $transfer = AirtimeTransfer::factory()->create([
        'status' => 'accepted',
        'external_reference' => 'sttm_abc123',
    ]);

    $response = $this->postJson(route('airtime.webhook', ['token' => 'secret-token']), [
        'transaction_id' => 'sttm_abc123',
        'status' => 'SUCCESS',
        'result_code' => '00',
        'result_description' => 'Delivered',
    ]);

    $response->assertNoContent();

    $transfer->refresh();

    expect($transfer->status)->toBe('completed')
        ->and($transfer->result_code)->toBe('00')
        ->and($transfer->result_description)->toBe('Delivered');
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
