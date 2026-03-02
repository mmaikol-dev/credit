<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessMpesaB2CResultCallback;
use App\Jobs\ProcessMpesaB2CTimeoutCallback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

class MpesaB2CCallbackController extends Controller
{
    public function result(Request $request): Response
    {
        if (! $this->isAllowedCallbackIp($request)) {
            Log::warning('mpesa.b2c.callback.ip_rejected', [
                'type' => 'result',
                'ip' => $request->ip(),
            ]);

            return response()->noContent(403);
        }

        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $validator = Validator::make($payload, [
            'Result' => ['required', 'array'],
            'Result.OriginatorConversationID' => ['required', 'string'],
            'Result.ResultCode' => ['required'],
        ]);

        if ($validator->fails()) {
            Log::warning('mpesa.b2c.result.validation_failed', [
                'errors' => $validator->errors()->toArray(),
                'payload' => $payload,
            ]);

            return response()->noContent(422);
        }

        Log::info('mpesa.b2c.result.received', [
            'payload' => $payload,
        ]);

        ProcessMpesaB2CResultCallback::dispatch($payload);

        return response()->noContent();
    }

    public function timeout(Request $request): Response
    {
        if (! $this->isAllowedCallbackIp($request)) {
            Log::warning('mpesa.b2c.callback.ip_rejected', [
                'type' => 'timeout',
                'ip' => $request->ip(),
            ]);

            return response()->noContent(403);
        }

        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $validator = Validator::make($payload, [
            'Result.OriginatorConversationID' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            Log::warning('mpesa.b2c.timeout.validation_failed', [
                'errors' => $validator->errors()->toArray(),
                'payload' => $payload,
            ]);

            return response()->noContent(422);
        }

        Log::warning('mpesa.b2c.timeout.received', [
            'payload' => $payload,
        ]);

        ProcessMpesaB2CTimeoutCallback::dispatch($payload);

        return response()->noContent();
    }

    private function isAllowedCallbackIp(Request $request): bool
    {
        if (! app()->isProduction()) {
            return true;
        }

        $allowedIps = config('services.mpesa.callback_allowed_ips', []);

        if (! is_array($allowedIps) || $allowedIps === []) {
            Log::warning('mpesa.b2c.callback.allowed_ips_missing');

            return false;
        }

        foreach ($allowedIps as $allowedIp) {
            if (is_string($allowedIp) && IpUtils::checkIp((string) $request->ip(), $allowedIp)) {
                return true;
            }
        }

        return false;
    }
}
