<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AirtimeSchedule extends Model
{
    /** @use HasFactory<\Database\Factories\AirtimeScheduleFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'recipient',
        'sender',
        'amount',
        'schedule_type',
        'recurrence',
        'start_date',
        'send_time',
        'next_run_at',
        'last_run_at',
        'occurrences_count',
        'max_occurrences',
        'status',
        'last_error',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'start_date' => 'date',
            'next_run_at' => 'datetime',
            'last_run_at' => 'datetime',
            'meta' => 'array',
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
