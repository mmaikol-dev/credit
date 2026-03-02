<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MpesaStkTopUpTransaction>
 */
class MpesaStkTopUpTransactionFactory extends Factory
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
            'amount' => fake()->randomFloat(2, 10, 10000),
            'phone_number' => '2547'.fake()->numerify('########'),
            'account_reference' => (string) fake()->numberBetween(1, 99999),
            'merchant_request_id' => 'ws_CO_'.fake()->numerify('##########'),
            'checkout_request_id' => 'ws_CO_'.fake()->unique()->numerify('############'),
            'mpesa_receipt_number' => null,
            'result_code' => null,
            'result_desc' => null,
            'transaction_date' => null,
            'status' => 'pending',
            'raw_request_payload' => null,
            'raw_sync_response_payload' => null,
            'raw_callback_payload' => null,
            'processed_at' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (\App\Models\MpesaStkTopUpTransaction $transaction): void {
            if ($transaction->user_id !== null && $transaction->company_id === null) {
                $transaction->company_id = User::query()->find($transaction->user_id)?->company_id;
            }
        })->afterCreating(function (\App\Models\MpesaStkTopUpTransaction $transaction): void {
            if ($transaction->company_id === null && $transaction->user !== null) {
                $transaction->update([
                    'company_id' => $transaction->user->company_id,
                ]);
            }
        });
    }
}
