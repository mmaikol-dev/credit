<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('airtime_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('airtime_transfer_id')->nullable()->constrained('airtime_transfers')->nullOnDelete();
            $table->string('external_reference')->nullable()->index();
            $table->string('provider_status')->nullable();
            $table->string('result_code')->nullable()->index();
            $table->text('result_description')->nullable();
            $table->decimal('charge', 12, 2)->nullable();
            $table->decimal('account_balance', 12, 2)->nullable();
            $table->string('processing_status')->default('received')->index();
            $table->text('processing_error')->nullable();
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('airtime_webhook_events');
    }
};
