<?php

namespace App\Services\Mpesa;

use Illuminate\Support\Facades\Cache;
use RuntimeException;

class MpesaSecurityCredentialService
{
    public function getSecurityCredential(): string
    {
        $preEncryptedCredential = (string) config('services.mpesa.security_credential');
        if ($preEncryptedCredential !== '') {
            return $preEncryptedCredential;
        }

        $initiatorPassword = (string) config('services.mpesa.initiator_password');
        if ($initiatorPassword === '') {
            throw new RuntimeException('Mpesa initiator password is not configured.');
        }

        $publicCertificatePath = $this->resolvePublicCertificatePath((string) config('services.mpesa.public_key_path'));
        $cacheKey = 'mpesa.security_credential.'.sha1($initiatorPassword.'|'.$publicCertificatePath);

        $cachedCredential = Cache::get($cacheKey);
        if (is_string($cachedCredential) && $cachedCredential !== '') {
            return $cachedCredential;
        }

        $certificateContents = file_get_contents($publicCertificatePath);

        if (! is_string($certificateContents) || $certificateContents === '') {
            throw new RuntimeException('Mpesa public certificate could not be read.');
        }

        $publicKey = openssl_pkey_get_public($certificateContents);
        if ($publicKey === false) {
            throw new RuntimeException('Mpesa public certificate is invalid.');
        }

        $encrypted = null;
        $encryptionSucceeded = openssl_public_encrypt($initiatorPassword, $encrypted, $publicKey, OPENSSL_PKCS1_PADDING);
        if ($encryptionSucceeded !== true || ! is_string($encrypted)) {
            throw new RuntimeException('Unable to encrypt Mpesa initiator password.');
        }

        $credential = base64_encode($encrypted);

        Cache::put($cacheKey, $credential, now()->addHours(12));

        return $credential;
    }

    private function resolvePublicCertificatePath(string $configuredPath): string
    {
        if ($configuredPath === '') {
            throw new RuntimeException('Mpesa public certificate path is not configured.');
        }

        $path = $configuredPath;
        if (! str_starts_with($configuredPath, '/')) {
            $path = base_path($configuredPath);
        }

        if (! is_file($path)) {
            throw new RuntimeException(sprintf('Mpesa public certificate was not found at [%s].', $path));
        }

        return $path;
    }
}
