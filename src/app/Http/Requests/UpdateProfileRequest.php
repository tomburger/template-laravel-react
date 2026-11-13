<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'member' => 'sometimes|array:first_name,last_name,phone_number|min:1',
            'member.first_name' => 'required_with:member|string|max:100',
            'member.last_name' => 'required_with:member|string|max:100',
            'member.phone_number' => 'nullable|string|max:50',
        ];
    }
}
