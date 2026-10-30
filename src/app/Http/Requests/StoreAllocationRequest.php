<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAllocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_season_id' => ['required', 'integer', 'exists:member_season,id'],
            'unit_season_id' => ['required', 'integer', 'exists:unit_season,id'],
        ];
    }
}
