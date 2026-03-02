<?php

use App\Jobs\ProcessMpesaStkCallback;
use App\Models\Company;
use App\Models\CompanyBillingTransaction;
use App\Models\MpesaStkTopUpTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;

function mpesaStkConfigForTests(): void
{
    config()->set('services.mpesa.environment', 'sandbox');
    config()->set('services.mpesa.consumer_key', 'consumer-key');
    config()->set('services.mpesa.consumer_secret', 'consumer-secret');
    config()->set('services.mpesa.oauth_url', 'https://sandbox.safaricom.co.ke/oauth/v1/generate');
    config()->set('services.mpesa.stk_shortcode', '600000');
    config()->set('services.mpesa.stk_passkey', 'pass-key');
    config()->set('services.mpesa.stk_callback_url', 'https://example.test/api/mpesa/stk/callback');
    config()->set('services.mpesa.stk_retry_attempts', 1);
}

function successfulStkCallbackPayload(string $checkoutRequestId, string $merchantRequestId): array
{
    return [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => $merchantRequestId,
                'CheckoutRequestID' => $checkoutRequestId,
                'ResultCode' => 0,
                'ResultDesc' => 'The service request is processed successfully.',
                'CallbackMetadata' => [
                    'Item' => [
                        ['Name' => 'Amount', 'Value' => 100],
                        ['Name' => 'MpesaReceiptNumber', 'Value' => 'QJT1RX92P8'],
                        ['Name' => 'PhoneNumber', 'Value' => 254712345678],
                        ['Name' => 'TransactionDate', 'Value' => 20260302150249],
                    ],
                ],
            ],
        ],
    ];
}

test('submit stk request success', function () {
    mpesaStkConfigForTests();

    Http::fake([
        'https://sandbox.safaricom.co.ke/oauth/v1/generate*' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => 3600,
        ]),
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest' => Http::response([
            'MerchantRequestID' => '29115-34620561-1',
            'CheckoutRequestID' => 'ws_CO_020320261500001234567',
            'ResponseCode' => '0',
            'ResponseDescription' => 'Success. Request accepted for processing',
            'CustomerMessage' => 'Success. Request accepted for processing',
        ]),
    ]);

    $company = Company::factory()->create();
    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($admin)->postJson(route('billing.top-ups.store'), [
        'phone_number' => '254712345678',
        'amount' => 100,
        'account_reference' => 'malicious-client-value',
    ]);

    $response->assertCreated()
        ->assertJsonPath('transaction.company_id', $company->id)
        ->assertJsonPath('transaction.account_reference', (string) $company->id)
        ->assertJsonPath('transaction.status', 'pending');

    $this->assertDatabaseHas('mpesa_stk_top_up_transactions', [
        'company_id' => $company->id,
        'user_id' => $admin->id,
        'account_reference' => (string) $company->id,
        'checkout_request_id' => 'ws_CO_020320261500001234567',
        'status' => 'pending',
    ]);
});

test('non admin users cannot submit stk top up requests', function () {
    $company = Company::factory()->create();
    $member = User::factory()->create([
        'company_id' => $company->id,
        'is_company_admin' => false,
    ]);

    $response = $this->actingAs($member)->post(route('billing.top-ups.store'), [
        'phone_number' => '254712345678',
        'amount' => 100,
    ]);

    $response->assertForbidden();
});

test('callback success credits correct company wallet', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 10,
    ]);
    $admin = User::factory()->companyAdmin()->create([
        'company_id' => $company->id,
    ]);

    $transaction = MpesaStkTopUpTransaction::factory()->create([
        'company_id' => $company->id,
        'user_id' => $admin->id,
        'amount' => 100,
        'account_reference' => (string) $company->id,
        'merchant_request_id' => '29115-34620561-1',
        'checkout_request_id' => 'ws_CO_020320261500001234567',
        'status' => 'pending',
    ]);

    (new ProcessMpesaStkCallback(successfulStkCallbackPayload(
        checkoutRequestId: 'ws_CO_020320261500001234567',
        merchantRequestId: '29115-34620561-1',
    )))->handle();

    $company->refresh();
    $transaction->refresh();

    expect((float) $company->airtime_balance)->toBe(110.0)
        ->and($transaction->status)->toBe('success')
        ->and($transaction->mpesa_receipt_number)->toBe('QJT1RX92P8')
        ->and($transaction->result_code)->toBe('0');

    $this->assertDatabaseHas('company_billing_transactions', [
        'company_id' => $company->id,
        'type' => 'top_up',
        'reference' => 'QJT1RX92P8',
    ]);
});

