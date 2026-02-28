<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'airtime_balance',
        'owner_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'airtime_balance' => 'decimal:2',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function airtimeTransfers(): HasMany
    {
        return $this->hasMany(AirtimeTransfer::class);
    }

    public function billingTransactions(): HasMany
    {
        return $this->hasMany(CompanyBillingTransaction::class);
    }

    public function airtimeSchedules(): HasMany
    {
        return $this->hasMany(AirtimeSchedule::class);
    }
}
