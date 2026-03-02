<?php

use App\Jobs\ProcessMpesaB2BResultCallback;
use App\Jobs\ProcessMpesaB2BTimeoutCallback;
use App\Models\B2BTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;

function mpesaB2BConfigForTests(): void
{
    config()->set('services.mpesa.consumer_key', 'consumer-key');
    config()->set('services.mpesa.consumer_secret', 'consumer-secret');
    config()->set('services.mpesa.oauth_url', 'https://api.safaricom.co.ke/oauth/v1/generate');
    config()->set('services.mpesa.b2b_url', 'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest');
    config()->set('services.mpesa.b2b_initiator_name', 'prod_api_user');
    config()->set('services.mpesa.b2b_security_credential', 'encrypted-credential');
    config()->set('services.mpesa.b2b_result_url', 'https://example.test/api/mpesa/b2b/result');
    config()->set('services.mpesa.b2b_timeout_url', 'https://example.test/api/mpesa/b2b/timeout');
    config()->set('services.mpesa.b2b_till_account_reference', 'TILLPAY');
    config()->set('services.mpesa.b2b_callback_allowed_ips', []);
}

function mpesaB2BRequestPayload(string $commandId): array
{
    return [
        'Initiator' => 'prod_api_user',
        'SecurityCredential' => 'encrypted-credential',
        'CommandID' => $commandId,
        'Amount' => 1500,
        'PartyA' => '123456',
        'PartyB' => '789012',
        'AccountReference' => 'INV-2026-001',
        'Requester' => '254700000000',
        'Remarks' => 'Monthly subscription payment',
        'QueueTimeOutURL' => 'https://example.test/api/mpesa/b2b/timeout',
        'ResultURL' => 'https://example.test/api/mpesa/b2b/result',
    ];
}

test('authenticated users can submit business pay bill request', function () {
    mpesaB2BConfigForTests();

    Http::fake([
        'https://api.safaricom.co.ke/oauth/v1/generate*' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => 3600,
        ]),
        'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest' => Http::response([
            'OriginatorConversationID' => '5118-111210482-1',
            'ConversationID' => 'AG_20230420_2010759fd5662ef6d054',
            'ResponseCode' => '0',
            'ResponseDescription' => 'Accept the service request successfully.',
        ]),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('mpesa.b2b.store'), mpesaB2BRequestPayload('BusinessPayBill'));

    $response->assertCreated()
        ->assertJsonPath('transaction.command_id', 'BusinessPayBill')
        ->assertJsonPath('transaction.status', 'accepted')
        ->assertJsonPath('transaction.originator_conversation_id', '5118-111210482-1');

    $this->assertDatabaseHas('b2b_transactions', [
        'command_id' => 'BusinessPayBill',
        'status' => 'accepted',
        'originator_conversation_id' => '5118-111210482-1',
    ]);
});

test('authenticated users can submit business buy goods request', function () {
    mpesaB2BConfigForTests();

    Http::fake([
        'https://api.safaricom.co.ke/oauth/v1/generate*' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => 3600,
        ]),
        'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest' => Http::response([
            'OriginatorConversationID' => '5118-111210482-2',
            'ConversationID' => 'AG_20230420_2010759fd5662ef6d055',
            'ResponseCode' => '0',
            'ResponseDescription' => 'Accept the service request successfully.',
        ]),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('mpesa.b2b.store'), mpesaB2BRequestPayload('BusinessBuyGoods'));

    $response->assertCreated()
        ->assertJsonPath('transaction.command_id', 'BusinessBuyGoods')
        ->assertJsonPath('transaction.status', 'accepted');

    $this->assertDatabaseHas('b2b_transactions', [
        'command_id' => 'BusinessBuyGoods',
        'status' => 'accepted',
    ]);
});

test('business buy goods auto-fills account reference when omitted', function () {
    mpesaB2BConfigForTests();

    Http::fake([
        'https://api.safaricom.co.ke/oauth/v1/generate*' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => 3600,
        ]),
        'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest' => Http::response([
            'OriginatorConversationID' => '5118-111210482-20',
            'ConversationID' => 'AG_20230420_2010759fd5662ef6d099',
            'ResponseCode' => '0',
            'ResponseDescription' => 'Accept the service request successfully.',
        ]),
    ]);

    $user = User::factory()->create();
    $payload = mpesaB2BRequestPayload('BusinessBuyGoods');
    unset($payload['AccountReference']);

    $response = $this->actingAs($user)
        ->postJson(route('mpesa.b2b.store'), $payload);

    $response->assertCreated();

    $this->assertDatabaseHas('b2b_transactions', [
        'command_id' => 'BusinessBuyGoods',
        'account_reference' => 'TILLPAY',
        'status' => 'accepted',
    ]);
});

test('b2b request validates command id', function () {
    mpesaB2BConfigForTests();

    $user = User::factory()->create();

    $payload = mpesaB2BRequestPayload('InvalidCommand');

    $response = $this->actingAs($user)->postJson(route('mpesa.b2b.store'), $payload);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['CommandID']);
});

test('b2b request fails when provider returns non-zero response code', function () {
    mpesaB2BConfigForTests();

    Http::fake([
        'https://api.safaricom.co.ke/oauth/v1/generate*' => Http::response([
            'access_token' => 'test-token',
            'expires_in' => 3600,
        ]),
        'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest' => Http::response([
            'OriginatorConversationID' => '5118-111210482-3',
            'ConversationID' => 'AG_20230420_2010759fd5662ef6d056',
            'ResponseCode' => '2001',
            'ResponseDescription' => 'The initiator information is invalid.',
        ]),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('mpesa.b2b.store'), mpesaB2BRequestPayload('BusinessPayBill'));

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'The initiator information is invalid.');

    $this->assertDatabaseHas('b2b_transactions', [
        'status' => 'failed',
        'response_code' => '2001',
    ]);
});

