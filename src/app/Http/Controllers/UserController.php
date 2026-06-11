<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Mail\VerifyEmailMailable;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly MailService $mailService)
    {
    }

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
     * Admin dashboard info
     *
     * Get high-level user statistics for the admin dashboard.
     * Only admins can access this endpoint.
     *
     * @endpoint
     * @authenticated
     * @responseField users.total integer Total number of users.
     * @responseField users.active integer Active users (not deactivated).
     * @responseField users.pending_verification integer Users with unverified email.
     * @responseField users.recent integer Users created in the last 7 days.
     */
    public function adminInfo(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_deactivated', false)->count();
        $pendingVerificationUsers = User::whereNull('email_verified_at')->count();
        $recentUsers = User::where('created_at', '>=', now()->subDays(7))->count();

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'pending_verification' => $pendingVerificationUsers,
                'recent' => $recentUsers,
            ],
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
        $updatedUser = $user->fresh();

        return response()->json([
            'user' => [
                'id' => $updatedUser->id,
                'name' => $updatedUser->name,
                'email' => $updatedUser->email,
                'is_admin' => $updatedUser->is_admin,
                'is_deactivated' => $updatedUser->is_deactivated,
                'email_verified_at' => $updatedUser->email_verified_at,
                'created_at' => $updatedUser->created_at,
            ],
            'message' => 'User updated successfully',
        ], 200);
    }

    /**
     * Resend verification email for user (admin)
     *
     * Resend the verification email for a specific user by ID.
     * Only admins can access this endpoint.
     *
     * @endpoint
     * @authenticated
     * @urlParam id integer required The user ID. Example: 1
     * @responseField message string Success message
     */
    public function resendVerificationEmail(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        if ($user->isEmailVerified()) {
            return response()->json([
                'message' => 'User email is already verified',
            ], 400);
        }

        $token = $user->generateEmailVerificationToken();
        $this->mailService->send($user->email, $user->name, new VerifyEmailMailable($user, $token));

        return response()->json([
            'message' => 'Verification email resent successfully',
        ], 200);
    }
}
