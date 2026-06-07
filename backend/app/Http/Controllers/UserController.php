<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List all users
     *
     * Get a list of all registered users. Only admins can access this endpoint.
     *
     * @endpoint
     * @authenticated
     * @responseField users object[] List of users
     */
    public function index(): JsonResponse
    {
        $users = User::all(['id', 'name', 'email', 'is_admin', 'is_deactivated', 'email_verified_at', 'created_at']);

        return response()->json([
            'users' => $users,
        ], 200);
    }

    /**
     * Update user flags
     *
     * Update the is_admin and/or is_deactivated flags for a user. Only admins can access this endpoint.
     * An admin cannot remove their own admin status.
     *
     * @endpoint
     * @authenticated
     * @urlParam id integer required The user ID. Example: 1
     * @bodyParam is_admin boolean Set whether the user is an admin.
     * @bodyParam is_deactivated boolean Set whether the user is deactivated.
     * @responseField user object Updated user data
     * @responseField message string Success message
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        // Admin cannot remove their own admin status
        if ($request->user()->id === $user->id && $request->has('is_admin') && $request->boolean('is_admin') === false) {
            return response()->json([
                'message' => 'You cannot remove your own admin status',
            ], 403);
        }

        $data = $request->only(['is_admin', 'is_deactivated']);
        $user->forceFill($data)->save();

        return response()->json([
            'user' => $user->fresh(['id', 'name', 'email', 'is_admin', 'is_deactivated', 'email_verified_at', 'created_at']),
            'message' => 'User updated successfully',
        ], 200);
    }
}
