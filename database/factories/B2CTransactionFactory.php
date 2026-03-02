<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\B2CTransaction>
 */
class B2CTransactionFactory extends Factory
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
            'originator_conversation_id' => 'B2C-'.$this->faker->unique()->numerify('#############'),
            'conversation_id' => null,
            'transaction_id' => null,
            'phone_number' => '2547'.$this->faker->numerify('########'),
            'amount' => $this->faker->randomFloat(2, 10, 10000),
            'result_code' => null,
            'result_desc' => null,
            'status' => 'pending',
            'raw_callback_payload' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (\App\Models\B2CTransaction $transaction): void {
            if ($transaction->user_id !== null && $transaction->company_id === null) {
                $transaction->company_id = User::query()->find($transaction->user_id)?->company_id;
            }
        })->afterCreating(function (\App\Models\B2CTransaction $transaction): void {
            if ($transaction->company_id === null && $transaction->user !== null) {
                $transaction->update([
                    'company_id' => $transaction->user->company_id,
                ]);
            }
        });
    }
}
