<?php

use App\Models\Company;
use App\Models\User;

test('company users page lists current company users only', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $companyA->id,
    ]);

    User::factory()->create([
        'company_id' => $companyA->id,
        'email' => 'member-a@example.com',
    ]);

    User::factory()->create([
        'company_id' => $companyB->id,
        'email' => 'member-b@example.com',
    ]);

    $response = $this->actingAs($admin)->get(route('company.users.index'));

    $response->assertOk()
        ->assertSee('member-a@example.com')
        ->assertDontSee('member-b@example.com');
});

test('company admin can add users to their company', function () {
    $company = Company::factory()->create();

    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($admin)->post(route('company.users.store'), [
        'name' => 'Team Member',
        'email' => 'team.member@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'is_company_admin' => true,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('users', [
        'company_id' => $company->id,
        'email' => 'team.member@example.com',
        'is_company_admin' => 1,
    ]);
});

test('non admin users cannot add company users', function () {
    $company = Company::factory()->create();

    $member = User::factory()->create([
        'company_id' => $company->id,
        'is_company_admin' => false,
    ]);

    $response = $this->actingAs($member)->post(route('company.users.store'), [
        'name' => 'Team Member',
        'email' => 'blocked.member@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertForbidden();
});
