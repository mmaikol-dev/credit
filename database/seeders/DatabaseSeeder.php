<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $company = Company::factory()->create([
            'name' => 'Demo Company',
            'slug' => 'demo-company',
            'airtime_balance' => 10000,
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
            'is_company_admin' => true,
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $company->update([
            'owner_id' => $user->id,
        ]);
    }
}
