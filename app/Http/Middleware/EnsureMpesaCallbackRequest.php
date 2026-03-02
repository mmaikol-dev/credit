<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

class EnsureMpesaCallbackRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->validateOptionalBasicAuth($request);

        if (app()->isProduction() || config('app.env') === 'production') {
            $allowedIps = config('services.mpesa.b2b_callback_allowed_ips', []);

            if (! is_array($allowedIps) || $allowedIps === []) {
                Log::warning('mpesa.b2b.callback.allowed_ips_missing');

                return response()->json([
                    'message' => 'Forbidden.',
                ], 403);
            }

            $requestIp = (string) $request->ip();
            $allowed = false;

            foreach ($allowedIps as $allowedIp) {
                if (is_string($allowedIp) && IpUtils::checkIp($requestIp, $allowedIp)) {
                    $allowed = true;
                    break;
                }
            }

            if (! $allowed) {
                Log::warning('mpesa.b2b.callback.ip_rejected', [
                    'ip' => $requestIp,
                ]);

                return response()->json([
                    'message' => 'Forbidden.',
                ], 403);
            }
        }

        return $next($request);
    }

    private function validateOptionalBasicAuth(Request $request): void
    {
        $expectedUser = (string) config('services.mpesa.b2b_callback_basic_auth_user', '');
        $expectedPassword = (string) config('services.mpesa.b2b_callback_basic_auth_password', '');

        if ($expectedUser === '' && $expectedPassword === '') {
            return;
        }

        $providedUser = (string) $request->getUser();
        $providedPassword = (string) $request->getPassword();

        if (! hash_equals($expectedUser, $providedUser) || ! hash_equals($expectedPassword, $providedPassword)) {
            abort(401, 'Unauthorized callback request.');
        }
    }
}
