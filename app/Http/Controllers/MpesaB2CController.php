<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreB2CPaymentRequest;
use App\Models\B2CTransaction;
use App\Services\Mpesa\MpesaB2CService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class MpesaB2CController extends Controller
{
    public function __construct(private readonly MpesaB2CService $mpesaB2CService) {}

    public function index(): Response
    {
        $companyId = request()->user()?->company_id;
        $userId = request()->user()?->id;

        $transactions = B2CTransaction::query()
            ->when($companyId !== null, fn ($query) => $query->where('company_id', $companyId))
            ->when($companyId === null && $userId !== null, fn ($query) => $query->where('user_id', $userId))
            ->latest()
            ->paginate(20)
            ->through(fn (B2CTransaction $transaction): array => [
                'id' => $transaction->id,
                'originator_conversation_id' => $transaction->originator_conversation_id,
                'conversation_id' => $transaction->conversation_id,
                'transaction_id' => $transaction->transaction_id,
                'phone_number' => $transaction->phone_number,
                'amount' => $transaction->amount,
                'result_code' => $transaction->result_code,
                'result_desc' => $transaction->result_desc,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('mpesa/b2c/index', [
            'status' => request()->session()->get('status'),
            'statusType' => request()->session()->get('status_type', 'success'),
            'transactions' => $transactions,
        ]);
    }

    public function store(StoreB2CPaymentRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $result = $this->mpesaB2CService->sendPayment(
                phoneNumber: $request->string('phone_number')->toString(),
                amount: number_format((float) $request->input('amount'), 2, '.', ''),
                remarks: $request->string('remarks')->toString(),
                occasion: $request->string('occasion')->toString(),
                commandId: $request->string('command_id')->toString() ?: 'BusinessPayment',
                originatorConversationId: $request->string('originator_conversation_id')->toString() ?: null,
                companyId: $request->user()?->company_id,
                userId: $request->user()?->id,
            );
        } catch (RuntimeException $exception) {
            Log::error('mpesa.b2c.store_failed', [
                'error' => $exception->getMessage(),
            ]);

            if (! $request->expectsJson()) {
                return back()
                    ->with('status', $exception->getMessage())
                    ->with('status_type', 'error');
            }

            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        if (! $request->expectsJson()) {
            return back()
                ->with('status', 'B2C request accepted for asynchronous processing.')
                ->with('status_type', 'success');
        }

        return response()->json([
            'message' => 'B2C request accepted for asynchronous processing.',
            'transaction' => $result['transaction'],
            'provider_response' => $result['response'],
        ], 201);
    }
}
