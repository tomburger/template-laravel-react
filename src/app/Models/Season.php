<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Season extends Model
{
    public const STATUS_PREPARATION = 'preparation';
    public const STATUS_RESERVED = 'reserved';
    public const STATUS_OPEN = 'open';
    public const STATUS_CLOSED = 'closed';

    public const STATUSES = [self::STATUS_PREPARATION, self::STATUS_RESERVED, self::STATUS_OPEN, self::STATUS_CLOSED];

    protected $attributes = ['status' => self::STATUS_PREPARATION];

    protected $fillable = ['name', 'start_date', 'end_date', 'status'];

    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function memberSeasons(): HasMany
    {
        return $this->hasMany(MemberSeason::class);
    }

    public function unitSeasons(): HasMany
    {
        return $this->hasMany(UnitSeason::class);
    }

    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class);
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }
}
