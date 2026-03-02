<?php

namespace App\Services\Mpesa;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MpesaAccessTokenService
{
    public function getAccessToken(): string
    {
        $cached = Cache::get('mpesa.access_token');

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $consumerKey = (string) config('services.mpesa.consumer_key');
        $consumerSecret = (string) config('services.mpesa.consumer_secret');
        $oauthUrl = (string) config('services.mpesa.oauth_url', 'https://api.safaricom.co.ke/oauth/v1/generate');

        if ($consumerKey === '' || $consumerSecret === '') {
            throw new RuntimeException('Mpesa consumer credentials are not configured.');
        }

        $response = Http::timeout((int) config('services.mpesa.timeout', 30))
            ->withBasicAuth($consumerKey, $consumerSecret)
            ->get($oauthUrl, [
                'grant_type' => 'client_credentials',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(sprintf(
                'Unable to generate Mpesa OAuth token. HTTP %d: %s',
                $response->status(),
                (string) $response->body()
            ));
        }

        $accessToken = (string) $response->json('access_token', '');
        $expiresIn = (int) $response->json('expires_in', 3600);

        if ($accessToken === '') {
            throw new RuntimeException('Mpesa OAuth response does not include an access token.');
        }

        $ttl = max(60, $expiresIn - 60);

        Cache::put('mpesa.access_token', $accessToken, now()->addSeconds($ttl));

        return $accessToken;
    }

    public function forgetAccessToken(): void
    {
        Cache::forget('mpesa.access_token');
    }
}
