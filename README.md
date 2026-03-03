# CreditSaaS Operations Guide

This document explains the live operational flows in the system, including Airtime, Billing, and Mpesa integrations.

## Core Architecture

- App stack: Laravel + Inertia React
- Tenant model: all wallet and transfer operations are company-scoped by `company_id`
- Async processing: callback-heavy workflows are queued for reliability and idempotency
- Scheduler: recurring/failed operations are handled by console commands

## Operations Flow Charts

### 1) Airtime Transfer (Manual)

```mermaid
flowchart TD
    A[Authenticated user submits Airtime Transfer] --> B[Validate payload and company context]
    B --> C{Company wallet balance enough?}
    C -- No --> D[Reject request]
    C -- Yes --> E[Create airtime_transfers row status=queued]
    E --> F[Send request to Statum]
    F --> G{Provider accepted sync request?}
    G -- Yes --> H[Mark transfer accepted]
    H --> I[Debit company wallet]
    I --> J[Create company_billing_transactions type=debit]
    G -- No --> K[Mark failed and set retry/escalation metadata]
    H --> L[Wait for webhook]
    K --> L
```

### 2) Airtime Webhook Processing

```mermaid
flowchart TD
    A[POST /webhooks/statum/airtime] --> B[Validate webhook token]
    B --> C[Store airtime_webhook_events row]
    C --> D[Find transfer by external_reference]
    D --> E{Transfer found?}
    E -- No --> F[Mark event transfer_not_found and exit]
    E -- Yes --> G[Normalize status/result code]
    G --> H[Update airtime_transfers status + payload + retry metadata]
    H --> I{Failed and previously debited?}
    I -- Yes --> J[Reverse company wallet]
    J --> K[Create company_billing_transactions type=reversal]
    I -- No --> L[No reversal]
    K --> M[Notify stakeholders]
    L --> M
```

### 3) Airtime Schedule Processing

```mermaid
flowchart TD
    A[Scheduler runs airtime:schedules:process] --> B[Load due active schedules]
    B --> C[Create transfer from schedule]
    C --> D[Send to provider]
    D --> E{Accepted?}
    E -- Yes --> F[Debit company wallet + create debit ledger]
    E -- No --> G[Mark transfer failed]
    F --> H[Advance next_run_at or complete schedule]
    G --> H
```

### 4) Failed Airtime Retry Processing

```mermaid
flowchart TD
    A[Scheduler runs airtime:transfers:retry] --> B[Find failed transfers marked retryable]
    B --> C[Check retry_attempts and next_retry_at]
    C --> D[Resend to provider]
    D --> E{Accepted?}
    E -- Yes --> F[Mark accepted]
    F --> G[Apply debit if needed]
    G --> H[Notify retried_successfully]
    E -- No --> I[Update retry metadata]
    I --> J{Retry attempts exhausted or non-retryable?}
    J -- Yes --> K[Mark escalated + notify]
    J -- No --> L[Schedule next retry + notify]
```

### 5) Billing Wallet Top-Up via Mpesa STK Push (Multi-Company Safe)

```mermaid
flowchart TD
    A[Company admin submits phone_number + amount] --> B[Validate and require company_id]
    B --> C[Derive AccountReference = authenticated user's company_id]
    C --> D[Create mpesa_stk_top_up_transactions status=pending]
    D --> E[Send Daraja STK push]
    E --> F[Store MerchantRequestID + CheckoutRequestID + sync payload]
    F --> G{Sync ResponseCode == 0?}
    G -- No --> H[Mark request_failed]
    G -- Yes --> I[Wait for callback]
    I --> J[POST /api/mpesa/stk/callback ACK immediately]
    J --> K[Queue ProcessMpesaStkCallback job]
    K --> L[Find transaction by CheckoutRequestID/MerchantRequestID]
    L --> M{Already terminal?}
    M -- Yes --> N[Idempotent skip]
    M -- No --> O{ResultCode == 0?}
    O -- Yes --> P[Credit ONLY matched transaction.company_id wallet]
    P --> Q[Create company_billing_transactions type=top_up]
    Q --> R[Mark transaction success]
    O -- No --> S[Mark failed/timeout, no wallet credit]
```

### 6) Mpesa B2C Send Money

```mermaid
flowchart TD
    A[User submits B2C payment request] --> B[Create b2c_transactions pending]
    B --> C[Call Daraja B2C API]
    C --> D{Sync accepted?}
    D -- No --> E[Mark failed]
    D -- Yes --> F[Persist conversation IDs]
    F --> G[Wait for result/timeout callback]
    G --> H[Queue callback job]
    H --> I[Update final status success/failed/timeout]
```

