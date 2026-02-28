<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CompanyBillingTransaction>
 */
class CompanyBillingTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['top_up', 'debit', 'reversal']),
            'amount' => fake()->randomFloat(2, 10, 5000),
            'balance_after' => fake()->randomFloat(2, 100, 50000),
            'reference' => fake()->uuid(),
            'note' => fake()->sentence(),
            'meta' => null,
        ];
    }
}
