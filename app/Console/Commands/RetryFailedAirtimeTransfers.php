<?php

namespace App\Console\Commands;

use App\Models\AirtimeTransfer;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Services\Airtime\AirtimeTransferNotifier;
use App\Services\Airtime\StatumAirtimeClient;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class RetryFailedAirtimeTransfers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'airtime:transfers:retry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Retry failed airtime transfers that are marked retryable';

    private const int MAX_RETRY_ATTEMPTS = 3;

    /**
     * @var list<string>
     */
    private const array RETRYABLE_RESULT_CODES = ['408', '429', '500', '502', '503', '504'];

    public function __construct(
        private readonly StatumAirtimeClient $statumAirtimeClient,
        private readonly AirtimeTransferNotifier $airtimeTransferNotifier,
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $retried = 0;

        AirtimeTransfer::query()
            ->where('status', 'failed')
            ->orderBy('id')
            ->chunkById(100, function ($transfers) use (&$retried): void {
                foreach ($transfers as $transfer) {
                    if (! $this->shouldRetry($transfer)) {
                        continue;
                    }

                    $retried++;
                    $this->retryTransfer($transfer);
                }
            });

        $this->info("Retried {$retried} transfer(s).");

        return self::SUCCESS;
    }

    private function shouldRetry(AirtimeTransfer $transfer): bool
    {
        $meta = is_array($transfer->meta) ? $transfer->meta : [];
        if (($meta['retryable'] ?? false) !== true) {
            return false;
        }

        $retryAttempts = (int) ($meta['retry_attempts'] ?? 0);
        if ($retryAttempts >= self::MAX_RETRY_ATTEMPTS) {
            return false;
        }

        $nextRetryAt = $meta['next_retry_at'] ?? null;
        if (! is_string($nextRetryAt) || $nextRetryAt === '') {
            return true;
        }

        return Carbon::parse($nextRetryAt)->lessThanOrEqualTo(now());
    }

    private function retryTransfer(AirtimeTransfer $transfer): void
    {
        $meta = is_array($transfer->meta) ? $transfer->meta : [];
        $retryAttempts = (int) ($meta['retry_attempts'] ?? 0) + 1;

        try {
            $response = $this->statumAirtimeClient->send(
                recipient: $transfer->recipient,
                amount: (string) $transfer->amount,
                sender: $transfer->sender,
                callbackUrl: $this->statumAirtimeClient->callbackUrl(),
            );
        } catch (Throwable $throwable) {
            $failedRetryMeta = [
                ...$meta,
                'retry_attempts' => $retryAttempts,
                'retryable' => $retryAttempts < self::MAX_RETRY_ATTEMPTS,
                'next_retry_at' => $retryAttempts < self::MAX_RETRY_ATTEMPTS ? now()->addMinutes(10)->toISOString() : null,
                'last_retry_error' => $throwable->getMessage(),
            ];

            $transfer->update([
                'meta' => $failedRetryMeta,
            ]);

            if ($retryAttempts >= self::MAX_RETRY_ATTEMPTS) {
                $this->markEscalated($transfer, $failedRetryMeta, 'Retry attempts exhausted after provider exception.');
            }

            Log::error('airtime.transfer.retry_exception', [
                'transfer_id' => $transfer->id,
                'retry_attempts' => $retryAttempts,
                'error' => $throwable->getMessage(),
            ]);

            return;
        }

        $resultCode = (string) ($response['response_code'] ?? $response['status_code'] ?? '');
        $providerMessage = $response['response_description'] ?? $response['description'] ?? null;
        $isAccepted = filter_var($response['accepted'] ?? false, FILTER_VALIDATE_BOOL);
        $isRetryable = $this->isRetryableResultCode($resultCode);
        $shouldScheduleRetry = ! $isAccepted && $isRetryable && $retryAttempts < self::MAX_RETRY_ATTEMPTS;

        $updatedMeta = [
            ...$meta,
            'provider_response' => $response,
            'retry_attempts' => $retryAttempts,
            'retryable' => $shouldScheduleRetry,
            'next_retry_at' => $shouldScheduleRetry ? now()->addMinutes(10)->toISOString() : null,
            'last_retry_at' => now()->toISOString(),
        ];

        $transfer->update([
            'status' => $isAccepted ? 'accepted' : 'failed',
            'external_reference' => $response['transaction_id'] ?? $response['request_id'] ?? $transfer->external_reference,
            'provider_status' => $response['status'] ?? $transfer->provider_status,
            'provider_response_code' => $resultCode !== '' ? $resultCode : $transfer->provider_response_code,
            'provider_response_description' => is_string($providerMessage) ? $providerMessage : $transfer->provider_response_description,
            'result_code' => $resultCode !== '' ? $resultCode : $transfer->result_code,
            'result_description' => is_string($providerMessage) ? $providerMessage : $transfer->result_description,
            'meta' => $updatedMeta,
        ]);

        if ($isAccepted) {
            $this->applyDebitIfRequired($transfer);
            $this->airtimeTransferNotifier->notifyCompanyStakeholders(
                $transfer->fresh(),
                'retried_successfully',
                $transfer->result_description
            );

            return;
        }

        if (! $shouldScheduleRetry) {
            $this->markEscalated($transfer, $updatedMeta, 'Retry attempts exhausted or failure is non-retryable.');
        } else {
            $this->airtimeTransferNotifier->notifyCompanyStakeholders(
                $transfer->fresh(),
                'retry_scheduled',
                $transfer->result_description
            );
        }
    }

    private function applyDebitIfRequired(AirtimeTransfer $transfer): void
    {
        $meta = is_array($transfer->meta) ? $transfer->meta : [];
        $wasDebited = ($meta['billing_debited'] ?? false) === true;
        $wasReversed = ($meta['billing_reversed'] ?? false) === true;

        if ($wasDebited && ! $wasReversed) {
            return;
        }

        $company = Company::query()->find($transfer->company_id);
        if ($company === null) {
            return;
        }

        $newBalance = (float) $company->airtime_balance - (float) $transfer->amount;
        $company->update([
            'airtime_balance' => number_format($newBalance, 2, '.', ''),
        ]);

        CompanyBillingTransaction::query()->create([
            'company_id' => $company->id,
            'user_id' => $transfer->user_id,
            'type' => 'debit',
            'amount' => $transfer->amount,
            'balance_after' => number_format($newBalance, 2, '.', ''),
            'reference' => $transfer->external_reference,
            'note' => 'Airtime retry sent to '.$transfer->recipient,
            'meta' => [
                'airtime_transfer_id' => $transfer->id,
                'source' => 'retry',
            ],
        ]);

        $transfer->update([
            'meta' => [
                ...$meta,
                'billing_debited' => true,
                'billing_reversed' => false,
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function markEscalated(AirtimeTransfer $transfer, array $meta, string $reason): void
    {
        $transfer->update([
            'meta' => [
                ...$meta,
                'retryable' => false,
                'next_retry_at' => null,
                'escalated' => true,
                'escalated_at' => now()->toISOString(),
            ],
        ]);

        $this->airtimeTransferNotifier->notifyCompanyStakeholders(
            $transfer->fresh(),
            'escalated',
            $reason
        );
    }

    private function isRetryableResultCode(?string $resultCode): bool
    {
        if ($resultCode === null || $resultCode === '') {
            return false;
        }

        return in_array($resultCode, self::RETRYABLE_RESULT_CODES, true);
    }
}
