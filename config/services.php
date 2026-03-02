<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'statum' => [
        'base_url' => env('STATUM_BASE_URL', 'https://api.statum.co.ke/api/v2'),
        'consumer_key' => env('STATUM_CONSUMER_KEY'),
        'consumer_secret' => env('STATUM_CONSUMER_SECRET'),
        'username' => env('STATUM_USERNAME'),
        'password' => env('STATUM_PASSWORD'),
        'timeout' => env('STATUM_TIMEOUT', 30),
        'webhook_secret' => env('STATUM_WEBHOOK_SECRET'),
    ],

    'mpesa' => [
        'environment' => env('MPESA_ENVIRONMENT', 'production'),
        'oauth_url' => env('MPESA_OAUTH_URL', 'https://api.safaricom.co.ke/oauth/v1/generate'),
        'b2c_url' => env('MPESA_B2C_URL', 'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest'),
        'b2b_url' => env('MPESA_B2B_URL', 'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest'),
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'initiator_name' => env('MPESA_INITIATOR_NAME'),
        'initiator_password' => env('MPESA_INITIATOR_PASSWORD'),
        'security_credential' => env('MPESA_SECURITY_CREDENTIAL'),
        'b2b_initiator_name' => env('MPESA_B2B_INITIATOR_NAME', env('MPESA_INITIATOR_NAME')),
        'b2b_security_credential' => env('MPESA_B2B_SECURITY_CREDENTIAL', env('MPESA_SECURITY_CREDENTIAL')),
        'shortcode' => env('MPESA_SHORTCODE'),
        'result_url' => env('MPESA_RESULT_URL'),
        'timeout_url' => env('MPESA_TIMEOUT_URL'),
        'b2b_result_url' => env('MPESA_B2B_RESULT_URL'),
        'b2b_timeout_url' => env('MPESA_B2B_TIMEOUT_URL'),
        'b2b_till_account_reference' => env('MPESA_B2B_TILL_ACCOUNT_REFERENCE', 'TILLPAY'),
        'public_key_path' => env('MPESA_PUBLIC_KEY_PATH'),
        'callback_allowed_ips' => array_filter(array_map('trim', explode(',', (string) env('MPESA_CALLBACK_ALLOWED_IPS', '')))),
        'b2b_callback_allowed_ips' => array_filter(array_map('trim', explode(',', (string) env('MPESA_B2B_CALLBACK_ALLOWED_IPS', env('MPESA_CALLBACK_ALLOWED_IPS', ''))))),
        'b2b_callback_basic_auth_user' => env('MPESA_B2B_CALLBACK_BASIC_AUTH_USER'),
        'b2b_callback_basic_auth_password' => env('MPESA_B2B_CALLBACK_BASIC_AUTH_PASSWORD'),
        'b2b_retry_attempts' => env('MPESA_B2B_RETRY_ATTEMPTS', 3),
        'timeout' => env('MPESA_TIMEOUT', 30),
    ],

];
