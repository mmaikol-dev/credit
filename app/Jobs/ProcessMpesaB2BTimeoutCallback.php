<?php

namespace App\Jobs;

use App\Models\B2BTransaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessMpesaB2BTimeoutCallback implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(private readonly array $payload) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $originatorConversationId = (string) data_get($this->payload, 'Result.OriginatorConversationID', '');
        $conversationId = (string) data_get($this->payload, 'Result.ConversationID', '');

        if ($originatorConversationId === '' && $conversationId === '') {
            Log::warning('mpesa.b2b.timeout.identifiers_missing', [
                'payload' => $this->payload,
            ]);

            return;
        }

        $transaction = B2BTransaction::query()
            ->when($originatorConversationId !== '', fn ($query) => $query->where('originator_conversation_id', $originatorConversationId))
            ->when($originatorConversationId === '' && $conversationId !== '', fn ($query) => $query->where('conversation_id', $conversationId))
            ->first();

        if ($transaction === null) {
            Log::warning('mpesa.b2b.timeout.transaction_missing', [
                'originator_conversation_id' => $originatorConversationId,
                'conversation_id' => $conversationId,
            ]);

            return;
        }

        if (in_array($transaction->status, ['success', 'timeout'], true)) {
            Log::info('mpesa.b2b.timeout.idempotent_skip', [
                'transaction_id' => $transaction->id,
                'originator_conversation_id' => $transaction->originator_conversation_id,
                'status' => $transaction->status,
            ]);

            return;
        }

        $transaction->update([
            'result_code' => (string) data_get($this->payload, 'Result.ResultCode', 'timeout'),
            'result_desc' => (string) data_get($this->payload, 'Result.ResultDesc', 'B2B request timed out before result callback was received.'),
            'status' => 'timeout',
            'raw_callback_payload' => $this->payload,
            'processed_at' => now(),
        ]);

        Log::warning('mpesa.b2b.timeout.processed', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $transaction->originator_conversation_id,
            'conversation_id' => $transaction->conversation_id,
            'result_code' => $transaction->result_code,
        ]);
    }
}
