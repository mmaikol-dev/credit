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
        Schema::create('airtime_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('recipient');
            $table->string('sender')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('queued');
            $table->string('external_reference')->nullable()->unique();
            $table->string('provider_status')->nullable();
            $table->string('provider_response_code')->nullable();
            $table->text('provider_response_description')->nullable();
            $table->string('result_code')->nullable();
            $table->text('result_description')->nullable();
            $table->json('callback_payload')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['recipient', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('airtime_transfers');
    }
};
