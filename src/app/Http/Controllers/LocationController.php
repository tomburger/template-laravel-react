<?php

namespace App\Http\Controllers;

use App\Http\Requests\LocationRequest;
use App\Models\Location;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    /**
     * List locations
     *
     * @endpoint
     * @authenticated
     * @responseField locations object[] List of locations with units_count
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'locations' => Location::withCount('units')->orderBy('name')->get(),
        ]);
    }

    /**
     * Create location
     *
     * @endpoint
     * @authenticated
     * @bodyParam name string required Location name.
     */
    public function store(LocationRequest $request): JsonResponse
    {
        $location = Location::create($request->validated());

        return response()->json(['location' => $location->loadCount('units')], 201);
    }

    /**
     * Update location
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @bodyParam name string required Location name.
     */
    public function update(LocationRequest $request, Location $location): JsonResponse
    {
        $location->update($request->validated());

        return response()->json(['location' => $location->loadCount('units')]);
    }

    /**
     * Delete location
     *
     * A location with units cannot be deleted.
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     */
    public function destroy(Location $location): JsonResponse
    {
        if ($location->units()->exists()) {
            return response()->json(['message' => 'Location has units and cannot be deleted'], 409);
        }

        $location->delete();

        return response()->json(['message' => 'Location deleted']);
    }
}
