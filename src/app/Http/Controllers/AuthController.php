<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResendEmailRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\VerifyEmailRequest;
use App\Mail\ResetPasswordMailable;
use App\Mail\VerifyEmailMailable;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use AuthorizesRequests, ValidatesRequests;

    private function isDefaultAdminActive(): bool
    {
        return User::where('id', 1)
            ->where('is_admin', true)
            ->where('is_deactivated', false)
            ->exists();
    }

    public function __construct(private readonly MailService $mailService)
    {
    }

    /**
     * Register a new user
     *
     * Register a new user account and send email verification.
     *
     * @endpoint
     * @unauthenticated
     * @responseField user object User data
     * @responseField message string Success message
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => $request->input('password'),
        ]);

        // First user ever becomes admin automatically
        if (User::count() === 1) {
            $user->forceFill(['is_admin' => true])->save();
        }

        // Generate email verification token
        $token = $user->generateEmailVerificationToken();

        // Send verification email
        $this->mailService->send($user->email, $user->name, new VerifyEmailMailable($user, $token));

        return response()->json([
            'user' => $user,
            'is_default_admin_active' => $this->isDefaultAdminActive(),
            'message' => 'User registered successfully. Please check your email to verify your account.',
        ], 201);
    }

    /**
     * Login user
     *
     * Authenticate user with email and password, return authentication token.
     *
     * @endpoint
     * @unauthenticated
     * @responseField user object User data
     * @responseField message string Success message
     * @responseField token string Authentication token
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (!$user->isEmailVerified()) {
            return response()->json([
                'message' => 'Please verify your email before logging in',
            ], 403);
        }

        if ($user->is_deactivated) {
            return response()->json([
                'message' => 'Your account has been deactivated',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'is_default_admin_active' => $this->isDefaultAdminActive(),
            'token' => $token,
            'message' => 'Login successful',
        ], 200);
    }

    /**
     * Logout user
     *
     * Revoke the current authentication token and logout the user.
     *
     * @endpoint
     * @authenticated
     * @responseField message string Success message
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful',
        ], 200);
    }

    /**
     * Verify email
     *
     * Verify user email address with token from email link.
     *
     * @endpoint
     * @unauthenticated
     * @responseField user object User data
     * @responseField message string Success message
     */
    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        if ($user->email_verification_token !== $request->input('token')) {
            return response()->json([
                'message' => 'Invalid verification token',
            ], 400);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'user' => $user,
            'is_default_admin_active' => $this->isDefaultAdminActive(),
            'message' => 'Email verified successfully',
        ], 200);
    }

    /**
     * Resend verification email
     *
     * Send a new verification email to the user.
     *
     * @endpoint
     * @unauthenticated
     * @responseField message string Success message
     */
    public function resendVerificationEmail(ResendEmailRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        if ($user->isEmailVerified()) {
            return response()->json([
                'message' => 'Email already verified',
            ], 400);
        }

        // Generate new email verification token
        $token = $user->generateEmailVerificationToken();

        // Send verification email
        $this->mailService->send($user->email, $user->name, new VerifyEmailMailable($user, $token));

        return response()->json([
            'message' => 'Verification email sent successfully',
        ], 200);
    }

    /**
     * Forgot password
     *
     * Send password reset email with token.
     *
     * @endpoint
     * @unauthenticated
     * @responseField message string Success message
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        // Generate password reset token
        $token = $user->generatePasswordResetToken();

        // Send password reset email
        $this->mailService->send($user->email, $user->name, new ResetPasswordMailable($user, $token));

        return response()->json([
            'message' => 'Password reset email sent successfully',
        ], 200);
    }

    /**
     * Reset password
     *
     * Reset user password with token from email link.
     *
     * @endpoint
     * @unauthenticated
     * @responseField message string Success message
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        if (!$user->verifyPasswordResetToken($request->input('token'))) {
            return response()->json([
                'message' => 'Invalid or expired password reset token',
            ], 400);
        }

        $user->forceFill([
            'password' => $request->input('password'),
        ])->save();

        $user->clearPasswordResetToken();

        return response()->json([
            'message' => 'Password reset successfully',
        ], 200);
    }

    /**
     * Refresh token
     *
     * Get a new authentication token.
     *
     * @endpoint
     * @authenticated
     * @responseField token string New authentication token
     * @responseField message string Success message
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'message' => 'Token refreshed successfully',
        ], 200);
    }

    /**
     * Get current user
     *
     * Get the authenticated user's profile information.
     *
     * @endpoint
     * @authenticated
     * @responseField user object User data
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
            'is_default_admin_active' => $this->isDefaultAdminActive(),
        ], 200);
    }
}
