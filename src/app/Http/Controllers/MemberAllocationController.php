<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\Season;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberAllocationController extends Controller
{
    /**
     * List the authenticated member's allocations in open and reserved seasons.
     *
     * @endpoint
     * @authenticated
     * @responseField allocations object[] The member's allocations, including cancelled ones.
     */
    public function index(Request $request): JsonResponse
    {
        $member = $this->currentMember($request);
        $allocations = $this->visibleAllocations($member->id)
            ->with(['memberSeason.season', 'unitSeason.unit.location'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (Allocation $allocation) => [
                'id' => $allocation->id,
                'season_name' => $allocation->memberSeason->season->name,
                'location_name' => $allocation->unitSeason->unit->location->name,
                'unit_code' => $allocation->unitSeason->unit->code,
                'status' => $allocation->status,
                'amount_due' => $allocation->amount_due,
                'variable_symbol' => $allocation->variable_symbol,
            ]);

        return response()->json(['allocations' => $allocations]);
    }

    /**
     * Cancel the authenticated member's pending or confirmed allocation.
     *
     * @endpoint
     * @authenticated
     * @urlParam allocation integer required The allocation ID.
     */
    public function cancel(Request $request, int $allocation): JsonResponse
    {
        $member = $this->currentMember($request);
        $visible = $this->visibleAllocations($member->id)->whereKey($allocation);
        abort_unless((clone $visible)->exists(), 404);

        $updated = $visible
            ->whereIn('status', [Allocation::STATUS_PENDING, Allocation::STATUS_CONFIRMED])
            ->update(['status' => Allocation::STATUS_CANCELLED]);
        abort_unless($updated, 409, 'This allocation can no longer be cancelled.');

        return response()->json(['status' => Allocation::STATUS_CANCELLED]);
    }

    private function visibleAllocations(int $memberId): Builder
    {
        return Allocation::query()->whereHas('memberSeason', function (Builder $query) use ($memberId) {
            $query->where('member_id', $memberId)
                ->whereHas('season', fn (Builder $season) => $season->whereIn('status', [
                    Season::STATUS_OPEN,
                    Season::STATUS_RESERVED,
                ]));
        });
    }
}
