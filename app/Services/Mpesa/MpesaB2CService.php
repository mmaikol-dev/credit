<?php

namespace App\Services\Mpesa;

use App\Models\B2CTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class MpesaB2CService
{
    public function __construct(
        private readonly MpesaAccessTokenService $accessTokenService,
        private readonly MpesaSecurityCredentialService $securityCredentialService,
    ) {}

    /**
     * @return array{transaction: B2CTransaction, response: array<string, mixed>}
     */
    public function sendPayment(
        string $phoneNumber,
        string $amount,
        string $remarks,
        string $occasion,
        string $commandId = 'BusinessPayment',
        ?string $originatorConversationId = null,
        ?int $companyId = null,
        ?int $userId = null,
    ): array {
        $originatorConversationId ??= $this->generateOriginatorConversationId();

        $existingTransaction = B2CTransaction::query()
            ->where('originator_conversation_id', $originatorConversationId)
            ->first();

        if ($existingTransaction !== null) {
            throw new RuntimeException('Duplicate OriginatorConversationID detected.');
        }

        $transaction = B2CTransaction::query()->create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'originator_conversation_id' => $originatorConversationId,
            'phone_number' => $phoneNumber,
            'amount' => $amount,
            'status' => 'pending',
        ]);

        $payload = [
            'OriginatorConversationID' => $originatorConversationId,
            'InitiatorName' => (string) config('services.mpesa.initiator_name'),
            'SecurityCredential' => $this->securityCredentialService->getSecurityCredential(),
            'CommandID' => $commandId,
            'Amount' => $amount,
            'PartyA' => (string) config('services.mpesa.shortcode'),
            'PartyB' => $phoneNumber,
            'Remarks' => $remarks,
            'QueueTimeOutURL' => (string) config('services.mpesa.timeout_url'),
            'ResultURL' => (string) config('services.mpesa.result_url'),
            'Occasion' => $occasion,
        ];

        Log::info('mpesa.b2c.request', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $originatorConversationId,
            'phone_number' => $this->maskPhone($phoneNumber),
            'amount' => $amount,
            'command_id' => $commandId,
        ]);

        try {
            $response = Http::timeout((int) config('services.mpesa.timeout', 30))
                ->withToken($this->accessTokenService->getAccessToken())
                ->acceptJson()
                ->post((string) config('services.mpesa.b2c_url', 'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest'), $payload);
        } catch (Throwable $throwable) {
            $transaction->update([
                'status' => 'failed',
                'result_desc' => $throwable->getMessage(),
            ]);

            Log::error('mpesa.b2c.network_error', [
                'transaction_id' => $transaction->id,
                'originator_conversation_id' => $originatorConversationId,
                'error' => $throwable->getMessage(),
                'exception' => $throwable::class,
            ]);

            throw new RuntimeException('Network failure while calling Mpesa B2C API.', previous: $throwable);
        }

        /** @var array<string, mixed> $responseBody */
        $responseBody = $response->json() ?? [];

        Log::info('mpesa.b2c.response', [
            'transaction_id' => $transaction->id,
            'originator_conversation_id' => $originatorConversationId,
            'http_status' => $response->status(),
            'response_code' => $responseBody['ResponseCode'] ?? $responseBody['errorCode'] ?? null,
            'response_description' => $responseBody['ResponseDescription'] ?? $responseBody['errorMessage'] ?? null,
        ]);

        if (! $response->successful()) {
            $transaction->update([
                'status' => 'failed',
                'result_desc' => $this->resolveErrorMessage($responseBody, (string) $response->body()),
            ]);

            throw new RuntimeException(sprintf('Mpesa B2C request failed. HTTP %d.', $response->status()));
        }

        $responseCode = (string) ($responseBody['ResponseCode'] ?? '');
        $conversationId = (string) ($responseBody['ConversationID'] ?? '');

        $transaction->update([
            'conversation_id' => $conversationId !== '' ? $conversationId : null,
            'result_code' => $responseCode !== '' ? $responseCode : null,
            'result_desc' => (string) ($responseBody['ResponseDescription'] ?? null),
            'status' => $responseCode === '0' ? 'pending' : 'failed',
        ]);

        if ($responseCode !== '0') {
            throw new RuntimeException($this->resolveErrorMessage($responseBody, 'Mpesa B2C request was rejected by Safaricom.'));
        }

        return [
            'transaction' => $transaction->fresh(),
            'response' => $responseBody,
        ];
    }

    public function generateOriginatorConversationId(): string
    {
        return 'B2C-'.now()->format('YmdHis').'-'.Str::upper(Str::random(8));
    }

    /**
     * @param  array<string, mixed>  $responseBody
     */
    private function resolveErrorMessage(array $responseBody, string $fallback): string
    {
        $responseCode = (string) ($responseBody['ResponseCode'] ?? '');
        $errorCode = (string) ($responseBody['errorCode'] ?? '');
        $description = (string) ($responseBody['ResponseDescription'] ?? $responseBody['errorMessage'] ?? $fallback);

        if (str_contains(strtolower($description), 'initiator')) {
            return 'Invalid InitiatorName configured for Mpesa B2C.';
        }

        if (str_contains(strtolower($description), 'security credential')) {
            return 'Security credential is invalid or locked.';
        }

        if (str_contains(strtolower($description), 'insufficient')) {
            return 'Insufficient funds in the B2C utility account.';
        }

        if ($responseCode !== '' && $responseCode !== '0') {
            return sprintf('Mpesa B2C failed with ResponseCode %s: %s', $responseCode, $description);
        }

        if ($errorCode !== '') {
            return sprintf('Mpesa B2C failed with ErrorCode %s: %s', $errorCode, $description);
        }

        return $description;
    }

    private function maskPhone(string $phoneNumber): string
    {
        if (strlen($phoneNumber) <= 4) {
            return '****';
        }

        return str_repeat('*', strlen($phoneNumber) - 4).substr($phoneNumber, -4);
    }
}
