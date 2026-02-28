<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AirtimeTransfer>
 */
class AirtimeTransferFactory extends Factory
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
            'recipient' => '2547'.$this->faker->numerify('########'),
            'sender' => 'COMPANY',
            'amount' => $this->faker->randomFloat(2, 10, 500),
            'status' => 'accepted',
            'external_reference' => $this->faker->uuid(),
            'provider_status' => 'accepted',
            'provider_response_code' => '200',
            'provider_response_description' => 'Accepted',
            'result_code' => null,
            'result_description' => null,
            'callback_payload' => null,
            'meta' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (\App\Models\AirtimeTransfer $transfer): void {
            if ($transfer->user_id !== null && $transfer->company_id === null) {
                $transfer->company_id = User::query()->find($transfer->user_id)?->company_id;
            }
        })->afterCreating(function (\App\Models\AirtimeTransfer $transfer): void {
            if ($transfer->company_id === null && $transfer->user !== null) {
                $transfer->update([
                    'company_id' => $transfer->user->company_id,
                ]);
            }
        });
    }
}
