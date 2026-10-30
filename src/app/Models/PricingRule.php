<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PricingRule extends Model
{
    protected $fillable = ['season_id', 'unit_category', 'member_category', 'priority', 'price'];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    protected function casts(): array
    {
        return [
            'season_id' => 'integer',
            'priority' => 'integer',
            'price' => 'decimal:2',
        ];
    }
}
