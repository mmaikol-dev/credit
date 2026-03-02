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
        Schema::create('mpesa_stk_top_up_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('phone_number');
            $table->string('account_reference');
            $table->string('merchant_request_id')->nullable()->index();
            $table->string('checkout_request_id')->nullable()->index();
            $table->string('mpesa_receipt_number')->nullable()->index();
            $table->string('result_code')->nullable();
            $table->text('result_desc')->nullable();
            $table->string('transaction_date')->nullable();
            $table->enum('status', ['pending', 'request_failed', 'success', 'failed', 'timeout'])->default('pending');
            $table->json('raw_request_payload')->nullable();
            $table->json('raw_sync_response_payload')->nullable();
            $table->json('raw_callback_payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mpesa_stk_top_up_transactions');
    }
};