### 7) Mpesa B2B Payments (PayBill / BuyGoods)

```mermaid
flowchart TD
    A[User submits B2B request] --> B[Validate payload]
    B --> C[Default till AccountReference when needed]
    C --> D[Create b2b_transactions pending]
    D --> E[Call Daraja B2B with retry]
    E --> F{Sync ResponseCode == 0?}
    F -- No --> G[Mark failed]
    F -- Yes --> H[Mark accepted]
    H --> I[Wait for result/timeout callback]
    I --> J[Queue callback job]
    J --> K[Update final status success/failed/timeout]
```

## Security and Isolation Rules

- Account reference for STK is never trusted from the client.
- STK top-up crediting happens only from a matched stored transaction.
- Wallet mutations are tied to one `company_id` per transaction.
- Callback routes can be restricted by allowlisted IPs in production.
- Secrets (consumer secret, passkey, credentials) must never be logged.

## Environment Configuration

Add these variables to `.env`:

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
MPESA_PUBLIC_KEY_PATH=

MPESA_B2B_INITIATOR_NAME=
MPESA_B2B_SECURITY_CREDENTIAL=
MPESA_B2B_TILL_ACCOUNT_REFERENCE=TILLPAY

MPESA_RESULT_URL=https://yourdomain.com/api/b2c/result
MPESA_TIMEOUT_URL=https://yourdomain.com/api/b2c/timeout
MPESA_B2B_RESULT_URL=https://yourdomain.com/api/mpesa/b2b/result
MPESA_B2B_TIMEOUT_URL=https://yourdomain.com/api/mpesa/b2b/timeout

MPESA_CALLBACK_ALLOWED_IPS=
MPESA_B2B_CALLBACK_ALLOWED_IPS=
MPESA_B2B_CALLBACK_BASIC_AUTH_USER=
MPESA_B2B_CALLBACK_BASIC_AUTH_PASSWORD=
MPESA_B2B_RETRY_ATTEMPTS=3
MPESA_TIMEOUT=30

MPESA_STK_SHORTCODE=
MPESA_STK_PASSKEY=
MPESA_STK_CALLBACK_URL=https://yourdomain.com/api/mpesa/stk/callback
MPESA_STK_INITIATOR_NAME=
MPESA_STK_TIMEOUT=30
MPESA_STK_CALLBACK_ALLOWED_IPS=
MPESA_STK_RETRY_ATTEMPTS=3
MPESA_STK_URL=

STATUM_BASE_URL=https://api.statum.co.ke/api/v2
STATUM_CONSUMER_KEY=
STATUM_CONSUMER_SECRET=
STATUM_WEBHOOK_SECRET=
STATUM_TIMEOUT=30
```

## Main Routes

### UI

- `GET /dashboard`
- `GET /airtime/transfers`
- `GET /airtime/schedules`
- `GET /billing`
- `GET /company/users`
- `GET /mpesa/send-money`

### Airtime

- `POST /airtime/transfers`
- `PATCH /airtime/transfers/{airtimeTransfer}`
- `DELETE /airtime/transfers/{airtimeTransfer}`
- `POST /webhooks/statum/airtime`

### Billing / STK

- `POST /billing/top-ups`
- `POST /api/mpesa/stk/callback`

### Mpesa B2C

- `POST /api/b2c/payment-request`
- `POST /api/b2c/result`
- `POST /api/b2c/timeout`

### Mpesa B2B

- `POST /api/mpesa/b2b/payment-request`
- `POST /api/mpesa/b2b/result`
- `POST /api/mpesa/b2b/timeout`

## Queue and Scheduler

Run workers:

```bash
php artisan queue:work
```

Run scheduler:

```bash
php artisan schedule:work
```

Scheduled commands:

- `airtime:schedules:process` (every minute)
- `airtime:transfers:retry` (every five minutes)

## Test Commands

```bash
php artisan test --compact tests/Feature/AirtimeTransferTest.php
php artisan test --compact tests/Feature/AirtimeScheduleTest.php
php artisan test --compact tests/Feature/BillingTest.php
php artisan test --compact tests/Feature/MpesaB2CTest.php
php artisan test --compact tests/Feature/MpesaB2BTest.php
php artisan test --compact tests/Feature/MpesaStkTopUpTest.php
```
