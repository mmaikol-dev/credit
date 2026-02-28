<?php

namespace App\Http\Controllers;

use App\Models\AirtimeTransfer;
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

        return Inertia::render('dashboard', [
            'summary' => [
                'airtimeBalance' => $user?->company?->airtime_balance ?? '0.00',
                'totalTransfers' => (clone $companyTransfers)->count(),
                'pendingTransfers' => (clone $companyTransfers)->whereIn('status', ['queued', 'accepted'])->count(),
                'completedTransfers' => (clone $companyTransfers)->where('status', 'completed')->count(),
                'failedTransfers' => (clone $companyTransfers)->where('status', 'failed')->count(),
            ],
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
