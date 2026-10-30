<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PricingRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'season_id' => ['nullable', 'integer', 'exists:seasons,id'],
            'unit_category' => ['nullable', 'string', 'max:255'],
            'member_category' => ['nullable', 'string', 'max:255'],
            'priority' => ['required', 'integer', 'min:0', 'max:1000000'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['unit_category', 'member_category'] as $field) {
            if ($this->has($field) && trim((string) $this->input($field)) === '') {
                $this->merge([$field => null]);
            }
        }
    }
}
