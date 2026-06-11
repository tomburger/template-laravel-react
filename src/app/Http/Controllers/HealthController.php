<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Health check endpoint.
     *
     * Returns the current API availability status.
     *
     * @group System
     * @unauthenticated
     *
     * @response 200 {
     *   "status": "success",
     *   "message": "API is running"
     * }
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'API is running',
        ]);
    }
}
