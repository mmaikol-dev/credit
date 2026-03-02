<?php

namespace App\Http\Controllers;

use App\Models\AirtimeTransfer;
use App\Models\AirtimeWebhookEvent;
use App\Models\CompanyBillingTransaction;
use App\Services\Airtime\AirtimeTransferNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AirtimeWebhookController extends Controller
{
    private const int MAX_RETRY_ATTEMPTS = 3;

    /**
     * @var list<string>
     */
    private const array RETRYABLE_RESULT_CODES = ['408', '429', '500', '502', '503', '504'];

    public function __construct(private readonly AirtimeTransferNotifier $airtimeTransferNotifier) {}

    public function handle(Request $request): Response
    {
        $secret = (string) config('services.statum.webhook_secret');
        if ($secret === '') {
            Log::error('airtime.webhook.secret_missing');

            abort(503);
        }

        $providedToken = (string) ($request->query('token') ?? $request->header('X-Webhook-Token') ?? $request->bearerToken());
        if (! hash_equals($secret, $providedToken)) {
            Log::warning('airtime.webhook.invalid_token', [
                'ip' => $request->ip(),
            ]);

            abort(403);
        }

        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $providerStatus = $this->resolvePayloadValue($payload, [
            'status',
            'result',
            'data.status',
            'data.result',
        ]);
        $resultCode = $this->resolvePayloadValue($payload, [
            'result_code',
            'status_code',
            'response_code',
            'code',
            'data.result_code',
            'data.status_code',
            'data.response_code',
            'data.code',
        ]);
        $providerMessage = $this->resolvePayloadValue($payload, [
            'result_desc',
            'result_description',
            'response_description',
            'message',
            'description',
            'error_message',
            'error',
            'data.result_desc',
            'data.result_description',
            'data.response_description',
            'data.message',
            'data.description',
            'data.error_message',
            'data.error',
        ]);
        $externalReference = $this->resolvePayloadValue($payload, [
            'request_id',
            'transaction_id',
            'reference',
            'external_reference',
            'data.request_id',
            'data.transaction_id',
            'data.reference',
            'data.external_reference',
        ]);
        $charge = data_get($payload, 'charge', data_get($payload, 'data.charge'));
        $accountBalance = data_get($payload, 'account_balance', data_get($payload, 'data.account_balance'));

        $webhookEvent = AirtimeWebhookEvent::query()->create([
            'external_reference' => $externalReference,
            'provider_status' => $providerStatus,
            'result_code' => $resultCode,
            'result_description' => $providerMessage,
            'charge' => is_numeric($charge) ? (string) $charge : null,
            'account_balance' => is_numeric($accountBalance) ? (string) $accountBalance : null,
            'processing_status' => 'received',
            'payload' => $payload,
        ]);

        if ($externalReference === null) {
            Log::warning('airtime.webhook.missing_reference', [
                'payload_keys' => array_keys($payload),
            ]);

            $webhookEvent->update([
                'processing_status' => 'missing_reference',
                'processed_at' => now(),
            ]);

            return response()->noContent(202);
        }

        $airtimeTransfer = AirtimeTransfer::query()
            ->where('external_reference', $externalReference)
            ->first();

        if ($airtimeTransfer === null) {
            Log::warning('airtime.webhook.transfer_not_found', [
                'external_reference' => $externalReference,
            ]);

            $webhookEvent->update([
                'processing_status' => 'transfer_not_found',
                'processed_at' => now(),
            ]);

            return response()->noContent(202);
        }

        $normalizedStatus = $this->normalizeTransferStatus($providerStatus, $resultCode);
        $currentMeta = is_array($airtimeTransfer->meta) ? $airtimeTransfer->meta : [];
        $currentRetryAttempts = (int) ($currentMeta['retry_attempts'] ?? 0);
        $shouldScheduleRetry = $normalizedStatus === 'failed'
            && $this->isRetryableResultCode($resultCode)
            && $currentRetryAttempts < self::MAX_RETRY_ATTEMPTS;
        $shouldEscalate = $normalizedStatus === 'failed' && ! $shouldScheduleRetry;
        $updatedMeta = [
            ...$currentMeta,
            'charge' => $charge,
            'account_balance' => $accountBalance,
            'retryable' => $shouldScheduleRetry,
            'next_retry_at' => $shouldScheduleRetry ? now()->addMinutes(5)->toISOString() : null,
            'escalated' => $shouldEscalate ? true : ($currentMeta['escalated'] ?? false),
            'escalated_at' => $shouldEscalate ? now()->toISOString() : ($currentMeta['escalated_at'] ?? null),
        ];

        $airtimeTransfer->update([
            'status' => $normalizedStatus,
            'provider_status' => $providerStatus ?? $resultCode,
            'provider_response_code' => $resultCode,
            'provider_response_description' => $providerMessage,
            'result_code' => $resultCode,
            'result_description' => $providerMessage,
            'callback_payload' => $payload,
            'meta' => $updatedMeta,
        ]);

        Log::info('airtime.webhook.transfer_updated', [
            'transfer_id' => $airtimeTransfer->id,
            'external_reference' => $externalReference,
            'status' => $airtimeTransfer->status,
            'provider_status' => $airtimeTransfer->provider_status,
            'result_code' => $airtimeTransfer->result_code,
            'message' => $airtimeTransfer->result_description,
        ]);

        $isFailed = $normalizedStatus === 'failed';
        $wasDebited = ($currentMeta['billing_debited'] ?? false) === true;
        $wasReversed = ($currentMeta['billing_reversed'] ?? false) === true;

        if ($isFailed && $wasDebited && ! $wasReversed && $airtimeTransfer->company !== null) {
            $company = $airtimeTransfer->company;
            $newBalance = (float) $company->airtime_balance + (float) $airtimeTransfer->amount;

            $company->update([
                'airtime_balance' => number_format($newBalance, 2, '.', ''),
            ]);

            CompanyBillingTransaction::query()->create([
                'company_id' => $company->id,
                'user_id' => $airtimeTransfer->user_id,
                'type' => 'reversal',
                'amount' => $airtimeTransfer->amount,
                'balance_after' => number_format($newBalance, 2, '.', ''),
                'reference' => $airtimeTransfer->external_reference,
                'note' => 'Airtime reversal for failed transfer',
                'meta' => [
                    'airtime_transfer_id' => $airtimeTransfer->id,
                ],
            ]);

            $airtimeTransfer->update([
                'meta' => [
                    ...$updatedMeta,
                    'billing_reversed' => true,
                ],
            ]);

            Log::info('airtime.webhook.wallet_reversal', [
                'transfer_id' => $airtimeTransfer->id,
                'company_id' => $company->id,
                'reversal_amount' => $airtimeTransfer->amount,
                'balance_after' => number_format($newBalance, 2, '.', ''),
            ]);
        }

        $webhookEvent->update([
            'airtime_transfer_id' => $airtimeTransfer->id,
            'processing_status' => $shouldEscalate ? 'escalated' : ($shouldScheduleRetry ? 'retry_scheduled' : 'processed'),
            'processed_at' => now(),
        ]);

        if ($normalizedStatus === 'completed') {
            $this->airtimeTransferNotifier->notifyCompanyStakeholders(
                $airtimeTransfer->fresh(),
                'completed',
                $airtimeTransfer->result_description
            );
        }

        if ($normalizedStatus === 'failed') {
            $eventType = $shouldEscalate ? 'escalated' : ($shouldScheduleRetry ? 'retry_scheduled' : 'failed');
            $this->airtimeTransferNotifier->notifyCompanyStakeholders(
                $airtimeTransfer->fresh(),
                $eventType,
                $airtimeTransfer->result_description
            );
        }

        return response()->noContent();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $paths
     */
    private function resolvePayloadValue(array $payload, array $paths): ?string
    {
        foreach ($paths as $path) {
            $value = data_get($payload, $path);
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function normalizeTransferStatus(?string $providerStatus, ?string $resultCode): string
    {
        if ($resultCode !== null && $resultCode !== '') {
            return $resultCode === '200' ? 'completed' : 'failed';
        }

        $normalizedStatus = strtolower((string) $providerStatus);

        return match ($normalizedStatus) {
            'success', 'successful', 'completed' => 'completed',
            'failed', 'failure', 'rejected', 'error' => 'failed',
            default => 'accepted',
        };
    }

    private function isRetryableResultCode(?string $resultCode): bool
    {
        if ($resultCode === null) {
            return false;
        }

        return in_array($resultCode, self::RETRYABLE_RESULT_CODES, true);
    }
}
