<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocationRequest extends FormRequest
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
        return [
            'name' => 'required|string|max:255',
            // Scribe inspects rules without an authenticated user.
            'owner_ids' => ($this->user()?->isManager() ?? true) ? 'required|array|min:1' : 'prohibited',
            'owner_ids.*' => 'required|integer|distinct|exists:users,id',
        ];
    }
}
