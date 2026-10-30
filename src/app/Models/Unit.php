<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Unit extends Model
{
    protected $fillable = ['location_id', 'code', 'category'];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