test('callback failure does not credit wallet', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 350,
    ]);

    MpesaStkTopUpTransaction::factory()->create([
        'company_id' => $company->id,
        'amount' => 100,
        'account_reference' => (string) $company->id,
        'merchant_request_id' => '29115-34620561-1',
        'checkout_request_id' => 'ws_CO_020320261500001234567',
        'status' => 'pending',
    ]);

    $payload = [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => '29115-34620561-1',
                'CheckoutRequestID' => 'ws_CO_020320261500001234567',
                'ResultCode' => 1032,
                'ResultDesc' => 'Request cancelled by user',
            ],
        ],
    ];

    (new ProcessMpesaStkCallback($payload))->handle();

    $company->refresh();

    expect((float) $company->airtime_balance)->toBe(350.0)
        ->and(CompanyBillingTransaction::query()->count())->toBe(0);

    $this->assertDatabaseHas('mpesa_stk_top_up_transactions', [
        'company_id' => $company->id,
        'status' => 'failed',
        'result_code' => '1032',
    ]);
});

test('duplicate callback idempotency', function () {
    $company = Company::factory()->create([
        'airtime_balance' => 0,
    ]);

    $transaction = MpesaStkTopUpTransaction::factory()->create([
        'company_id' => $company->id,
        'amount' => 100,
        'account_reference' => (string) $company->id,
        'merchant_request_id' => '29115-34620561-1',
        'checkout_request_id' => 'ws_CO_020320261500001234567',
        'status' => 'pending',
    ]);

    $payload = successfulStkCallbackPayload(
        checkoutRequestId: 'ws_CO_020320261500001234567',
        merchantRequestId: '29115-34620561-1',
    );

    (new ProcessMpesaStkCallback($payload))->handle();
    (new ProcessMpesaStkCallback($payload))->handle();

    $company->refresh();
    $transaction->refresh();

    expect((float) $company->airtime_balance)->toBe(100.0)
        ->and($transaction->status)->toBe('success')
        ->and(CompanyBillingTransaction::query()->count())->toBe(1);
});

test('cross company isolation scenario', function () {
    $companyA = Company::factory()->create([
        'airtime_balance' => 50,
    ]);
    $companyB = Company::factory()->create([
        'airtime_balance' => 75,
    ]);

    MpesaStkTopUpTransaction::factory()->create([
        'company_id' => $companyA->id,
        'amount' => 100,
        'account_reference' => (string) $companyA->id,
        'merchant_request_id' => '29115-34620561-1',
        'checkout_request_id' => 'ws_CO_020320261500001234567',
        'status' => 'pending',
    ]);

    MpesaStkTopUpTransaction::factory()->create([
        'company_id' => $companyB->id,
        'amount' => 200,
        'account_reference' => (string) $companyB->id,
        'merchant_request_id' => '29115-34620561-2',
        'checkout_request_id' => 'ws_CO_020320261500001234568',
        'status' => 'pending',
    ]);

    (new ProcessMpesaStkCallback(successfulStkCallbackPayload(
        checkoutRequestId: 'ws_CO_020320261500001234567',
        merchantRequestId: '29115-34620561-1',
    )))->handle();

    $companyA->refresh();
    $companyB->refresh();

    expect((float) $companyA->airtime_balance)->toBe(150.0)
        ->and((float) $companyB->airtime_balance)->toBe(75.0);

    expect(CompanyBillingTransaction::query()->where('company_id', $companyA->id)->count())->toBe(1)
        ->and(CompanyBillingTransaction::query()->where('company_id', $companyB->id)->count())->toBe(0);
});

test('stk callback endpoint acknowledges quickly and dispatches job', function () {
    Bus::fake();

    $response = $this->postJson(route('mpesa.stk.callback'), successfulStkCallbackPayload(
        checkoutRequestId: 'ws_CO_020320261500001234567',
        merchantRequestId: '29115-34620561-1',
    ));

    $response->assertOk();

    Bus::assertDispatched(ProcessMpesaStkCallback::class);
});
