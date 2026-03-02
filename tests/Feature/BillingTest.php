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

test('company admin can update billing transaction note', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 500,
    ]);

    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $transaction = CompanyBillingTransaction::factory()->create([
        'company_id' => $company->id,
        'user_id' => $admin->id,
        'type' => 'top_up',
        'note' => 'Old note',
    ]);

    $response = $this->actingAs($admin)->patch(route('billing.transactions.update', $transaction), [
        'note' => 'Updated note',
    ]);

    $response->assertRedirect();

    $transaction->refresh();

    expect($transaction->note)->toBe('Updated note');
});

test('company admin can delete top up transaction and balance is adjusted', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 500,
    ]);

    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $transaction = CompanyBillingTransaction::factory()->create([
        'company_id' => $company->id,
        'user_id' => $admin->id,
        'type' => 'top_up',
        'amount' => 200,
        'balance_after' => 500,
    ]);

    $response = $this->actingAs($admin)->delete(route('billing.transactions.destroy', $transaction));

    $response->assertRedirect();

    $company->refresh();

    expect((float) $company->airtime_balance)->toBe(300.0);

    $this->assertDatabaseMissing('company_billing_transactions', [
        'id' => $transaction->id,
    ]);
});
