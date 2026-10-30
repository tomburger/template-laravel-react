<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Member extends Model
{
    public $incrementing = false;

    protected $fillable = ['id', 'first_name', 'last_name', 'phone_number', 'category'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id');
    }
}
