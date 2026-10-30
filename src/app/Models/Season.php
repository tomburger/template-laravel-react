<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Season extends Model
{
    protected $fillable = ['name', 'start_date', 'end_date'];

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
