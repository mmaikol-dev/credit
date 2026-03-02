<?php

use App\Jobs\ProcessMpesaB2CResultCallback;
use App\Jobs\ProcessMpesaB2CTimeoutCallback;
use App\Models\B2CTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;

function mpesaConfigForTests(): void
{
    config()->set('services.mpesa.consumer_key', 'consumer-key');
    config()->set('services.mpesa.consumer_secret', 'consumer-secret');
    config()->set('services.mpesa.initiator_name', 'api-user');
    config()->set('services.mpesa.initiator_password', 'secret-password');
    config()->set('services.mpesa.security_credential', 'encrypted-credential');
    config()->set('services.mpesa.shortcode', '600000');
    config()->set('services.mpesa.result_url', 'https://example.test/api/b2c/result');
    config()->set('services.mpesa.timeout_url', 'https://example.test/api/b2c/timeout');
    config()->set('services.mpesa.oauth_url', 'https://api.safaricom.co.ke/oauth/v1/generate');
    config()->set('services.mpesa.b2c_url', 'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest');
}

test('authenticated users can send b2c payment requests', function () {
    mpesaConfigForTests();

    Http::fake([
        'https://api.safaricom.co.ke/oauth/v1/generate' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => '3600',
        ]),
        'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest' => Http::response([
            'OriginatorConversationID' => 'B2C-REQ-001',
            'ConversationID' => 'AG_20260302_000010',
            'ResponseCode' => '0',
            'ResponseDescription' => 'Accept the service request successfully.',
        ]),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('mpesa.b2c.store'), [
        'phone_number' => '254712345678',
        'amount' => 100,
        'remarks' => 'Withdrawal',
        'occasion' => 'WalletWithdrawal',
        'originator_conversation_id' => 'B2C-REQ-001',
    ]);

    $response->assertCreated()
        ->assertJsonPath('transaction.originator_conversation_id', 'B2C-REQ-001')
        ->assertJsonPath('transaction.status', 'pending')
        ->assertJsonPath('transaction.conversation_id', 'AG_20260302_000010');

    $this->assertDatabaseHas('b2c_transactions', [
        'originator_conversation_id' => 'B2C-REQ-001',
        'phone_number' => '254712345678',
        'status' => 'pending',
    ]);
});

test('b2c payment request returns validation style error on provider rejection', function () {
    mpesaConfigForTests();

    Http::fake([
        'https://api.safaricom.co.ke/oauth/v1/generate' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => '3600',
        ]),
        'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest' => Http::response([
            'OriginatorConversationID' => 'B2C-REQ-002',
            'ConversationID' => 'AG_20260302_000020',
            'ResponseCode' => '2001',
            'ResponseDescription' => 'Insufficient funds in utility account.',
        ]),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('mpesa.b2c.store'), [
        'phone_number' => '254700000123',
        'amount' => 100,
        'remarks' => 'Withdrawal',
        'occasion' => 'WalletWithdrawal',
        'originator_conversation_id' => 'B2C-REQ-002',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Insufficient funds in the B2C utility account.');

    $this->assertDatabaseHas('b2c_transactions', [
        'originator_conversation_id' => 'B2C-REQ-002',
        'status' => 'failed',
    ]);
});

test('result callback dispatches asynchronous processing job', function () {
    Bus::fake();

    $response = $this->postJson(route('mpesa.b2c.result'), [
        'Result' => [
            'OriginatorConversationID' => 'B2C-CB-001',
            'ResultCode' => 0,
            'ResultDesc' => 'Processed successfully.',
        ],
    ]);

    $response->assertNoContent();

    Bus::assertDispatched(ProcessMpesaB2CResultCallback::class);
});

test('result callback job updates b2c transaction status and payload details', function () {
    $transaction = B2CTransaction::factory()->create([
        'originator_conversation_id' => 'B2C-CB-002',
        'amount' => 50,
        'status' => 'pending',
    ]);

    $payload = [
        'Result' => [
            'OriginatorConversationID' => 'B2C-CB-002',
            'ConversationID' => 'AG_20260302_ABC123',
            'TransactionID' => 'NLJ7RT61SV',
            'ResultCode' => 0,
            'ResultDesc' => 'The service request is processed successfully.',
            'ResultParameters' => [
                'ResultParameter' => [
                    ['Key' => 'TransactionAmount', 'Value' => 100],
                    ['Key' => 'ReceiverPartyPublicName', 'Value' => '254712345678 - John Doe'],
                ],
            ],
        ],
    ];

    (new ProcessMpesaB2CResultCallback($payload))->handle();

    $transaction->refresh();

    expect($transaction->status)->toBe('success')
        ->and($transaction->conversation_id)->toBe('AG_20260302_ABC123')
        ->and($transaction->transaction_id)->toBe('NLJ7RT61SV')
        ->and($transaction->result_code)->toBe('0')
        ->and((float) $transaction->amount)->toBe(100.0)
        ->and($transaction->raw_callback_payload)->toBe($payload);
});

test('timeout callback job marks transaction as timeout and remains idempotent', function () {
    $transaction = B2CTransaction::factory()->create([
        'originator_conversation_id' => 'B2C-TIMEOUT-001',
        'status' => 'pending',
    ]);

    $payload = [
        'Result' => [
            'OriginatorConversationID' => 'B2C-TIMEOUT-001',
            'ResultCode' => 1,
            'ResultDesc' => 'The service request timed out.',
        ],
    ];

    (new ProcessMpesaB2CTimeoutCallback($payload))->handle();
    (new ProcessMpesaB2CTimeoutCallback($payload))->handle();

    $transaction->refresh();

    expect($transaction->status)->toBe('timeout')
        ->and($transaction->result_code)->toBe('1')
        ->and($transaction->result_desc)->toBe('The service request timed out.');
});

test('authenticated users can view send money page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('mpesa.b2c.index'));

    $response->assertOk();
});

test('send money page only shows transactions for the authenticated users company', function () {
    $companyA = \App\Models\Company::factory()->create();
    $companyB = \App\Models\Company::factory()->create();

    $userA = User::factory()->create([
        'company_id' => $companyA->id,
    ]);

    B2CTransaction::factory()->create([
        'company_id' => $companyA->id,
        'phone_number' => '254700000001',
    ]);

    B2CTransaction::factory()->create([
        'company_id' => $companyB->id,
        'phone_number' => '254799999999',
    ]);

    $response = $this->actingAs($userA)->get(route('mpesa.b2c.index'));

    $response->assertOk()
        ->assertSee('254700000001')
        ->assertDontSee('254799999999');
});
