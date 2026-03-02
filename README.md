# CreditSaaS Mpesa Integration Guide

This project includes Mpesa integrations for:

- B2C payouts (send money to phone numbers)
- B2B payments
- `BusinessPayBill`
- `BusinessBuyGoods` (Till)

## Features

- OAuth access token caching and refresh
- Production/sandbox-ready endpoint configuration via environment variables
- Asynchronous callback handling for results and timeouts
- Queue-based callback processing
- Idempotent callback processing guards
- Callback security middleware (IP allowlist + optional basic auth)
- Unified Send Money UI flow where users choose transaction type before form display

## Environment Configuration

Set these in `.env`:

```env
MPESA_ENVIRONMENT=production
MPESA_OAUTH_URL=https://api.safaricom.co.ke/oauth/v1/generate
MPESA_B2C_URL=https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest
MPESA_B2B_URL=https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest

MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=

MPESA_INITIATOR_NAME=
MPESA_INITIATOR_PASSWORD=
MPESA_SECURITY_CREDENTIAL=

MPESA_B2B_INITIATOR_NAME=
MPESA_B2B_SECURITY_CREDENTIAL=

MPESA_RESULT_URL=https://yourdomain.com/api/b2c/result
MPESA_TIMEOUT_URL=https://yourdomain.com/api/b2c/timeout

MPESA_B2B_RESULT_URL=https://yourdomain.com/api/mpesa/b2b/result
MPESA_B2B_TIMEOUT_URL=https://yourdomain.com/api/mpesa/b2b/timeout
MPESA_B2B_TILL_ACCOUNT_REFERENCE=TILLPAY

MPESA_CALLBACK_ALLOWED_IPS=
MPESA_B2B_CALLBACK_ALLOWED_IPS=
MPESA_B2B_CALLBACK_BASIC_AUTH_USER=
MPESA_B2B_CALLBACK_BASIC_AUTH_PASSWORD=

MPESA_B2B_RETRY_ATTEMPTS=3
MPESA_TIMEOUT=30
```

## Security Credential Notes

- B2C currently supports encrypted credential generation from cert if you provide:
  - `MPESA_INITIATOR_PASSWORD`
  - `MPESA_PUBLIC_KEY_PATH`
- B2B currently expects already encrypted `SecurityCredential` via:
  - `MPESA_B2B_SECURITY_CREDENTIAL`
- Never log raw initiator passwords.

## Routes

### UI

- `GET /mpesa/send-money`

### B2C

- `POST /api/b2c/payment-request`
- `POST /api/b2c/result`
- `POST /api/b2c/timeout`

### B2B

- `POST /api/mpesa/b2b/payment-request`
- `POST /api/mpesa/b2b/result`
- `POST /api/mpesa/b2b/timeout`

## Callback Security

B2B callback routes are protected by `EnsureMpesaCallbackRequest` middleware.

In production:

- Requests are checked against `MPESA_B2B_CALLBACK_ALLOWED_IPS`
- Optional basic auth is supported with:
  - `MPESA_B2B_CALLBACK_BASIC_AUTH_USER`
  - `MPESA_B2B_CALLBACK_BASIC_AUTH_PASSWORD`

## Transaction Type Behavior in Send Money Page

Users choose one type before form fields are shown:

- Send Money (B2C)
- Pay Bill (B2B `BusinessPayBill`)
- Send to Till (B2B `BusinessBuyGoods`)

For Till payments:

- `AccountReference` is auto-filled if omitted.
- Default value comes from `MPESA_B2B_TILL_ACCOUNT_REFERENCE`.

## Migrations and Queue

Run migrations:

```bash
php artisan migrate
```

Run queue worker for callback jobs:

```bash
php artisan queue:work
```

## Example Requests

### B2B BusinessPayBill

```bash
curl -X POST "https://yourdomain.com/api/mpesa/b2b/payment-request" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <app-session-or-api-auth>" \
  -d '{
    "CommandID": "BusinessPayBill",
    "Amount": 1500,
    "PartyA": "123456",
    "PartyB": "789012",
    "AccountReference": "INV-2026-001",
    "Requester": "254700000000",
    "Remarks": "Monthly subscription payment"
  }'
```

### B2B BusinessBuyGoods (Till)

```bash
curl -X POST "https://yourdomain.com/api/mpesa/b2b/payment-request" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <app-session-or-api-auth>" \
  -d '{
    "CommandID": "BusinessBuyGoods",
    "Amount": 250,
    "PartyA": "123456",
    "PartyB": "654321",
    "Remarks": "Store purchase"
  }'
```

### B2C Send Money

```bash
curl -X POST "https://yourdomain.com/api/b2c/payment-request" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <app-session-or-api-auth>" \
  -d '{
    "phone_number": "254712345678",
    "amount": 100,
    "remarks": "Withdrawal",
    "occasion": "WalletWithdrawal",
    "command_id": "BusinessPayment"
  }'
```

## Testing

Run Mpesa tests:

```bash
php artisan test --compact tests/Feature/MpesaB2CTest.php
php artisan test --compact tests/Feature/MpesaB2BTest.php
```

If tests fail with DB connection errors, verify local database credentials and ensure the DB server is running.

## Troubleshooting

- `The initiator information is invalid.`
  - Confirm initiator username and role in Daraja org profile.
- `Security credential is invalid or locked.`
  - Regenerate encrypted credential using correct public certificate.
- `Insufficient funds`
  - Confirm balance on the source org account.
- Callback not received
  - Verify public HTTPS callback URLs and allowlisted IPs.
- Duplicate callback updates
  - Handled by idempotency checks in callback jobs.
