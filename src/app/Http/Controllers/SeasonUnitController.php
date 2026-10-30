<?php

namespace App\Http\Controllers;

use App\Http\Requests\EnrollUnitRequest;
use App\Models\Season;
use App\Models\Unit;
use App\Models\UnitSeason;
use Illuminate\Http\JsonResponse;

class SeasonUnitController extends Controller
{
    /**
     * List units enrolled in a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @responseField enrollments object[] Enrollments with the unit's code, location name and the category snapshot
     */
    public function index(Season $season): JsonResponse
    {
        $enrollments = $season->unitSeasons()
            ->with('unit.location')
            ->get()
            ->sortBy(fn (UnitSeason $item) => mb_strtolower($item->unit->location->name.' '.$item->unit->code))
            ->values()
            ->map(fn (UnitSeason $item) => $this->present($item));

        return response()->json(['enrollments' => $enrollments]);
    }

    /**
     * List units not yet enrolled in a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @responseField units object[] Units that can still be enrolled
     */
    public function available(Season $season): JsonResponse
    {
        $units = Unit::with('location:id,name')
            ->whereNotIn('id', $season->unitSeasons()->select('unit_id'))
            ->get()
            ->sortBy(fn (Unit $unit) => mb_strtolower($unit->location->name.' '.$unit->code))
            ->values()
            ->map(fn (Unit $unit) => [
                'id' => $unit->id,
                'code' => $unit->code,
                'category' => $unit->category,
                'location_name' => $unit->location->name,
            ]);

        return response()->json(['units' => $units]);
    }

    /**
     * Enroll unit in a season
     *
     * The unit's current category is copied to the enrollment.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @bodyParam unit_id integer required ID of the unit to enroll.
     */
    public function store(EnrollUnitRequest $request, Season $season): JsonResponse
    {
        $unit = Unit::findOrFail($request->validated('unit_id'));

        $enrollment = $season->unitSeasons()->create([
            'unit_id' => $unit->id,
            'category' => $unit->category,
        ]);

        return response()->json(['enrollment' => $this->present($enrollment->load('unit.location'))], 201);
    }

    /**
     * Remove unit enrollment from a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @urlParam unitSeason integer required The enrollment ID.
     */
    public function destroy(Season $season, UnitSeason $unitSeason): JsonResponse
    {
        abort_unless($unitSeason->season_id === $season->id, 404);

        $unitSeason->delete();

        return response()->json(['message' => 'Enrollment removed']);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(UnitSeason $item): array
    {
        return [
            'id' => $item->id,
            'season_id' => $item->season_id,
            'unit_id' => $item->unit_id,
            'code' => $item->unit->code,
            'location_name' => $item->unit->location->name,
            'category' => $item->category,
        ];
    }
}
