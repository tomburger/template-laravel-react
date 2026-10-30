<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    protected $fillable = ['name'];

    // Layout data is fetched through its own endpoint, not with every location list
    protected $hidden = ['layout_svg', 'layout_image_path'];

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }
}
