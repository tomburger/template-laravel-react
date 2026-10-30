<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    public $incrementing = false;

    protected $fillable = ['id', 'first_name', 'last_name', 'phone_number', 'category'];

    public function seasons(): HasMany
    {
        return $this->hasMany(MemberSeason::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id');
    }
}
