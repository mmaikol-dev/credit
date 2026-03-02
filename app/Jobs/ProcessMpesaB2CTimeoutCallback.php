<?php

namespace App\Jobs;

use App\Models\B2CTransaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessMpesaB2CTimeoutCallback implements ShouldQueue
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
        $resultCode = (string) data_get($this->payload, 'Result.ResultCode', 'timeout');
        $resultDescription = (string) data_get($this->payload, 'Result.ResultDesc', 'B2C request timed out before completion callback was received.');

        if ($originatorConversationId === '') {
            Log::warning('mpesa.b2c.timeout.originator_id_missing', [
                'payload' => $this->payload,
            ]);

            return;
        }

        $transaction = B2CTransaction::query()
            ->where('originator_conversation_id', $originatorConversationId)
            ->first();

        if ($transaction === null) {
            Log::warning('mpesa.b2c.timeout.transaction_missing', [
                'originator_conversation_id' => $originatorConversationId,
            ]);

            return;
        }

        if (in_array($transaction->status, ['success', 'failed', 'timeout'], true)) {
            Log::info('mpesa.b2c.timeout.idempotent_skip', [
                'originator_conversation_id' => $originatorConversationId,
                'status' => $transaction->status,
            ]);

            return;
        }

        $transaction->update([
            'result_code' => $resultCode,
            'result_desc' => $resultDescription,
            'status' => 'timeout',
            'raw_callback_payload' => $this->payload,
        ]);

        Log::warning('mpesa.b2c.timeout.processed', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $originatorConversationId,
            'result_code' => $resultCode,
            'result_desc' => $resultDescription,
        ]);
    }
}
