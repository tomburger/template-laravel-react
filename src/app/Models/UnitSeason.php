<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitSeason extends Model
{
    protected $table = 'unit_season';

    protected $fillable = ['unit_id', 'season_id', 'category'];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
