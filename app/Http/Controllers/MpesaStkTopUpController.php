<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMpesaStkTopUpRequest;
use App\Jobs\ProcessMpesaStkCallback;
use App\Models\MpesaStkTopUpTransaction;
use App\Services\Mpesa\MpesaStkPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class MpesaStkTopUpController extends Controller
{
    public function __construct(private readonly MpesaStkPushService $mpesaStkPushService) {}

    public function store(StoreMpesaStkTopUpRequest $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $companyId = $user?->company_id;

        if ($companyId === null) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Authenticated user does not belong to a company.',
                ], 422);
            }

            return back()
                ->with('status', 'Authenticated user does not belong to a company.')
                ->with('status_type', 'error');
        }

        $amount = number_format((float) $request->input('amount'), 2, '.', '');
        $phoneNumber = $request->string('phone_number')->toString();
        $accountReference = (string) $companyId;

        $transaction = MpesaStkTopUpTransaction::query()->create([
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'amount' => $amount,
            'phone_number' => $phoneNumber,
            'account_reference' => $accountReference,
            'status' => 'pending',
        ]);

        try {
            $result = $this->mpesaStkPushService->submit(
                phoneNumber: $phoneNumber,
                amount: $amount,
                accountReference: $accountReference,
                transactionDescription: 'Wallet Top Up',
            );
        } catch (RuntimeException $exception) {
            $transaction->update([
                'status' => 'request_failed',
                'result_desc' => $exception->getMessage(),
            ]);

            Log::error('mpesa.stk.top_up_request_failed', [
                'company_id' => $companyId,
                'user_id' => $user?->id,
                'transaction_id' => $transaction->id,
                'error' => $exception->getMessage(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $exception->getMessage(),
                ], 422);
            }

            return back()
                ->with('status', $exception->getMessage())
                ->with('status_type', 'error');
        }

        $syncResponse = $result['response'];
        $responseCode = (string) ($syncResponse['ResponseCode'] ?? '');
        $responseDescription = (string) ($syncResponse['ResponseDescription'] ?? $syncResponse['errorMessage'] ?? 'Unknown response');

        $transaction->update([
            'merchant_request_id' => data_get($syncResponse, 'MerchantRequestID'),
            'checkout_request_id' => data_get($syncResponse, 'CheckoutRequestID'),
            'result_code' => $responseCode !== '' ? $responseCode : null,
            'result_desc' => $responseDescription,
            'status' => $responseCode === '0' ? 'pending' : 'request_failed',
            'raw_request_payload' => $result['request_payload'],
            'raw_sync_response_payload' => $syncResponse,
        ]);

        Log::info('mpesa.stk.top_up_requested', [
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'transaction_id' => $transaction->id,
            'checkout_request_id' => $transaction->checkout_request_id,
            'response_code' => $responseCode,
        ]);

        if ($responseCode !== '0') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $responseDescription,
                ], 422);
            }

            return back()
                ->with('status', $responseDescription)
                ->with('status_type', 'error');
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'STK push initiated. Complete payment on your phone.',
                'transaction' => $transaction->fresh(),
            ], 201);
        }

        return back()
            ->with('status', 'STK push initiated. Complete payment on your phone.')
            ->with('status_type', 'success');
    }

    public function callback(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $validator = Validator::make($payload, [
            'Body' => ['required', 'array'],
            'Body.stkCallback' => ['required', 'array'],
            'Body.stkCallback.CheckoutRequestID' => ['nullable', 'string'],
            'Body.stkCallback.MerchantRequestID' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            Log::warning('mpesa.stk.callback.invalid_payload', [
                'errors' => $validator->errors()->toArray(),
            ]);
        } else {
            ProcessMpesaStkCallback::dispatch($payload);
        }

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted',
        ], 200);
    }
}
