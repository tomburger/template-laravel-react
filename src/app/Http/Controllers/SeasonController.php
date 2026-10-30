<?php

namespace App\Http\Controllers;

use App\Http\Requests\SeasonRequest;
use App\Models\Season;
use Illuminate\Http\JsonResponse;

class SeasonController extends Controller
{
    /**
     * List seasons
     *
     * @endpoint
     * @authenticated
     * @responseField seasons object[] Seasons, newest first
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'seasons' => Season::orderByDesc('start_date')->orderByDesc('id')->get(),
        ]);
    }

    /**
     * Create season
     *
     * @endpoint
     * @authenticated
     * @bodyParam name string required Season name.
     * @bodyParam start_date string required Start date (Y-m-d).
     * @bodyParam end_date string required End date (Y-m-d), not before the start date.
     */
    public function store(SeasonRequest $request): JsonResponse
    {
        $season = Season::create($request->validated());

        return response()->json(['season' => $season], 201);
    }

    /**
     * Update season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @bodyParam name string required Season name.
     * @bodyParam start_date string required Start date (Y-m-d).
     * @bodyParam end_date string required End date (Y-m-d), not before the start date.
     */
    public function update(SeasonRequest $request, Season $season): JsonResponse
    {
        $season->update($request->validated());

        return response()->json(['season' => $season]);
    }

    /**
     * Delete season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     */
    public function destroy(Season $season): JsonResponse
    {
        $season->delete();

        return response()->json(['message' => 'Season deleted']);
    }
}
