<?php

namespace App\Http\Requests;

class StoreSeasonRequest extends UpdateSeasonRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'copy_from_season_id' => 'nullable|integer|exists:seasons,id',
        ];
    }
}
