<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile and member record.
     *
     * @endpoint
     * @authenticated
     * @responseField name string User's display name.
     * @responseField member object|null Member details, including the manager-controlled category.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->is_deactivated, 403);

        return response()->json($this->profile($user));
    }

    /**
     * Update the authenticated user's profile and optionally create or update their member record.
     *
     * Member category is managed separately and cannot be changed here.
     *
     * @endpoint
     * @authenticated
     * @bodyParam name string required User's display name.
     * @bodyParam member object Member details; omit to leave membership unchanged.
     * @bodyParam member.first_name string First name; required when member is supplied.
     * @bodyParam member.last_name string Last name; required when member is supplied.
     * @bodyParam member.phone_number string Phone number.
     * @responseField name string User's display name.
     * @responseField member object|null Member details, including the manager-controlled category.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->is_deactivated, 403);
        $data = $request->validated();

        DB::transaction(function () use ($user, $data) {
            $user->update(['name' => $data['name']]);

            if (isset($data['member'])) {
                $user->member()->updateOrCreate([], $data['member']);
            }
        });

        return response()->json($this->profile($user));
    }

    private function profile(User $user): array
    {
        $member = $user->member()->first();

        return [
            'name' => $user->name,
            'member' => $member?->only(['first_name', 'last_name', 'phone_number', 'category']),
        ];
    }
}
