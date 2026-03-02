<?php

namespace Database\Factories;

use App\Models\AirtimeTransfer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AirtimeWebhookEvent>
 */
class AirtimeWebhookEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'airtime_transfer_id' => AirtimeTransfer::factory(),
            'external_reference' => $this->faker->uuid(),
            'provider_status' => 'SUCCESS',
            'result_code' => '200',
            'result_description' => 'Operation successful.',
            'charge' => $this->faker->randomFloat(2, 0.5, 5),
            'account_balance' => $this->faker->randomFloat(2, 500, 5000),
            'processing_status' => 'processed',
            'processing_error' => null,
            'payload' => [
                'request_id' => $this->faker->uuid(),
                'result_code' => '200',
                'result_desc' => 'Operation successful.',
            ],
            'processed_at' => now(),
        ];
    }
}
