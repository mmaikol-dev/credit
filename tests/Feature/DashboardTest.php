<?php

use App\Models\AirtimeTransfer;
use App\Models\Company;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard shows only company recent transfers', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->create([
        'company_id' => $companyA->id,
    ]);

    AirtimeTransfer::factory()->create([
        'company_id' => $companyA->id,
        'user_id' => $userA->id,
        'recipient' => '254711111111',
    ]);

    AirtimeTransfer::factory()->create([
        'company_id' => $companyB->id,
        'recipient' => '254722222222',
    ]);

    $response = $this->actingAs($userA)->get(route('dashboard'));

    $response->assertOk()
        ->assertSee('254711111111')
        ->assertDontSee('254722222222');
});
