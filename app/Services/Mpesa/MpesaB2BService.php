<?php

namespace App\Services\Mpesa;

use App\DataTransferObjects\MpesaB2BPaymentData;
use App\Models\B2BTransaction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class MpesaB2BService
{
    public function __construct(private readonly MpesaAccessTokenService $accessTokenService) {}

    /**
     * @return array{transaction: B2BTransaction, response: array<string, mixed>}
     */
    public function submit(MpesaB2BPaymentData $data, ?int $companyId = null, ?int $userId = null): array
    {
        $payload = $data->toPayload();

        $transaction = B2BTransaction::query()->create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'command_id' => $data->commandId,
            'initiator' => $data->initiator,
            'sender_identifier_type' => $data->senderIdentifierType,
            'receiver_identifier_type' => $data->receiverIdentifierType,
            'party_a' => $data->partyA,
            'party_b' => $data->partyB,
            'account_reference' => $data->accountReference,
            'requester' => $data->requester,
            'amount' => $data->amount,
            'remarks' => $data->remarks,
            'queue_timeout_url' => $data->queueTimeOutUrl,
            'result_url' => $data->resultUrl,
            'status' => 'pending',
            'raw_request_payload' => $payload,
        ]);

        Log::info('mpesa.b2b.request', [
            'transaction_id' => $transaction->id,
            'command_id' => $data->commandId,
            'party_a' => $data->partyA,
            'party_b' => $data->partyB,
            'amount' => $data->amount,
        ]);

        try {
            $response = $this->sendWithRetry($payload);
        } catch (Throwable $throwable) {
            $transaction->update([
                'status' => 'failed',
                'result_desc' => 'B2B request transport failure: '.$throwable->getMessage(),
            ]);

            Log::error('mpesa.b2b.request_failed', [
                'transaction_id' => $transaction->id,
                'error' => $throwable->getMessage(),
                'exception' => $throwable::class,
            ]);

            throw new RuntimeException('Network failure while calling Mpesa B2B API.', previous: $throwable);
        }

        /** @var array<string, mixed> $responseBody */
        $responseBody = $response->json() ?? [];

        $responseCode = (string) ($responseBody['ResponseCode'] ?? '');
        $responseDescription = (string) ($responseBody['ResponseDescription'] ?? $responseBody['errorMessage'] ?? 'Unknown response');
        $originatorConversationId = (string) ($responseBody['OriginatorConversationID'] ?? '');
        $conversationId = (string) ($responseBody['ConversationID'] ?? '');

        $transaction->update([
            'originator_conversation_id' => $originatorConversationId !== '' ? $originatorConversationId : $transaction->originator_conversation_id,
            'conversation_id' => $conversationId !== '' ? $conversationId : null,
            'response_code' => $responseCode !== '' ? $responseCode : null,
            'response_description' => $responseDescription,
            'status' => $responseCode === '0' ? 'accepted' : 'failed',
            'raw_sync_response_payload' => $responseBody,
        ]);

        Log::info('mpesa.b2b.sync_response', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $originatorConversationId,
            'conversation_id' => $conversationId,
            'response_code' => $responseCode,
            'response_description' => $responseDescription,
            'http_status' => $response->status(),
        ]);

        if (! $response->successful() || $responseCode !== '0') {
            throw new RuntimeException($this->resolveResponseError($responseCode, $responseDescription, $response));
        }

        return [
            'transaction' => $transaction->fresh(),
            'response' => $responseBody,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendWithRetry(array $payload): Response
    {
        $maxAttempts = max(1, (int) config('services.mpesa.b2b_retry_attempts', 3));

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $response = Http::timeout((int) config('services.mpesa.timeout', 30))
                    ->acceptJson()
                    ->withToken($this->accessTokenService->getAccessToken())
                    ->post((string) config('services.mpesa.b2b_url', 'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest'), $payload);

                if ($response->status() === 401) {
                    $this->accessTokenService->forgetAccessToken();

                    $response = Http::timeout((int) config('services.mpesa.timeout', 30))
                        ->acceptJson()
                        ->withToken($this->accessTokenService->getAccessToken())
                        ->post((string) config('services.mpesa.b2b_url', 'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest'), $payload);
                }

                if ($this->isTransientHttpFailure($response) && $attempt < $maxAttempts) {
                    usleep($this->backoffMicroseconds($attempt));

                    continue;
                }

                return $response;
            } catch (ConnectionException $exception) {
                if ($attempt >= $maxAttempts) {
                    throw $exception;
                }

                usleep($this->backoffMicroseconds($attempt));
            }
        }

        throw new RuntimeException('Mpesa B2B request exhausted retry attempts.');
    }

    private function isTransientHttpFailure(Response $response): bool
    {
        return $response->status() === 429 || $response->serverError();
    }

    private function backoffMicroseconds(int $attempt): int
    {
        return (int) (pow(2, $attempt - 1) * 200000);
    }

    private function resolveResponseError(string $responseCode, string $responseDescription, Response $response): string
    {
        $lowerDescription = strtolower($responseDescription);

        if (str_contains($lowerDescription, 'initiator')) {
            return 'The initiator information is invalid.';
        }

        if (str_contains($lowerDescription, 'security credential')) {
            return 'The security credential is invalid or locked.';
        }

        if (str_contains($lowerDescription, 'insufficient')) {
            return 'Insufficient funds in the organization account.';
        }

        if ($responseCode !== '') {
            return sprintf('Mpesa B2B rejected request with ResponseCode %s: %s', $responseCode, $responseDescription);
        }

        return sprintf('Mpesa B2B HTTP %d: %s', $response->status(), $responseDescription);
    }
}
