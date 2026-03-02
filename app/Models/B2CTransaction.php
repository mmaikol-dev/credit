<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class B2CTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\B2CTransactionFactory> */
    use HasFactory;

    protected $table = 'b2c_transactions';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'originator_conversation_id',
        'conversation_id',
        'transaction_id',
        'phone_number',
        'amount',
        'result_code',
        'result_desc',
        'status',
        'raw_callback_payload',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'raw_callback_payload' => 'array',
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
