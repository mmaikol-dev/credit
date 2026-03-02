<?php

namespace App\Jobs;

use App\Models\B2BTransaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessMpesaB2BResultCallback implements ShouldQueue
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
        $conversationId = (string) data_get($result, 'ConversationID', '');
        $resultCode = (string) data_get($result, 'ResultCode', '');
        $resultDesc = (string) data_get($result, 'ResultDesc', '');
        $transactionId = (string) data_get($result, 'TransactionID', '');

        if ($originatorConversationId === '' && $conversationId === '') {
            Log::warning('mpesa.b2b.result.identifiers_missing', [
                'payload' => $this->payload,
            ]);

            return;
        }

        $transaction = B2BTransaction::query()
            ->when($originatorConversationId !== '', fn ($query) => $query->where('originator_conversation_id', $originatorConversationId))
            ->when($originatorConversationId === '' && $conversationId !== '', fn ($query) => $query->where('conversation_id', $conversationId))
            ->first();

        if ($transaction === null) {
            Log::warning('mpesa.b2b.result.transaction_missing', [
                'originator_conversation_id' => $originatorConversationId,
                'conversation_id' => $conversationId,
            ]);

            return;
        }

        $terminalStatuses = ['success', 'failed', 'timeout'];
        $incomingTransactionId = $transactionId !== '' ? $transactionId : $transaction->transaction_id;
        $isDuplicateTerminal = in_array($transaction->status, $terminalStatuses, true)
            && $transaction->transaction_id !== null
            && $incomingTransactionId === $transaction->transaction_id;

        if ($isDuplicateTerminal) {
            Log::info('mpesa.b2b.result.idempotent_skip', [
                'transaction_id' => $transaction->id,
                'originator_conversation_id' => $transaction->originator_conversation_id,
                'conversation_id' => $transaction->conversation_id,
                'provider_transaction_id' => $transaction->transaction_id,
            ]);

            return;
        }

        $resultParameters = $this->normalizeItems(data_get($result, 'ResultParameters.ResultParameter', []));
        $referenceItems = $this->normalizeItems(data_get($result, 'ReferenceData.ReferenceItem', []));

        $amount = $this->findValueFromItems($resultParameters, ['Amount', 'TransactionAmount']);
        $transactionCompletedTime = $this->findValueFromItems($resultParameters, ['TransCompletedTime', 'TransactionCompletedTime', 'BOCompletedTime']);
        $receiverPartyPublicName = $this->findValueFromItems($resultParameters, ['ReceiverPartyPublicName']);
        $debitPartyAffectedAccountBalance = $this->findValueFromItems($resultParameters, ['DebitPartyAffectedAccountBalance']);
        $billReferenceNumber = $this->findValueFromItems($referenceItems, ['BillReferenceNumber']);

        $transaction->update([
            'conversation_id' => $conversationId !== '' ? $conversationId : $transaction->conversation_id,
            'transaction_id' => $transactionId !== '' ? $transactionId : $transaction->transaction_id,
            'result_code' => $resultCode !== '' ? $resultCode : null,
            'result_desc' => $resultDesc !== '' ? $resultDesc : null,
            'status' => $resultCode === '0' ? 'success' : 'failed',
            'amount' => is_numeric($amount) ? number_format((float) $amount, 2, '.', '') : $transaction->amount,
            'transaction_completed_time' => is_scalar($transactionCompletedTime) ? (string) $transactionCompletedTime : $transaction->transaction_completed_time,
            'receiver_party_public_name' => is_scalar($receiverPartyPublicName) ? (string) $receiverPartyPublicName : $transaction->receiver_party_public_name,
            'debit_party_affected_account_balance' => is_scalar($debitPartyAffectedAccountBalance) ? (string) $debitPartyAffectedAccountBalance : $transaction->debit_party_affected_account_balance,
            'bill_reference_number' => is_scalar($billReferenceNumber) ? (string) $billReferenceNumber : $transaction->bill_reference_number,
            'raw_callback_payload' => $this->payload,
            'processed_at' => now(),
        ]);

        Log::info('mpesa.b2b.result.processed', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $transaction->originator_conversation_id,
            'conversation_id' => $transaction->conversation_id,
            'provider_transaction_id' => $transaction->transaction_id,
            'result_code' => $transaction->result_code,
            'result_desc' => $transaction->result_desc,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function normalizeItems(mixed $rawItems): array
    {
        if (! is_array($rawItems)) {
            return [];
        }

        if (array_is_list($rawItems)) {
            return array_values(array_filter($rawItems, 'is_array'));
        }

        if (array_key_exists('Key', $rawItems)) {
            return [$rawItems];
        }

        return [];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @param  list<string>  $keys
     */
    private function findValueFromItems(array $items, array $keys): mixed
    {
        foreach ($items as $item) {
            $itemKey = (string) data_get($item, 'Key', '');
            if (in_array($itemKey, $keys, true)) {
                return data_get($item, 'Value');
            }
        }

        return null;
    }
}
