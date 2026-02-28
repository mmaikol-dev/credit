<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAirtimeTransferRequest;
use App\Models\AirtimeTransfer;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Services\Airtime\StatumAirtimeClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AirtimeTransferController extends Controller
{
    public function __construct(private readonly StatumAirtimeClient $statumAirtimeClient) {}

    public function index(): Response
    {
        $companyId = request()->user()?->company_id;

        return Inertia::render('airtime/transfers/index', [
            'status' => request()->session()->get('status'),
            'statusType' => request()->session()->get('status_type', 'success'),
            'company' => [
                'airtime_balance' => request()->user()?->company?->airtime_balance ?? '0.00',
            ],
            'transfers' => AirtimeTransfer::query()
                ->where('company_id', $companyId)
                ->latest()
                ->paginate(20)
                ->through(fn (AirtimeTransfer $transfer) => [
                    'id' => $transfer->id,
                    'recipient' => $transfer->recipient,
                    'sender' => $transfer->sender,
                    'amount' => $transfer->amount,
                    'status' => $transfer->status,
                    'created_at' => $transfer->created_at?->toDateTimeString(),
                ]),
        ]);
    }

    public function store(StoreAirtimeTransferRequest $request): JsonResponse|RedirectResponse
    {
        $companyId = $this->resolveCompanyId();
        $company = Company::query()->find($companyId);
        $requestedAmount = number_format((float) $request->input('amount'), 2, '.', '');
        $recipient = $request->string('recipient')->toString();

        Log::info('airtime.transfer.requested', [
            'company_id' => $companyId,
            'user_id' => $request->user()?->id,
            'recipient' => $this->maskPhone($recipient),
            'amount' => $requestedAmount,
        ]);

        if ($company === null) {
            Log::warning('airtime.transfer.company_missing', [
                'company_id' => $companyId,
                'user_id' => $request->user()?->id,
            ]);

            abort(404);
        }

        if ((float) $company->airtime_balance < (float) $requestedAmount) {
            Log::warning('airtime.transfer.insufficient_balance', [
                'company_id' => $company->id,
                'user_id' => $request->user()?->id,
                'recipient' => $this->maskPhone($recipient),
                'amount' => $requestedAmount,
                'current_balance' => $company->airtime_balance,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Insufficient airtime balance. Please top up first.',
                ], 422);
            }

            return back()
                ->with('status', 'Insufficient airtime balance. Please top up first.')
                ->with('status_type', 'error');
        }

        $airtimeTransfer = AirtimeTransfer::query()->create([
            'company_id' => $companyId,
            'user_id' => $request->user()?->id,
            'recipient' => $recipient,
            'sender' => $request->filled('sender') ? $request->string('sender')->toString() : null,
            'amount' => $requestedAmount,
            'status' => 'queued',
        ]);

        Log::info('airtime.transfer.created', [
            'transfer_id' => $airtimeTransfer->id,
            'company_id' => $companyId,
            'user_id' => $request->user()?->id,
            'recipient' => $this->maskPhone($airtimeTransfer->recipient),
            'amount' => $airtimeTransfer->amount,
        ]);

        try {
            $response = $this->statumAirtimeClient->send(
                recipient: $airtimeTransfer->recipient,
                amount: (string) $airtimeTransfer->amount,
                sender: $airtimeTransfer->sender,
                callbackUrl: $this->statumAirtimeClient->callbackUrl(),
            );
        } catch (Throwable $throwable) {
            $airtimeTransfer->update([
                'status' => 'failed',
                'meta' => [
                    'exception' => $throwable->getMessage(),
                ],
            ]);

            Log::error('airtime.transfer.provider_error', [
                'transfer_id' => $airtimeTransfer->id,
                'company_id' => $companyId,
                'user_id' => $request->user()?->id,
                'error' => $throwable->getMessage(),
                'exception' => $throwable::class,
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Airtime request failed before provider acceptance.',
                    'transfer' => $airtimeTransfer->fresh(),
                ], 502);
            }

            return back()
                ->with('status', 'Airtime request failed before provider acceptance.')
                ->with('status_type', 'error');
        }

        $isAccepted = filter_var($response['accepted'] ?? false, FILTER_VALIDATE_BOOL);

        $airtimeTransfer->update([
            'status' => $isAccepted ? 'accepted' : 'failed',
            'external_reference' => $response['transaction_id'] ?? null,
            'provider_status' => $response['status'] ?? null,
            'provider_response_code' => $response['response_code'] ?? null,
            'provider_response_description' => $response['response_description'] ?? null,
            'meta' => [
                'provider_response' => $response,
                'billing_debited' => false,
                'billing_reversed' => false,
            ],
        ]);

        Log::info('airtime.transfer.provider_response', [
            'transfer_id' => $airtimeTransfer->id,
            'company_id' => $companyId,
            'accepted' => $isAccepted,
            'provider_status' => $airtimeTransfer->provider_status,
            'provider_response_code' => $airtimeTransfer->provider_response_code,
            'external_reference' => $airtimeTransfer->external_reference,
        ]);

        if ($isAccepted) {
            $newBalance = (float) $company->airtime_balance - (float) $airtimeTransfer->amount;

            $company->update([
                'airtime_balance' => number_format($newBalance, 2, '.', ''),
            ]);

            CompanyBillingTransaction::query()->create([
                'company_id' => $company->id,
                'user_id' => $request->user()?->id,
                'type' => 'debit',
                'amount' => $airtimeTransfer->amount,
                'balance_after' => number_format($newBalance, 2, '.', ''),
                'reference' => $airtimeTransfer->external_reference,
                'note' => 'Airtime sent to '.$airtimeTransfer->recipient,
                'meta' => [
                    'airtime_transfer_id' => $airtimeTransfer->id,
                ],
            ]);

            $airtimeTransfer->update([
                'meta' => [
                    ...($airtimeTransfer->meta ?? []),
                    'billing_debited' => true,
                    'billing_reversed' => false,
                ],
            ]);

            Log::info('airtime.transfer.wallet_debited', [
                'transfer_id' => $airtimeTransfer->id,
                'company_id' => $company->id,
                'debit_amount' => $airtimeTransfer->amount,
                'balance_after' => number_format($newBalance, 2, '.', ''),
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $isAccepted ? 'Airtime request accepted.' : 'Airtime request rejected.',
                'transfer' => $airtimeTransfer->fresh(),
            ], $isAccepted ? 201 : 422);
        }

        return back()
            ->with('status', $isAccepted ? 'Airtime request accepted.' : 'Airtime request rejected.')
            ->with('status_type', $isAccepted ? 'success' : 'error');
    }

    private function resolveCompanyId(): ?int
    {
        $user = request()->user();
        if ($user === null) {
            return null;
        }

        if ($user->company_id !== null) {
            return $user->company_id;
        }

        $fallbackCompany = Company::query()->create([
            'name' => $user->name.' Company',
            'slug' => 'company-'.substr(md5((string) $user->id), 0, 8),
            'owner_id' => $user->id,
        ]);

        $user->forceFill([
            'company_id' => $fallbackCompany->id,
        ])->save();

        Log::info('airtime.transfer.fallback_company_created', [
            'company_id' => $fallbackCompany->id,
            'owner_user_id' => $user->id,
        ]);

        return $fallbackCompany->id;
    }

    private function maskPhone(string $phone): string
    {
        $length = strlen($phone);
        if ($length <= 4) {
            return '****';
        }

        return substr($phone, 0, 3).str_repeat('*', max(0, $length - 7)).substr($phone, -4);
    }
}
