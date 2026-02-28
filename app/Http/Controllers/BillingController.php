<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBillingTopUpRequest;
use App\Models\CompanyBillingTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $companyId = $user?->company_id;

        abort_unless($companyId !== null, 404);

        $company = $user->company()->firstOrFail();

        Log::debug('billing.page_viewed', [
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'is_company_admin' => $user?->is_company_admin,
        ]);

        return Inertia::render('billing/index', [
            'canTopUp' => $user->is_company_admin,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'airtime_balance' => $company->airtime_balance,
            ],
            'status' => request()->session()->get('status'),
            'transactions' => CompanyBillingTransaction::query()
                ->where('company_id', $companyId)
                ->latest()
                ->paginate(20)
                ->through(fn (CompanyBillingTransaction $transaction) => [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'balance_after' => $transaction->balance_after,
                    'note' => $transaction->note,
                    'created_at' => $transaction->created_at?->toDateTimeString(),
                ]),
        ]);
    }

    public function store(StoreBillingTopUpRequest $request): RedirectResponse
    {
        $user = $request->user();
        $company = $user?->company;

        abort_unless($company !== null, 404);

        $amount = (float) $request->input('amount');
        $newBalance = (float) $company->airtime_balance + $amount;

        $company->update([
            'airtime_balance' => number_format($newBalance, 2, '.', ''),
        ]);

        CompanyBillingTransaction::query()->create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'type' => 'top_up',
            'amount' => number_format($amount, 2, '.', ''),
            'balance_after' => number_format($newBalance, 2, '.', ''),
            'note' => $request->filled('note') ? $request->string('note')->toString() : null,
        ]);

        Log::info('billing.top_up_created', [
            'company_id' => $company->id,
            'user_id' => $user?->id,
            'amount' => number_format($amount, 2, '.', ''),
            'balance_after' => number_format($newBalance, 2, '.', ''),
        ]);

        return back()->with('status', 'Airtime balance topped up successfully.');
    }
}
