<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSeasonRequest;
use App\Http\Requests\UpdateSeasonRequest;
use App\Models\Member;
use App\Models\Season;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SeasonController extends Controller
{
    /**
     * List seasons
     *
     * @endpoint
     * @authenticated
     * @responseField seasons object[] Seasons, newest first
     * @responseField seasons[].status string Status: preparation, reserved, open or closed.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'seasons' => Season::with('owners:id,name,email')->orderByDesc('start_date')->orderByDesc('id')->get(),
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
     * @bodyParam status string Status: preparation, reserved, open or closed. Defaults to preparation. Example: preparation
     * @bodyParam copy_from_season_id integer ID of a season whose member and unit enrollments are copied into the new season. Categories are re-snapshotted from the current member/unit categories.
     */
    public function store(StoreSeasonRequest $request): JsonResponse
    {
        $data = $request->validated();
        $sourceId = $data['copy_from_season_id'] ?? null;
        $ownerIds = $data['owner_ids'];
        unset($data['copy_from_season_id'], $data['owner_ids']);

        $copied = ['members' => 0, 'units' => 0];

        $season = DB::transaction(function () use ($data, $sourceId, $ownerIds, &$copied) {
            $season = Season::create($data);
            $season->owners()->sync($ownerIds);

            if ($sourceId !== null) {
                $source = Season::findOrFail($sourceId);

                $members = Member::whereIn('id', $source->memberSeasons()->select('member_id'))->get();
                foreach ($members as $member) {
                    $season->memberSeasons()->create(['member_id' => $member->id, 'category' => $member->category]);
                }

                $units = Unit::whereIn('id', $source->unitSeasons()->select('unit_id'))->get();
                foreach ($units as $unit) {
                    $season->unitSeasons()->create(['unit_id' => $unit->id, 'category' => $unit->category]);
                }

                $copied = ['members' => $members->count(), 'units' => $units->count()];
            }

            return $season;
        });

        return response()->json(['season' => $season->load('owners:id,name,email'), 'copied' => $copied], 201);
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
     * @bodyParam status string Status: preparation, reserved, open or closed. If omitted, the current status is retained. Example: open
     */
    public function update(UpdateSeasonRequest $request, Season $season): JsonResponse
    {
        $data = $request->validated();
        $ownerIds = $data['owner_ids'] ?? null;
        unset($data['owner_ids']);

        DB::transaction(function () use ($season, $data, $ownerIds) {
            $season->update($data);
            if ($ownerIds !== null) {
                $season->owners()->sync($ownerIds);
            }
        });

        return response()->json(['season' => $season->load('owners:id,name,email')]);
    }

    /**
     * Update season status without changing other season details.
     * Only owners of the season can use this endpoint.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @bodyParam status string required Status: preparation, reserved, open or closed. Example: open
     * @responseField season object Updated season including owners.
     */
    public function updateStatus(Request $request, Season $season): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(Season::STATUSES)],
        ]);

        $season->update($data);

        return response()->json(['season' => $season->load('owners:id,name,email')]);
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
        if ($season->memberSeasons()->exists() || $season->unitSeasons()->exists()) {
            return response()->json(['message' => 'Season has enrollments and cannot be deleted'], 409);
        }

        if ($season->pricingRules()->exists()) {
            return response()->json(['message' => 'Season has pricing rules and cannot be deleted'], 409);
        }

        $season->delete();

        return response()->json(['message' => 'Season deleted']);
    }
}
