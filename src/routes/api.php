<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification-email', [AuthController::class, 'resendVerificationEmail']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    Route::get('/user', [AuthController::class, 'user']);
});

// Admin-only routes
Route::middleware(['auth:sanctum', 'is_admin'])->group(function () {
    Route::get('/admin/info', [UserController::class, 'adminInfo']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/resend-verification-email', [UserController::class, 'resendVerificationEmail']);
});

// Health check
Route::get('/health', [HealthController::class, 'show']);
