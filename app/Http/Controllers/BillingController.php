<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBillingTransactionRequest;
use App\Models\Company;
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
            'statusType' => request()->session()->get('status_type', 'success'),
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
                    'can_delete' => $user->is_company_admin && in_array($transaction->type, ['top_up', 'reversal'], true),
                    'created_at' => $transaction->created_at?->toDateTimeString(),
                ]),
        ]);
    }

    public function updateTransaction(
        UpdateBillingTransactionRequest $request,
        CompanyBillingTransaction $companyBillingTransaction
    ): RedirectResponse {
        $companyId = $request->user()?->company_id;

        abort_unless($companyId !== null, 404);
        abort_unless($companyBillingTransaction->company_id === $companyId, 404);

        $companyBillingTransaction->update([
            'note' => $request->filled('note') ? $request->string('note')->toString() : null,
        ]);

        Log::info('billing.transaction.updated', [
            'transaction_id' => $companyBillingTransaction->id,
            'company_id' => $companyId,
            'user_id' => $request->user()?->id,
        ]);

        return back()
            ->with('status', 'Billing transaction updated successfully.')
            ->with('status_type', 'success');
    }

    public function destroyTransaction(CompanyBillingTransaction $companyBillingTransaction): RedirectResponse
    {
        $user = request()->user();
        $companyId = $user?->company_id;

        abort_unless($companyId !== null, 404);
        abort_unless($user?->is_company_admin === true, 403);
        abort_unless($companyBillingTransaction->company_id === $companyId, 404);

        if (! in_array($companyBillingTransaction->type, ['top_up', 'reversal'], true)) {
            return back()
                ->with('status', 'Only top-up or reversal records can be deleted.')
                ->with('status_type', 'error');
        }

        $company = Company::query()->find($companyId);
        abort_unless($company !== null, 404);

        $adjustment = (float) $companyBillingTransaction->amount;
        $newBalance = $companyBillingTransaction->type === 'top_up'
            ? (float) $company->airtime_balance - $adjustment
            : (float) $company->airtime_balance + $adjustment;

        if ($newBalance < 0) {
            return back()
                ->with('status', 'Cannot delete this transaction because it would make balance negative.')
                ->with('status_type', 'error');
        }

        $company->update([
            'airtime_balance' => number_format($newBalance, 2, '.', ''),
        ]);

        $transactionId = $companyBillingTransaction->id;
        $companyBillingTransaction->delete();

        Log::info('billing.transaction.deleted', [
            'transaction_id' => $transactionId,
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'balance_after' => number_format($newBalance, 2, '.', ''),
        ]);

        return back()
            ->with('status', 'Billing transaction deleted successfully.')
            ->with('status_type', 'success');
    }
}
