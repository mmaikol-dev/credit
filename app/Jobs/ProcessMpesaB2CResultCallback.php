<?php

namespace App\Jobs;

use App\Models\B2CTransaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessMpesaB2CResultCallback implements ShouldQueue
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
        /** @var array<string, mixed> $result */
        $result = data_get($this->payload, 'Result', []);

        $originatorConversationId = (string) data_get($result, 'OriginatorConversationID', '');
        if ($originatorConversationId === '') {
            Log::warning('mpesa.b2c.result.originator_id_missing', [
                'payload' => $this->payload,
            ]);

            return;
        }

        $transaction = B2CTransaction::query()
            ->where('originator_conversation_id', $originatorConversationId)
            ->first();

        if ($transaction === null) {
            Log::warning('mpesa.b2c.result.transaction_missing', [
                'originator_conversation_id' => $originatorConversationId,
            ]);

            return;
        }

        if (in_array($transaction->status, ['success', 'failed', 'timeout'], true)) {
            Log::info('mpesa.b2c.result.idempotent_skip', [
                'originator_conversation_id' => $originatorConversationId,
                'status' => $transaction->status,
            ]);

            return;
        }

        $resultCode = (string) data_get($result, 'ResultCode', '');
        $resultDesc = (string) data_get($result, 'ResultDesc', '');
        $conversationId = (string) data_get($result, 'ConversationID', '');
        $transactionId = (string) data_get($result, 'TransactionID', '');
        $callbackAmount = $this->extractResultParameterValue('TransactionAmount');
        $receiverPartyPublicName = $this->extractResultParameterValue('ReceiverPartyPublicName');

        $transaction->update([
            'conversation_id' => $conversationId !== '' ? $conversationId : $transaction->conversation_id,
            'transaction_id' => $transactionId !== '' ? $transactionId : $transaction->transaction_id,
            'result_code' => $resultCode !== '' ? $resultCode : null,
            'result_desc' => $resultDesc !== '' ? $resultDesc : null,
            'status' => $resultCode === '0' ? 'success' : 'failed',
            'raw_callback_payload' => $this->payload,
            'amount' => is_numeric($callbackAmount) ? number_format((float) $callbackAmount, 2, '.', '') : $transaction->amount,
        ]);

        Log::info('mpesa.b2c.result.processed', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $originatorConversationId,
            'conversation_id' => $conversationId,
            'transaction_id_provider' => $transactionId,
            'result_code' => $resultCode,
            'transaction_amount' => $callbackAmount,
            'receiver_party_public_name' => $receiverPartyPublicName,
        ]);
    }

    private function extractResultParameterValue(string $parameterKey): mixed
    {
        $resultParameters = data_get($this->payload, 'Result.ResultParameters.ResultParameter', []);

        if (! is_array($resultParameters)) {
            return null;
        }

        foreach ($resultParameters as $resultParameter) {
            if (! is_array($resultParameter)) {
                continue;
            }

            if ((string) data_get($resultParameter, 'Key') === $parameterKey) {
                return data_get($resultParameter, 'Value');
            }
        }

        return null;
    }
}
