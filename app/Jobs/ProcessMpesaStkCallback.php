<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Models\MpesaStkTopUpTransaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessMpesaStkCallback implements ShouldQueue
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
        /** @var array<string, mixed> $callback */
        $callback = data_get($this->payload, 'Body.stkCallback', []);

        $checkoutRequestId = (string) data_get($callback, 'CheckoutRequestID', '');
        $merchantRequestId = (string) data_get($callback, 'MerchantRequestID', '');

        if ($checkoutRequestId === '' && $merchantRequestId === '') {
            Log::warning('mpesa.stk.callback.identifiers_missing');

            return;
        }

        $transaction = MpesaStkTopUpTransaction::query()
            ->when($checkoutRequestId !== '', fn ($query) => $query->where('checkout_request_id', $checkoutRequestId))
            ->when($checkoutRequestId === '' && $merchantRequestId !== '', fn ($query) => $query->where('merchant_request_id', $merchantRequestId))
            ->first();

        if ($transaction === null) {
            Log::warning('mpesa.stk.callback.transaction_not_found', [
                'checkout_request_id' => $checkoutRequestId,
                'merchant_request_id' => $merchantRequestId,
            ]);

            return;
        }

        DB::transaction(function () use ($transaction, $callback, $checkoutRequestId, $merchantRequestId): void {
            $lockedTransaction = MpesaStkTopUpTransaction::query()
                ->whereKey($transaction->id)
                ->lockForUpdate()
                ->first();

            if ($lockedTransaction === null) {
                return;
            }

            if (in_array($lockedTransaction->status, ['success', 'failed', 'timeout'], true)) {
                Log::info('mpesa.stk.callback.idempotent_skip', [
                    'transaction_id' => $lockedTransaction->id,
                    'company_id' => $lockedTransaction->company_id,
                    'checkout_request_id' => $lockedTransaction->checkout_request_id,
                    'status' => $lockedTransaction->status,
                ]);

                return;
            }

            $resultCode = (string) data_get($callback, 'ResultCode', '');
            $resultDesc = (string) data_get($callback, 'ResultDesc', '');
            $callbackMetadataItems = $this->normalizeMetadataItems(data_get($callback, 'CallbackMetadata.Item', []));
            $mpesaReceiptNumber = $this->metadataValue($callbackMetadataItems, 'MpesaReceiptNumber');
            $callbackAmount = $this->metadataValue($callbackMetadataItems, 'Amount');
            $phoneNumber = $this->metadataValue($callbackMetadataItems, 'PhoneNumber');
            $transactionDate = $this->metadataValue($callbackMetadataItems, 'TransactionDate');
            $resolvedStatus = $this->resolveStatus($resultCode, $resultDesc);

            if ($resolvedStatus === 'success') {
                $company = Company::query()->whereKey($lockedTransaction->company_id)->lockForUpdate()->first();

                if ($company === null) {
                    $lockedTransaction->update([
                        'status' => 'failed',
                        'result_code' => $resultCode !== '' ? $resultCode : null,
                        'result_desc' => 'Top-up callback matched but company record is missing.',
                        'raw_callback_payload' => $this->payload,
                        'processed_at' => now(),
                    ]);

                    return;
                }

                $creditAmount = $lockedTransaction->amount;
                if (is_numeric($callbackAmount)) {
                    $creditAmount = number_format((float) $callbackAmount, 2, '.', '');
                }

                $newBalance = (float) $company->airtime_balance + (float) $creditAmount;
                $company->update([
                    'airtime_balance' => number_format($newBalance, 2, '.', ''),
                ]);

                CompanyBillingTransaction::query()->create([
                    'company_id' => $company->id,
                    'user_id' => $lockedTransaction->user_id,
                    'type' => 'top_up',
                    'amount' => $creditAmount,
                    'balance_after' => number_format($newBalance, 2, '.', ''),
                    'reference' => $mpesaReceiptNumber !== '' ? $mpesaReceiptNumber : ($checkoutRequestId !== '' ? $checkoutRequestId : $merchantRequestId),
                    'note' => 'Mpesa STK wallet top up',
                    'meta' => [
                        'mpesa_stk_top_up_transaction_id' => $lockedTransaction->id,
                        'account_reference' => $lockedTransaction->account_reference,
                        'checkout_request_id' => $checkoutRequestId !== '' ? $checkoutRequestId : $lockedTransaction->checkout_request_id,
                        'merchant_request_id' => $merchantRequestId !== '' ? $merchantRequestId : $lockedTransaction->merchant_request_id,
                        'phone_number' => $phoneNumber,
                    ],
                ]);
            }

            $lockedTransaction->update([
                'merchant_request_id' => $merchantRequestId !== '' ? $merchantRequestId : $lockedTransaction->merchant_request_id,
                'checkout_request_id' => $checkoutRequestId !== '' ? $checkoutRequestId : $lockedTransaction->checkout_request_id,
                'mpesa_receipt_number' => $mpesaReceiptNumber !== '' ? $mpesaReceiptNumber : $lockedTransaction->mpesa_receipt_number,
                'phone_number' => $phoneNumber !== '' ? $phoneNumber : $lockedTransaction->phone_number,
                'result_code' => $resultCode !== '' ? $resultCode : null,
                'result_desc' => $resultDesc !== '' ? $resultDesc : null,
                'transaction_date' => $transactionDate !== '' ? $transactionDate : null,
                'status' => $resolvedStatus,
                'raw_callback_payload' => $this->payload,
                'processed_at' => now(),
            ]);

            Log::info('mpesa.stk.callback.processed', [
                'transaction_id' => $lockedTransaction->id,
                'company_id' => $lockedTransaction->company_id,
                'checkout_request_id' => $lockedTransaction->checkout_request_id,
                'result_code' => $resultCode,
                'status' => $resolvedStatus,
            ]);
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function normalizeMetadataItems(mixed $rawItems): array
    {
        if (! is_array($rawItems)) {
            return [];
        }

        if (array_is_list($rawItems)) {
            return array_values(array_filter($rawItems, 'is_array'));
        }

        if (array_key_exists('Name', $rawItems)) {
            return [$rawItems];
        }

        return [];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function metadataValue(array $items, string $name): string
    {
        foreach ($items as $item) {
            if ((string) data_get($item, 'Name', '') !== $name) {
                continue;
            }

            $value = data_get($item, 'Value');

            return is_scalar($value) ? (string) $value : '';
        }

        return '';
    }

    private function resolveStatus(string $resultCode, string $resultDesc): string
    {
        if ($resultCode === '0') {
            return 'success';
        }

        if (str_contains(strtolower($resultDesc), 'timeout')) {
            return 'timeout';
        }

        return 'failed';
    }
}
