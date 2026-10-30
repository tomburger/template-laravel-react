<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Allocation extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [self::STATUS_PENDING, self::STATUS_CONFIRMED, self::STATUS_PAID, self::STATUS_CANCELLED];

    // Allowed status changes; cancelled is final
    public const TRANSITIONS = [
        self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
        self::STATUS_CONFIRMED => [self::STATUS_PENDING, self::STATUS_PAID, self::STATUS_CANCELLED],
        self::STATUS_PAID => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
        self::STATUS_CANCELLED => [],
    ];

    protected $fillable = ['member_season_id', 'unit_season_id', 'status', 'amount_due', 'variable_symbol'];

    public function memberSeason(): BelongsTo
    {
        return $this->belongsTo(MemberSeason::class);
    }

    public function unitSeason(): BelongsTo
    {
        return $this->belongsTo(UnitSeason::class);
    }

    public function canTransitionTo(string $status): bool
    {
        return in_array($status, self::TRANSITIONS[$this->status] ?? [], true);
    }

    protected function casts(): array
    {
        return ['amount_due' => 'decimal:2'];
    }
}
