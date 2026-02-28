<?php

namespace App\Console\Commands;

use App\Models\AirtimeSchedule;
use App\Models\AirtimeTransfer;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Services\Airtime\StatumAirtimeClient;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessAirtimeSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'airtime:schedules:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process due airtime schedules';

    /**
     * Execute the console command.
     */
    public function __construct(private readonly StatumAirtimeClient $statumAirtimeClient)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $processed = 0;

        AirtimeSchedule::query()
            ->where('status', 'active')
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($schedules) use (&$processed): void {
                foreach ($schedules as $schedule) {
                    $processed++;
                    $this->processSchedule($schedule);
                }
            });

        $this->info("Processed {$processed} schedule(s).");

        return self::SUCCESS;
    }

    private function processSchedule(AirtimeSchedule $schedule): void
    {
        $company = Company::query()->find($schedule->company_id);
        if ($company === null) {
            $schedule->update([
                'status' => 'failed',
                'last_error' => 'Company not found.',
            ]);

            Log::error('airtime.schedule.company_missing', [
                'schedule_id' => $schedule->id,
                'company_id' => $schedule->company_id,
            ]);

            return;
        }

        if ((float) $company->airtime_balance < (float) $schedule->amount) {
            $schedule->update([
                'last_error' => 'Insufficient airtime balance.',
            ]);

            Log::warning('airtime.schedule.insufficient_balance', [
                'schedule_id' => $schedule->id,
                'company_id' => $schedule->company_id,
                'current_balance' => $company->airtime_balance,
                'amount' => $schedule->amount,
            ]);

            return;
        }

        $transfer = AirtimeTransfer::query()->create([
            'company_id' => $schedule->company_id,
            'user_id' => $schedule->user_id,
            'recipient' => $schedule->recipient,
            'sender' => $schedule->sender,
            'amount' => $schedule->amount,
            'status' => 'queued',
            'meta' => [
                'source' => 'schedule',
                'airtime_schedule_id' => $schedule->id,
            ],
        ]);

        try {
            $providerResponse = $this->statumAirtimeClient->send(
                recipient: $schedule->recipient,
                amount: (string) $schedule->amount,
                sender: $schedule->sender,
                callbackUrl: $this->statumAirtimeClient->callbackUrl(),
            );
        } catch (Throwable $throwable) {
            $transfer->update([
                'status' => 'failed',
                'meta' => [
                    ...($transfer->meta ?? []),
                    'exception' => $throwable->getMessage(),
                ],
            ]);

            $schedule->update([
                'last_error' => $throwable->getMessage(),
            ]);

            Log::error('airtime.schedule.provider_error', [
                'schedule_id' => $schedule->id,
                'transfer_id' => $transfer->id,
                'company_id' => $schedule->company_id,
                'error' => $throwable->getMessage(),
                'exception' => $throwable::class,
            ]);

            return;
        }

        $isAccepted = filter_var($providerResponse['accepted'] ?? false, FILTER_VALIDATE_BOOL);

        $transfer->update([
            'status' => $isAccepted ? 'accepted' : 'failed',
            'external_reference' => $providerResponse['transaction_id'] ?? null,
            'provider_status' => $providerResponse['status'] ?? null,
            'provider_response_code' => $providerResponse['response_code'] ?? null,
            'provider_response_description' => $providerResponse['response_description'] ?? null,
            'meta' => [
                ...($transfer->meta ?? []),
                'provider_response' => $providerResponse,
                'billing_debited' => false,
                'billing_reversed' => false,
            ],
        ]);

        if ($isAccepted) {
            $newBalance = (float) $company->airtime_balance - (float) $schedule->amount;
            $company->update([
                'airtime_balance' => number_format($newBalance, 2, '.', ''),
            ]);

            CompanyBillingTransaction::query()->create([
                'company_id' => $company->id,
                'user_id' => $schedule->user_id,
                'type' => 'debit',
                'amount' => $schedule->amount,
                'balance_after' => number_format($newBalance, 2, '.', ''),
                'reference' => $transfer->external_reference,
                'note' => 'Scheduled airtime sent to '.$schedule->recipient,
                'meta' => [
                    'airtime_transfer_id' => $transfer->id,
                    'airtime_schedule_id' => $schedule->id,
                ],
            ]);

            $transfer->update([
                'meta' => [
                    ...($transfer->meta ?? []),
                    'billing_debited' => true,
                ],
            ]);
        }

        $nextRunAt = $this->resolveNextRunAt($schedule);

        $schedule->update([
            'status' => $nextRunAt === null ? 'completed' : 'active',
            'last_error' => null,
            'last_run_at' => now(),
            'next_run_at' => $nextRunAt?->toDateTimeString(),
            'occurrences_count' => $schedule->occurrences_count + 1,
        ]);

        Log::info('airtime.schedule.processed', [
            'schedule_id' => $schedule->id,
            'transfer_id' => $transfer->id,
            'company_id' => $schedule->company_id,
            'accepted' => $isAccepted,
            'status' => $schedule->fresh()->status,
            'next_run_at' => $nextRunAt?->toDateTimeString(),
        ]);
    }

    private function resolveNextRunAt(AirtimeSchedule $schedule): ?Carbon
    {
        if ($schedule->schedule_type === 'one_time') {
            return null;
        }

        $newCount = $schedule->occurrences_count + 1;
        if ($schedule->max_occurrences !== null && $newCount >= $schedule->max_occurrences) {
            return null;
        }

        $current = $schedule->next_run_at instanceof Carbon
            ? $schedule->next_run_at->copy()
            : now();

        return match ($schedule->recurrence) {
            'weekly' => $current->addWeek(),
            'monthly' => $current->addMonth(),
            default => $current->addDay(),
        };
    }
}
