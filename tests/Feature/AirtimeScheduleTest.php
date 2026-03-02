<?php

use App\Models\AirtimeSchedule;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Models\User;
use App\Services\Airtime\StatumAirtimeClient;
use Mockery\MockInterface;

test('authenticated users can create one-time airtime schedules', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 500,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($user)->post(route('airtime.schedules.store'), [
        'recipient' => '254712345678',
        'amount' => 50,
        'schedule_type' => 'one_time',
        'start_date' => now()->addDay()->toDateString(),
        'send_time' => '09:30',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('airtime_schedules', [
        'company_id' => $company->id,
        'user_id' => $user->id,
        'recipient' => '254712345678',
        'schedule_type' => 'one_time',
        'status' => 'active',
    ]);
});

test('users only see schedules from their company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->create([
        'company_id' => $companyA->id,
    ]);

    AirtimeSchedule::factory()->create([
        'company_id' => $companyA->id,
        'recipient' => '254700000001',
    ]);

    AirtimeSchedule::factory()->create([
        'company_id' => $companyB->id,
        'recipient' => '254799999999',
    ]);

    $response = $this->actingAs($userA)->get(route('airtime.schedules.index'));

    $response->assertOk()
        ->assertSee('254700000001')
        ->assertDontSee('254799999999');
});

test('processing command sends due one-time schedules and marks completed', function () {
    $this->mock(StatumAirtimeClient::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andReturn([
                'accepted' => true,
                'transaction_id' => 'scheduled_001',
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

    $schedule = AirtimeSchedule::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'amount' => 50,
        'schedule_type' => 'one_time',
        'next_run_at' => now()->subMinute(),
        'status' => 'active',
    ]);

    $this->artisan('airtime:schedules:process')->assertSuccessful();

    $schedule->refresh();
    $company->refresh();

    expect($schedule->status)->toBe('completed')
        ->and($schedule->occurrences_count)->toBe(1)
        ->and((float) $company->airtime_balance)->toBe(450.0);

    $this->assertDatabaseHas('airtime_transfers', [
        'company_id' => $company->id,
        'status' => 'accepted',
    ]);

    expect(CompanyBillingTransaction::query()->where('type', 'debit')->count())->toBe(1);
});

test('processing command keeps recurring schedules active and moves next run', function () {
    $this->mock(StatumAirtimeClient::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andReturn([
                'accepted' => true,
                'transaction_id' => 'scheduled_002',
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

    $now = now()->subMinute();
    $schedule = AirtimeSchedule::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'amount' => 50,
        'schedule_type' => 'recurring',
        'recurrence' => 'daily',
        'next_run_at' => $now,
        'status' => 'active',
    ]);

    $this->artisan('airtime:schedules:process')->assertSuccessful();

    $schedule->refresh();

    expect($schedule->status)->toBe('active')
        ->and($schedule->occurrences_count)->toBe(1)
        ->and($schedule->next_run_at)->not->toBeNull();
});

test('authenticated user can update airtime schedule', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $schedule = AirtimeSchedule::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'recipient' => '254712345678',
        'schedule_type' => 'one_time',
    ]);

    $response = $this->actingAs($user)->patch(route('airtime.schedules.update', $schedule), [
        'recipient' => '254700000123',
        'amount' => 75,
        'schedule_type' => 'one_time',
        'start_date' => now()->addDays(2)->toDateString(),
        'send_time' => '10:15',
    ]);

    $response->assertRedirect();

    $schedule->refresh();

    expect($schedule->recipient)->toBe('254700000123')
        ->and((float) $schedule->amount)->toBe(75.0);
});

test('authenticated user can delete airtime schedule', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $schedule = AirtimeSchedule::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)->delete(route('airtime.schedules.destroy', $schedule));

    $response->assertRedirect();

    $this->assertDatabaseMissing('airtime_schedules', [
        'id' => $schedule->id,
    ]);
});
