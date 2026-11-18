<?php

namespace App\Http\Controllers;

use App\Models\Season;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberSeasonController extends Controller
{
    /**
     * List open seasons and the authenticated member's enrollment state.
     *
     * @endpoint
     * @authenticated
     * @responseField seasons object[] Open seasons with the current member's enrollment state.
     */
    public function index(Request $request): JsonResponse
    {
        $member = $this->currentMember($request);

        $seasons = Season::query()
            ->select(['id', 'name', 'start_date', 'end_date'])
            ->where('status', Season::STATUS_OPEN)
            ->withExists(['memberSeasons as enrolled' => fn ($query) => $query->where('member_id', $member->id)])
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->get();

        return response()->json(['seasons' => $seasons]);
    }

    /**
     * Enroll the authenticated member in an open season.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     */
    public function store(Request $request, Season $season): JsonResponse
    {
        $member = $this->currentMember($request);

        DB::transaction(function () use ($member, $season) {
            $season = Season::whereKey($season->id)->lockForUpdate()->firstOrFail();
            abort_unless($season->status === Season::STATUS_OPEN, 409, 'This season is no longer open.');

            $season->memberSeasons()->firstOrCreate(
                ['member_id' => $member->id],
                ['category' => $member->category],
            );
        });

        return response()->json(['enrolled' => true]);
    }
}
