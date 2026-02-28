<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AirtimeSchedule>
 */
class AirtimeScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $date = now()->addDay()->toDateString();

        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'recipient' => '2547'.$this->faker->numerify('########'),
            'sender' => 'COMPANY',
            'amount' => $this->faker->randomFloat(2, 10, 300),
            'schedule_type' => 'one_time',
            'recurrence' => null,
            'start_date' => $date,
            'send_time' => '09:00:00',
            'next_run_at' => now()->addDay()->setTime(9, 0),
            'last_run_at' => null,
            'occurrences_count' => 0,
            'max_occurrences' => null,
            'status' => 'active',
            'last_error' => null,
            'meta' => null,
        ];
    }
}
