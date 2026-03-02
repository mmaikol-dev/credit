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
        Schema::create('b2c_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('originator_conversation_id')->unique();
            $table->string('conversation_id')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('phone_number');
            $table->decimal('amount', 12, 2);
            $table->string('result_code')->nullable();
            $table->text('result_desc')->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'timeout'])->default('pending');
            $table->json('raw_callback_payload')->nullable();
            $table->timestamps();

            $table->index(['phone_number', 'status']);
            $table->index(['company_id', 'status']);
            $table->index('conversation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('b2c_transactions');
    }
};
