<?php

namespace App\Http\Requests;

use App\Models\Allocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAllocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_due' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'variable_symbol' => [
                'required',
                'string',
                'regex:/^[0-9]{1,10}$/',
                Rule::unique('allocations', 'variable_symbol')->ignore($this->route('allocation')),
            ],
            'status' => ['required', 'string', Rule::in(Allocation::STATUSES)],
        ];
    }
}
