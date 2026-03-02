<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class B2BTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\B2BTransactionFactory> */
    use HasFactory;

    protected $table = 'b2b_transactions';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'command_id',
        'initiator',
        'sender_identifier_type',
        'receiver_identifier_type',
        'party_a',
        'party_b',
        'account_reference',
        'requester',
        'amount',
        'remarks',
        'queue_timeout_url',
        'result_url',
        'originator_conversation_id',
        'conversation_id',
        'transaction_id',
        'response_code',
        'response_description',
        'result_code',
        'result_desc',
        'transaction_completed_time',
        'receiver_party_public_name',
        'debit_party_affected_account_balance',
        'bill_reference_number',
        'status',
        'raw_request_payload',
        'raw_sync_response_payload',
        'raw_callback_payload',
        'processed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'raw_request_payload' => 'array',
            'raw_sync_response_payload' => 'array',
            'raw_callback_payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
