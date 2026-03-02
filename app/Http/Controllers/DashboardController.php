<?php

namespace App\Http\Controllers;

use App\Models\AirtimeTransfer;
use App\Models\AirtimeWebhookEvent;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $companyId = $user?->company_id;

        $companyTransfers = AirtimeTransfer::query()
            ->where('company_id', $companyId);
        $totalTransfers = (clone $companyTransfers)->count();
        $completedTransfers = (clone $companyTransfers)->where('status', 'completed')->count();
        $failedTransfers = (clone $companyTransfers)->where('status', 'failed')->count();
        $retryPendingTransfers = (clone $companyTransfers)
            ->where('status', 'failed')
            ->whereJsonContains('meta->retryable', true)
            ->count();
        $escalatedTransfers = (clone $companyTransfers)
            ->where('status', 'failed')
            ->whereJsonContains('meta->escalated', true)
            ->count();

        return Inertia::render('dashboard', [
            'summary' => [
                'airtimeBalance' => $user?->company?->airtime_balance ?? '0.00',
                'totalTransfers' => $totalTransfers,
                'pendingTransfers' => (clone $companyTransfers)->whereIn('status', ['queued', 'accepted'])->count(),
                'completedTransfers' => $completedTransfers,
                'failedTransfers' => $failedTransfers,
                'retryPendingTransfers' => $retryPendingTransfers,
                'escalatedTransfers' => $escalatedTransfers,
                'successRate' => $totalTransfers > 0 ? round(($completedTransfers / $totalTransfers) * 100, 2) : 0.0,
                'totalWebhookCharges' => AirtimeWebhookEvent::query()
                    ->whereIn('airtime_transfer_id', AirtimeTransfer::query()->where('company_id', $companyId)->select('id'))
                    ->sum('charge'),
                'latestProviderBalance' => AirtimeWebhookEvent::query()
                    ->whereIn('airtime_transfer_id', AirtimeTransfer::query()->where('company_id', $companyId)->select('id'))
                    ->latest()
                    ->value('account_balance'),
            ],
            'failureReasons' => AirtimeTransfer::query()
                ->where('company_id', $companyId)
                ->where('status', 'failed')
                ->whereNotNull('result_description')
                ->selectRaw('result_description, COUNT(*) as failure_count')
                ->groupBy('result_description')
                ->orderByDesc('failure_count')
                ->limit(5)
                ->get()
                ->map(fn (AirtimeTransfer $transfer): array => [
                    'reason' => $transfer->result_description,
                    'count' => (int) $transfer->failure_count,
                ]),
            'recentTransfers' => AirtimeTransfer::query()
                ->where('company_id', $companyId)
                ->latest()
                ->limit(10)
                ->get([
                    'id',
                    'recipient',
                    'amount',
                    'status',
                    'created_at',
                ]),
        ]);
    }
}
