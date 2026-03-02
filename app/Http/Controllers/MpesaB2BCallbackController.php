<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessMpesaB2BResultCallback;
use App\Jobs\ProcessMpesaB2BTimeoutCallback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MpesaB2BCallbackController extends Controller
{
    public function result(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $validator = Validator::make($payload, [
            'Result' => ['required', 'array'],
            'Result.OriginatorConversationID' => ['required', 'string'],
            'Result.ConversationID' => ['required', 'string'],
            'Result.ResultCode' => ['required'],
        ]);

        if ($validator->fails()) {
            Log::warning('mpesa.b2b.result.validation_failed', [
                'errors' => $validator->errors()->toArray(),
                'payload' => $payload,
            ]);

            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted for processing',
            ], 200);
        }

        Log::info('mpesa.b2b.result.received', [
            'originator_conversation_id' => data_get($payload, 'Result.OriginatorConversationID'),
            'conversation_id' => data_get($payload, 'Result.ConversationID'),
        ]);

        ProcessMpesaB2BResultCallback::dispatch($payload);

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted for processing',
        ], 200);
    }

    public function timeout(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $validator = Validator::make($payload, [
            'Result.OriginatorConversationID' => ['nullable', 'string'],
            'Result.ConversationID' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            Log::warning('mpesa.b2b.timeout.validation_failed', [
                'errors' => $validator->errors()->toArray(),
                'payload' => $payload,
            ]);

            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted for processing',
            ], 200);
        }

        Log::warning('mpesa.b2b.timeout.received', [
            'originator_conversation_id' => data_get($payload, 'Result.OriginatorConversationID'),
            'conversation_id' => data_get($payload, 'Result.ConversationID'),
        ]);

        ProcessMpesaB2BTimeoutCallback::dispatch($payload);

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted for processing',
        ], 200);
    }
}
