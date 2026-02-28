<?php

use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Models\User;

test('authenticated users can view billing page', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 1000,
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($user)->get(route('billing.index'));

    $response->assertOk()
        ->assertSee('1000.00');
});

test('company admin can top up wallet', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 200,
    ]);

    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($admin)->post(route('billing.top-ups.store'), [
        'amount' => 300,
        'note' => 'Manual top-up',
    ]);

    $response->assertRedirect();

    $company->refresh();

    expect((float) $company->airtime_balance)->toBe(500.0);

    $this->assertDatabaseHas('company_billing_transactions', [
        'company_id' => $company->id,
        'user_id' => $admin->id,
        'type' => 'top_up',
    ]);

    expect(CompanyBillingTransaction::query()->count())->toBe(1);
});

test('non admin users cannot top up wallet', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 200,
    ]);

    $member = User::factory()->create([
        'company_id' => $company->id,
        'is_company_admin' => false,
    ]);

    $response = $this->actingAs($member)->post(route('billing.top-ups.store'), [
        'amount' => 300,
    ]);

    $response->assertForbidden();
});
