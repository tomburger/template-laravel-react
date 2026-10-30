<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreMemberRequest extends UpdateMemberRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id', Rule::unique('members', 'id')],
            ...parent::rules(),
        ];
    }
}
