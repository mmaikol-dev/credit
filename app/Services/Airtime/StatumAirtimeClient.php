<?php

namespace App\Services\Airtime;

use InvalidArgumentException;
use Statum\Sdk\Exceptions\ApiException;
use Statum\Sdk\StatumClient;

class StatumAirtimeClient
{
    /**
     * @return array{
     *     accepted: bool,
     *     transaction_id: string,
     *     response_code: string,
     *     response_description: string,
     *     status: string
     * }
     *
     * @throws ApiException
     */
    public function send(
        string $recipient,
        string $amount,
        ?string $sender,
        string $callbackUrl,
    ): array {
        unset($sender, $callbackUrl);

        $consumerKey = (string) (config('services.statum.consumer_key') ?: config('services.statum.username'));
        $consumerSecret = (string) (config('services.statum.consumer_secret') ?: config('services.statum.password'));
        $baseUrl = (string) config('services.statum.base_url', 'https://api.statum.co.ke/api/v2');

        if ($consumerKey === '' || $consumerSecret === '') {
            throw new InvalidArgumentException('Statum credentials are not configured.');
        }

        $client = StatumClient::create(
            consumerKey: $consumerKey,
            consumerSecret: $consumerSecret,
            baseUrl: $baseUrl,
        );

        $response = $client->airtime()->sendAirtime(
            phoneNumber: $recipient,
            amount: $amount,
        );

        $accepted = $response->statusCode === 200;

        return [
            'accepted' => $accepted,
            'transaction_id' => $response->requestId,
            'response_code' => (string) $response->statusCode,
            'response_description' => $response->description,
            'status' => $accepted ? 'ACCEPTED' : 'FAILED',
        ];
    }

    public function callbackUrl(): string
    {
        return route('airtime.webhook', ['token' => config('services.statum.webhook_secret')]);
    }
}