test('b2b result callback dispatches async processing job', function () {
    Bus::fake();

    $response = $this->postJson(route('mpesa.b2b.result'), [
        'Result' => [
            'OriginatorConversationID' => '5118-111210482-1',
            'ConversationID' => 'AG_12345',
            'ResultCode' => 0,
            'ResultDesc' => 'Processed successfully',
        ],
    ]);

    $response->assertOk();

    Bus::assertDispatched(ProcessMpesaB2BResultCallback::class);
});

test('b2b result job processes successful callback and updates transaction fields', function () {
    $transaction = B2BTransaction::factory()->create([
        'status' => 'accepted',
        'originator_conversation_id' => '626f6ddf-ab37-4650-b882-b1de92ec9aa4',
        'conversation_id' => '12345677dfdf89099B3',
    ]);

    $payload = [
        'Result' => [
            'ResultType' => '0',
            'ResultCode' => '0',
            'ResultDesc' => 'The service request is processed successfully',
            'OriginatorConversationID' => '626f6ddf-ab37-4650-b882-b1de92ec9aa4',
            'ConversationID' => '12345677dfdf89099B3',
            'TransactionID' => 'QKA81LK5CY',
            'ResultParameters' => [
                'ResultParameter' => [
                    ['Key' => 'Amount', 'Value' => '190.00'],
                    ['Key' => 'TransCompletedTime', 'Value' => '20221110110717'],
                    ['Key' => 'ReceiverPartyPublicName', 'Value' => '000000- Biller Company'],
                    ['Key' => 'DebitPartyAffectedAccountBalance', 'Value' => 'Working Account|KES|346568.83|6186.83|340382.00|0.00'],
                ],
            ],
            'ReferenceData' => [
                'ReferenceItem' => [
                    ['Key' => 'BillReferenceNumber', 'Value' => '19008'],
                ],
            ],
        ],
    ];

    (new ProcessMpesaB2BResultCallback($payload))->handle();

    $transaction->refresh();

    expect($transaction->status)->toBe('success')
        ->and($transaction->transaction_id)->toBe('QKA81LK5CY')
        ->and($transaction->result_code)->toBe('0')
        ->and($transaction->bill_reference_number)->toBe('19008')
        ->and($transaction->transaction_completed_time)->toBe('20221110110717')
        ->and((float) $transaction->amount)->toBe(190.0);
});

test('b2b result job processes failed callback body shape with object parameters', function () {
    $transaction = B2BTransaction::factory()->create([
        'status' => 'accepted',
        'originator_conversation_id' => '12337-23509183-5',
    ]);

    $payload = [
        'Result' => [
            'ResultType' => 0,
            'ResultCode' => 2001,
            'ResultDesc' => 'The initiator information is invalid.',
            'OriginatorConversationID' => '12337-23509183-5',
            'ConversationID' => 'AG_20200120_0000657265d5fa9ae5c0',
            'TransactionID' => 'OAK0000000',
            'ResultParameters' => [
                'ResultParameter' => [
                    'Key' => 'BOCompletedTime',
                    'Value' => 20200120164825,
                ],
            ],
            'ReferenceData' => [
                'ReferenceItem' => [
                    'Key' => 'QueueTimeoutURL',
                    'Value' => 'https://your-production-domain.com/api/mpesa/b2b/timeout',
                ],
            ],
        ],
    ];

    (new ProcessMpesaB2BResultCallback($payload))->handle();

    $transaction->refresh();

    expect($transaction->status)->toBe('failed')
        ->and($transaction->result_code)->toBe('2001')
        ->and($transaction->result_desc)->toBe('The initiator information is invalid.');
});

test('b2b timeout callback dispatches async processing job', function () {
    Bus::fake();

    $response = $this->postJson(route('mpesa.b2b.timeout'), [
        'Result' => [
            'OriginatorConversationID' => '5118-111210482-1',
            'ConversationID' => 'AG_12345',
        ],
    ]);

    $response->assertOk();

    Bus::assertDispatched(ProcessMpesaB2BTimeoutCallback::class);
});

test('b2b timeout job marks transaction as timeout', function () {
    $transaction = B2BTransaction::factory()->create([
        'status' => 'accepted',
        'originator_conversation_id' => 'timeout-001',
    ]);

    $payload = [
        'Result' => [
            'OriginatorConversationID' => 'timeout-001',
            'ConversationID' => 'AG_timeout_001',
            'ResultCode' => '0',
            'ResultDesc' => 'Timeout occurred',
        ],
    ];

    (new ProcessMpesaB2BTimeoutCallback($payload))->handle();

    $transaction->refresh();

    expect($transaction->status)->toBe('timeout')
        ->and($transaction->result_desc)->toBe('Timeout occurred');
});

test('b2b callback endpoint rejects non-whitelisted ips in production', function () {
    config()->set('app.env', 'production');
    config()->set('services.mpesa.b2b_callback_allowed_ips', ['196.201.214.0/24']);

    $response = $this->postJson(route('mpesa.b2b.result'), [
        'Result' => [
            'OriginatorConversationID' => 'prod-block-01',
            'ConversationID' => 'AG_prod_block_01',
            'ResultCode' => 0,
        ],
    ]);

    $response->assertForbidden();
});
