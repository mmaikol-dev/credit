<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MpesaStkTopUpTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\MpesaStkTopUpTransactionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'amount',
        'phone_number',
        'account_reference',
        'merchant_request_id',
        'checkout_request_id',
        'mpesa_receipt_number',
        'result_code',
        'result_desc',
        'transaction_date',
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
