<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberSeason extends Model
{
    protected $table = 'member_season';

    protected $fillable = ['member_id', 'season_id', 'category'];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
