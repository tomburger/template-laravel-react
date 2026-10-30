<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $location = $this->route('location');
        $unit = $this->route('unit');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('units', 'code')
                    ->where('location_id', $location?->id)
                    ->ignore($unit?->id),
            ],
            'category' => 'nullable|string|max:100',
        ];
    }
}
