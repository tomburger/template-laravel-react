<?php

namespace App\Http\Controllers;

use App\Http\Requests\UnitRequest;
use App\Models\Location;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;

class UnitController extends Controller
{
    /**
     * List units of a location
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @responseField units object[] List of units
     */
    public function index(Location $location): JsonResponse
    {
        return response()->json([
            'units' => $location->units()->orderBy('code')->get(),
        ]);
    }

    /**
     * Create unit
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @bodyParam code string required Unit code, unique within the location.
     * @bodyParam category string Unit category.
     */
    public function store(UnitRequest $request, Location $location): JsonResponse
    {
        $unit = $location->units()->create($request->validated());

        return response()->json(['unit' => $unit], 201);
    }

    /**
     * Update unit
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @urlParam unit integer required The unit ID.
     * @bodyParam code string required Unit code, unique within the location.
     * @bodyParam category string Unit category.
     */
    public function update(UnitRequest $request, Location $location, Unit $unit): JsonResponse
    {
        abort_unless($unit->location_id === $location->id, 404);

        $unit->update($request->validated());

        return response()->json(['unit' => $unit]);
    }

    /**
     * Delete unit
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @urlParam unit integer required The unit ID.
     */
    public function destroy(Location $location, Unit $unit): JsonResponse
    {
        abort_unless($unit->location_id === $location->id, 404);

        if ($unit->seasons()->exists()) {
            return response()->json(['message' => 'Unit is enrolled in a season and cannot be deleted'], 409);
        }

        $unit->delete();

        return response()->json(['message' => 'Unit deleted']);
    }
}
