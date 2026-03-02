<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\B2BTransaction>
 */
class B2BTransactionFactory extends Factory
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
            'command_id' => $this->faker->randomElement(['BusinessPayBill', 'BusinessBuyGoods']),
            'initiator' => 'prod_api_user',
            'sender_identifier_type' => 4,
            'receiver_identifier_type' => 4,
            'party_a' => '600000',
            'party_b' => (string) $this->faker->numberBetween(100000, 999999),
            'account_reference' => strtoupper($this->faker->bothify('INV#######')),
            'requester' => '2547'.$this->faker->numerify('########'),
            'amount' => $this->faker->randomFloat(2, 10, 100000),
            'remarks' => 'B2B Payment',
            'queue_timeout_url' => 'https://example.test/api/mpesa/b2b/timeout',
            'result_url' => 'https://example.test/api/mpesa/b2b/result',
            'originator_conversation_id' => 'B2B-'.$this->faker->unique()->numerify('#############'),
            'conversation_id' => null,
            'transaction_id' => null,
            'response_code' => null,
            'response_description' => null,
            'result_code' => null,
            'result_desc' => null,
            'transaction_completed_time' => null,
            'receiver_party_public_name' => null,
            'debit_party_affected_account_balance' => null,
            'bill_reference_number' => null,
            'status' => 'pending',
            'raw_request_payload' => null,
            'raw_sync_response_payload' => null,
            'raw_callback_payload' => null,
            'processed_at' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (\App\Models\B2BTransaction $transaction): void {
            if ($transaction->user_id !== null && $transaction->company_id === null) {
                $transaction->company_id = User::query()->find($transaction->user_id)?->company_id;
            }
        })->afterCreating(function (\App\Models\B2BTransaction $transaction): void {
            if ($transaction->company_id === null && $transaction->user !== null) {
                $transaction->update([
                    'company_id' => $transaction->user->company_id,
                ]);
            }
        });
    }
}
