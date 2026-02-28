<?php

namespace App\Http\Controllers;

use App\Models\AirtimeTransfer;
use App\Models\CompanyBillingTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AirtimeWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        if (! hash_equals(
            (string) config('services.statum.webhook_secret'),
            (string) $request->query('token')
        )) {
            Log::warning('airtime.webhook.invalid_token', [
                'ip' => $request->ip(),
            ]);

            abort(403);
        }

        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $externalReference = $payload['transaction_id']
            ?? $payload['reference']
            ?? $payload['external_reference']
            ?? null;

        if (! is_string($externalReference) || $externalReference === '') {
            Log::warning('airtime.webhook.missing_reference', [
                'payload_keys' => array_keys($payload),
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

            return response()->noContent(202);
        }

        $status = strtolower((string) ($payload['status'] ?? $payload['result'] ?? ''));
        $currentMeta = is_array($airtimeTransfer->meta) ? $airtimeTransfer->meta : [];

        $airtimeTransfer->update([
            'status' => match ($status) {
                'success', 'successful', 'completed' => 'completed',
                'failed', 'failure', 'rejected' => 'failed',
                default => 'accepted',
            },
            'provider_status' => $payload['status'] ?? null,
            'result_code' => $payload['result_code'] ?? null,
            'result_description' => $payload['result_description'] ?? null,
            'callback_payload' => $payload,
            'meta' => [
                ...$currentMeta,
            ],
        ]);

        Log::info('airtime.webhook.transfer_updated', [
            'transfer_id' => $airtimeTransfer->id,
            'external_reference' => $externalReference,
            'status' => $airtimeTransfer->status,
            'provider_status' => $airtimeTransfer->provider_status,
            'result_code' => $airtimeTransfer->result_code,
        ]);

        $isFailed = in_array($status, ['failed', 'failure', 'rejected'], true);
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
                    ...$currentMeta,
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

        return response()->noContent();
    }
}
