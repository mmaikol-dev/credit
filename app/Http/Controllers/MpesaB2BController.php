<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMpesaB2BPaymentRequest;
use App\Services\Mpesa\MpesaB2BService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MpesaB2BController extends Controller
{
    public function __construct(private readonly MpesaB2BService $mpesaB2BService) {}

    public function store(StoreMpesaB2BPaymentRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $result = $this->mpesaB2BService->submit(
                data: $request->toData(),
                companyId: $request->user()?->company_id,
                userId: $request->user()?->id,
            );
        } catch (RuntimeException $exception) {
            Log::error('mpesa.b2b.store_failed', [
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
                ->with('status', 'B2B request accepted for asynchronous processing.')
                ->with('status_type', 'success');
        }

        return response()->json([
            'message' => 'B2B request accepted for asynchronous processing.',
            'transaction' => $result['transaction'],
            'provider_response' => $result['response'],
        ], 201);
    }
}
