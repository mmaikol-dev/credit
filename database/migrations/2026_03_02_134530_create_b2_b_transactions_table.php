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
        Schema::create('b2b_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('command_id');
            $table->string('initiator');
            $table->unsignedTinyInteger('sender_identifier_type')->default(4);
            $table->unsignedTinyInteger('receiver_identifier_type')->default(4);
            $table->string('party_a');
            $table->string('party_b');
            $table->string('account_reference', 13);
            $table->string('requester')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('remarks', 100);
            $table->string('queue_timeout_url');
            $table->string('result_url');
            $table->string('originator_conversation_id')->nullable()->unique();
            $table->string('conversation_id')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('response_code')->nullable();
            $table->text('response_description')->nullable();
            $table->string('result_code')->nullable();
            $table->text('result_desc')->nullable();
            $table->string('transaction_completed_time', 14)->nullable();
            $table->string('receiver_party_public_name')->nullable();
            $table->text('debit_party_affected_account_balance')->nullable();
            $table->string('bill_reference_number')->nullable();
            $table->enum('status', ['pending', 'accepted', 'success', 'failed', 'timeout'])->default('pending');
            $table->json('raw_request_payload')->nullable();
            $table->json('raw_sync_response_payload')->nullable();
            $table->json('raw_callback_payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index('conversation_id');
            $table->index('transaction_id');
            $table->index('command_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('b2b_transactions');
    }
};
