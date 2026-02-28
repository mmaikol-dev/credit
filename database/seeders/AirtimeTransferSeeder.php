<?php

namespace Database\Seeders;

use App\Models\AirtimeTransfer;
use Illuminate\Database\Seeder;

class AirtimeTransferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AirtimeTransfer::factory()->count(10)->create();
    }
}
