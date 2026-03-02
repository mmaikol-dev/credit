<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AirtimeWebhookEvent extends Model
{
    /** @use HasFactory<\Database\Factories\AirtimeWebhookEventFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'airtime_transfer_id',
        'external_reference',
        'provider_status',
        'result_code',
        'result_description',
        'charge',
        'account_balance',
        'processing_status',
        'processing_error',
        'payload',
        'processed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'charge' => 'decimal:2',
            'account_balance' => 'decimal:2',
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function airtimeTransfer(): BelongsTo
    {
        return $this->belongsTo(AirtimeTransfer::class);
    }
}
