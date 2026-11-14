<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\LocationLayoutController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\AllocationController;
use App\Http\Controllers\PricingRuleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeasonMemberController;
use App\Http\Controllers\SeasonUnitController;
use App\Http\Controllers\UnitController;
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
    Route::get('/user/profile', [ProfileController::class, 'show']);
    Route::put('/user/profile', [ProfileController::class, 'update']);
    Route::put('/user/language', [AuthController::class, 'updateLanguage']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/admin/info', [UserController::class, 'adminInfo'])->middleware('management_access:admin');
    Route::get('/users', [UserController::class, 'index'])->middleware('management_access:read');
    Route::post('/users/{id}', [UserController::class, 'update'])->middleware('management_access:admin');
    Route::post('/users/{id}/resend-verification-email', [UserController::class, 'resendVerificationEmail'])->middleware('management_access:admin');

    Route::get('/members/candidates', [MemberController::class, 'candidates'])->middleware('management_access:manager');
    Route::get('/members', [MemberController::class, 'index'])->middleware('management_access:read-members');
    Route::post('/members', [MemberController::class, 'store'])->middleware('management_access:manager');
    Route::put('/members/{member}', [MemberController::class, 'update'])->middleware('management_access:manager');
    Route::patch('/members/{member}', [MemberController::class, 'update'])->middleware('management_access:manager');
    Route::delete('/members/{member}', [MemberController::class, 'destroy'])->middleware('management_access:manager');

    Route::middleware('is_admin')->group(function () {
        Route::get('/pricing-rules/preview', [PricingRuleController::class, 'preview']);
        Route::apiResource('pricing-rules', PricingRuleController::class)->except('show');
    });

    Route::get('/seasons/{season}/allocations', [AllocationController::class, 'index'])->middleware('management_access:read');
    Route::post('/seasons/{season}/allocations', [AllocationController::class, 'store'])->middleware('management_access:own-season');
    Route::put('/allocations/{allocation}', [AllocationController::class, 'update'])->middleware('management_access:own-allocation');
    Route::put('/allocations/{allocation}/status', [AllocationController::class, 'updateStatus'])->middleware('management_access:own-allocation');
    Route::delete('/allocations/{allocation}', [AllocationController::class, 'destroy'])->middleware('management_access:own-allocation');
    Route::get('/seasons/{season}/members/available', [SeasonMemberController::class, 'available'])->middleware('management_access:own-season');
    Route::get('/seasons/{season}/members', [SeasonMemberController::class, 'index'])->middleware('management_access:read');
    Route::post('/seasons/{season}/members', [SeasonMemberController::class, 'store'])->middleware('management_access:own-season');
    Route::patch('/seasons/{season}/members/{memberSeason}', [SeasonMemberController::class, 'update'])->middleware('management_access:own-season');
    Route::delete('/seasons/{season}/members/{memberSeason}', [SeasonMemberController::class, 'destroy'])->middleware('management_access:own-season');
    Route::get('/seasons/{season}/units/available', [SeasonUnitController::class, 'available'])->middleware('management_access:own-season');
    Route::get('/seasons/{season}/units', [SeasonUnitController::class, 'index'])->middleware('management_access:read');
    Route::post('/seasons/{season}/units', [SeasonUnitController::class, 'store'])->middleware('management_access:own-season');
    Route::patch('/seasons/{season}/units/{unitSeason}', [SeasonUnitController::class, 'update'])->middleware('management_access:own-season');
    Route::delete('/seasons/{season}/units/{unitSeason}', [SeasonUnitController::class, 'destroy'])->middleware('management_access:own-season');

    Route::get('/seasons', [SeasonController::class, 'index'])->middleware('management_access:read');
    Route::post('/seasons', [SeasonController::class, 'store'])->middleware('management_access:manager');
    Route::patch('/seasons/{season}/status', [SeasonController::class, 'updateStatus'])->middleware('management_access:own-season');
    Route::match(['put', 'patch'], '/seasons/{season}', [SeasonController::class, 'update'])->middleware('management_access:edit-season');
    Route::delete('/seasons/{season}', [SeasonController::class, 'destroy'])->middleware('management_access:manager');
    Route::get('/locations', [LocationController::class, 'index'])->middleware('management_access:read');
    Route::post('/locations', [LocationController::class, 'store'])->middleware('management_access:manager');
    Route::match(['put', 'patch'], '/locations/{location}', [LocationController::class, 'update'])->middleware('management_access:edit-location');
    Route::delete('/locations/{location}', [LocationController::class, 'destroy'])->middleware('management_access:manager');
    Route::get('/locations/{location}/layout', [LocationLayoutController::class, 'show'])->middleware('management_access:read');
    Route::post('/locations/{location}/layout', [LocationLayoutController::class, 'update'])->middleware('management_access:own-location');
    Route::delete('/locations/{location}/layout', [LocationLayoutController::class, 'destroy'])->middleware('management_access:own-location');
    Route::get('/locations/{location}/units', [UnitController::class, 'index'])->middleware('management_access:read');
    Route::post('/locations/{location}/units', [UnitController::class, 'store'])->middleware('management_access:own-location');
    Route::match(['put', 'patch'], '/locations/{location}/units/{unit}', [UnitController::class, 'update'])->middleware('management_access:own-location');
    Route::delete('/locations/{location}/units/{unit}', [UnitController::class, 'destroy'])->middleware('management_access:own-location');
});

// Health check
Route::get('/health', [HealthController::class, 'show']);

// Layout images are plain <img> sources, which cannot send a bearer token
Route::get('/locations/{location}/layout/image', [LocationLayoutController::class, 'image']);
