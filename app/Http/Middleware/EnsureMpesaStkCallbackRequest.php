<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

class EnsureMpesaStkCallbackRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->isProduction() || config('app.env') === 'production') {
            $allowedIps = config('services.mpesa.stk_callback_allowed_ips', []);

            if (is_array($allowedIps) && $allowedIps !== []) {
                $requestIp = (string) $request->ip();
                $allowed = false;

                foreach ($allowedIps as $allowedIp) {
                    if (is_string($allowedIp) && IpUtils::checkIp($requestIp, $allowedIp)) {
                        $allowed = true;
                        break;
                    }
                }

                if (! $allowed) {
                    Log::warning('mpesa.stk.callback.ip_rejected', [
                        'ip' => $requestIp,
                    ]);

                    return response()->json([
                        'message' => 'Forbidden.',
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
