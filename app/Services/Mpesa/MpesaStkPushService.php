<?php

namespace App\Services\Mpesa;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MpesaStkPushService
{
    public function __construct(private readonly MpesaAccessTokenService $accessTokenService) {}

    /**
     * @return array{request_payload: array<string, mixed>, response: array<string, mixed>}
     */
    public function submit(string $phoneNumber, string $amount, string $accountReference, string $transactionDescription): array
    {
        $requestPayload = $this->buildPayload(
            phoneNumber: $phoneNumber,
            amount: $amount,
            accountReference: $accountReference,
            transactionDescription: $transactionDescription,
        );

        $response = $this->sendWithRetry($requestPayload);

        /** @var array<string, mixed> $responseBody */
        $responseBody = $response->json() ?? [];

        if (! $response->successful()) {
            $description = (string) ($responseBody['errorMessage'] ?? $responseBody['ResponseDescription'] ?? $response->body());

            throw new RuntimeException(sprintf('Mpesa STK request failed. HTTP %d: %s', $response->status(), $description));
        }

        return [
            'request_payload' => $requestPayload,
            'response' => $responseBody,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendWithRetry(array $payload): Response
    {
        $maxAttempts = max(1, (int) config('services.mpesa.stk_retry_attempts', 3));

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $response = Http::timeout((int) config('services.mpesa.stk_timeout', 30))
                    ->acceptJson()
                    ->withToken($this->accessTokenService->getAccessToken())
                    ->post($this->stkUrl(), $payload);

                if ($response->status() === 401) {
                    $this->accessTokenService->forgetAccessToken();

                    $response = Http::timeout((int) config('services.mpesa.stk_timeout', 30))
                        ->acceptJson()
                        ->withToken($this->accessTokenService->getAccessToken())
                        ->post($this->stkUrl(), $payload);
                }

                if ($this->isTransientFailure($response) && $attempt < $maxAttempts) {
                    usleep($this->backoffMicroseconds($attempt));

                    continue;
                }

                return $response;
            } catch (ConnectionException $exception) {
                if ($attempt >= $maxAttempts) {
                    throw new RuntimeException('Network failure while calling Mpesa STK API.', previous: $exception);
                }

                usleep($this->backoffMicroseconds($attempt));
            }
        }

        throw new RuntimeException('Mpesa STK request exhausted retry attempts.');
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(
        string $phoneNumber,
        string $amount,
        string $accountReference,
        string $transactionDescription
    ): array {
        $shortCode = (string) config('services.mpesa.stk_shortcode');
        $passkey = (string) config('services.mpesa.stk_passkey');
        $callbackUrl = (string) config('services.mpesa.stk_callback_url');

        if ($shortCode === '' || $passkey === '' || $callbackUrl === '') {
            throw new RuntimeException('Mpesa STK configuration is incomplete.');
        }

        if (! str_starts_with($callbackUrl, 'https://')) {
            throw new RuntimeException('Mpesa STK callback URL must use HTTPS.');
        }

        $timestamp = now()->format('YmdHis');
        $password = base64_encode($shortCode.$passkey.$timestamp);

        return [
            'BusinessShortCode' => $shortCode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $amount,
            'PartyA' => $phoneNumber,
            'PartyB' => $shortCode,
            'PhoneNumber' => $phoneNumber,
            'CallBackURL' => $callbackUrl,
            'AccountReference' => $accountReference,
            'TransactionDesc' => $transactionDescription,
        ];
    }

    private function isTransientFailure(Response $response): bool
    {
        return $response->status() === 429 || $response->serverError();
    }

    private function backoffMicroseconds(int $attempt): int
    {
        return (int) (pow(2, $attempt - 1) * 200000);
    }

    private function stkUrl(): string
    {
        $configured = (string) config('services.mpesa.stk_url');
        if ($configured !== '') {
            return $configured;
        }

        $environment = strtolower((string) config('services.mpesa.environment', 'production'));

        if ($environment === 'sandbox') {
            return 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        }

        return 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    }
}
