<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAllocationRequest;
use App\Http\Requests\UpdateAllocationRequest;
use App\Http\Requests\UpdateAllocationStatusRequest;
use App\Models\Allocation;
use App\Models\MemberSeason;
use App\Models\Season;
use App\Models\UnitSeason;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AllocationController extends Controller
{
    private const WITH = ['memberSeason.member', 'unitSeason.unit.location'];

    /**
     * List allocations of a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @responseField allocations object[] Allocations with member, unit, amount due, variable symbol and status
     */
    public function index(Season $season): JsonResponse
    {
        $allocations = Allocation::with(self::WITH)
            ->whereHas('unitSeason', fn ($q) => $q->where('season_id', $season->id))
            ->orderByDesc('id')
            ->get()
            ->map(fn (Allocation $allocation) => $this->present($allocation));

        return response()->json(['allocations' => $allocations]);
    }

    /**
     * Allocate a unit to a member
     *
     * Links an enrolled member to an enrolled unit. The price is resolved from the pricing rules
     * and stored as the amount due, and a variable symbol is generated.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @bodyParam member_season_id integer required ID of the member's season enrollment.
     * @bodyParam unit_season_id integer required ID of the unit's season enrollment.
     */
    public function store(StoreAllocationRequest $request, Season $season, PricingService $pricing): JsonResponse
    {
        $memberSeason = MemberSeason::where('season_id', $season->id)->find($request->validated('member_season_id'));
        $unitSeason = UnitSeason::where('season_id', $season->id)->find($request->validated('unit_season_id'));

        if (! $memberSeason || ! $unitSeason) {
            return response()->json(['message' => 'The member and the unit must both be enrolled in this season'], 422);
        }

        $rule = $pricing->resolve($season->id, $unitSeason->category, $memberSeason->category);
        if (! $rule) {
            return response()->json(['message' => 'No pricing rule matches this unit and member'], 422);
        }

        $allocation = DB::transaction(function () use ($memberSeason, $unitSeason, $rule) {
            $taken = Allocation::where('unit_season_id', $unitSeason->id)
                ->where('status', '!=', Allocation::STATUS_CANCELLED)
                ->exists();
            if ($taken) {
                return null;
            }

            return Allocation::create([
                'member_season_id' => $memberSeason->id,
                'unit_season_id' => $unitSeason->id,
                'status' => Allocation::STATUS_PENDING,
                'amount_due' => $rule->price,
                'variable_symbol' => $this->nextVariableSymbol(),
            ]);
        });

        if (! $allocation) {
            return response()->json(['message' => 'This unit is already allocated in this season'], 409);
        }

        return response()->json(['allocation' => $this->present($allocation->load(self::WITH))], 201);
    }

    /**
     * Update allocation
     *
     * Changes the amount due, the variable symbol and the status. The status must follow the
     * allowed changes; sending the current status leaves it unchanged.
     *
     * @endpoint
     * @authenticated
     * @urlParam allocation integer required The allocation ID.
     * @bodyParam amount_due number required Amount due in CZK.
     * @bodyParam variable_symbol string required Variable symbol, up to 10 digits, unique.
     * @bodyParam status string required The status: pending, confirmed, paid or cancelled.
     */
    public function update(UpdateAllocationRequest $request, Allocation $allocation): JsonResponse
    {
        $data = $request->validated();

        if ($data['status'] !== $allocation->status && ! $allocation->canTransitionTo($data['status'])) {
            return response()->json(['message' => "Status cannot change from {$allocation->status} to {$data['status']}"], 422);
        }

        $allocation->update($data);

        return response()->json(['allocation' => $this->present($allocation->load(self::WITH))]);
    }

    /**
     * Change allocation status
     *
     * Allowed changes: pending to confirmed or cancelled; confirmed to pending, paid or cancelled;
     * paid to confirmed or cancelled. Cancelled is final.
     *
     * @endpoint
     * @authenticated
     * @urlParam allocation integer required The allocation ID.
     * @bodyParam status string required The new status: pending, confirmed, paid or cancelled.
     */
    public function updateStatus(UpdateAllocationStatusRequest $request, Allocation $allocation): JsonResponse
    {
        $status = $request->validated('status');

        if (! $allocation->canTransitionTo($status)) {
            return response()->json(['message' => "Status cannot change from {$allocation->status} to {$status}"], 422);
        }

        $allocation->update(['status' => $status]);

        return response()->json(['allocation' => $this->present($allocation->load(self::WITH))]);
    }

    /**
     * Delete allocation
     *
     * Only pending or cancelled allocations can be deleted.
     *
     * @endpoint
     * @authenticated
     * @urlParam allocation integer required The allocation ID.
     */
    public function destroy(Allocation $allocation): JsonResponse
    {
        if (! in_array($allocation->status, [Allocation::STATUS_PENDING, Allocation::STATUS_CANCELLED], true)) {
            return response()->json(['message' => 'Only pending or cancelled allocations can be deleted'], 409);
        }

        $allocation->delete();

        return response()->json(['message' => 'Allocation deleted']);
    }

    // Next free variable symbol above the highest numeric one (symbols can also be set manually);
    // must be called inside a transaction
    private function nextVariableSymbol(): string
    {
        $highest = Allocation::pluck('variable_symbol')->map(fn ($value) => (int) $value)->max() ?? 0;

        return (string) max($highest + 1, 1000000001);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Allocation $allocation): array
    {
        $member = $allocation->memberSeason->member;
        $unit = $allocation->unitSeason->unit;

        return [
            'id' => $allocation->id,
            'season_id' => $allocation->unitSeason->season_id,
            'member_season_id' => $allocation->member_season_id,
            'unit_season_id' => $allocation->unit_season_id,
            'member_name' => $member->last_name.' '.$member->first_name,
            'member_category' => $allocation->memberSeason->category,
            'unit_code' => $unit->code,
            'location_name' => $unit->location->name,
            'unit_category' => $allocation->unitSeason->category,
            'status' => $allocation->status,
            'amount_due' => $allocation->amount_due,
            'variable_symbol' => $allocation->variable_symbol,
        ];
    }
}
