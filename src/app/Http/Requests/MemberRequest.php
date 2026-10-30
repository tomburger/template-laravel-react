<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MemberRequest extends FormRequest
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
        $rules = [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone_number' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
        ];

        if ($this->route('member') === null) {
            $rules['user_id'] = ['required', 'integer', 'exists:users,id', Rule::unique('members', 'id')];
        }

        return $rules;
    }
}
