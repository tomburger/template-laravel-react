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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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
     * Remove pending and cancelled allocations from a season.
     *
     * Confirmed and paid allocations remain unchanged.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The destination season ID.
     * @responseField deleted integer Number of allocations removed.
     * @responseField retained integer Number of allocations retained.
     */
    public function destroyEligible(Season $season): JsonResponse
    {
        $result = DB::transaction(function () use ($season) {
            $query = Allocation::whereHas('unitSeason', fn ($q) => $q->where('season_id', $season->id));
            $deleted = (clone $query)->whereIn('status', [Allocation::STATUS_PENDING, Allocation::STATUS_CANCELLED])->delete();

            return ['deleted' => $deleted, 'retained' => $query->count()];
        });

        return response()->json($result);
    }

    /**
     * Recalculate pending allocations for a season.
     *
     * Unmatched allocations are skipped; other statuses remain unchanged.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @responseField recalculated integer Number of allocations recalculated.
     * @responseField skipped_no_rule integer Number without a matching pricing rule.
     */
    public function recalculate(Season $season, PricingService $pricing): JsonResponse
    {
        $result = DB::transaction(function () use ($season, $pricing) {
            $allocations = Allocation::with(['memberSeason', 'unitSeason'])
                ->whereHas('unitSeason', fn ($q) => $q->where('season_id', $season->id))
                ->where('status', Allocation::STATUS_PENDING)
                ->lockForUpdate()
                ->get();
            $result = ['recalculated' => 0, 'skipped_no_rule' => 0];

            foreach ($allocations as $allocation) {
                $rule = $pricing->resolve($season->id, $allocation->unitSeason->category, $allocation->memberSeason->category);
                if (! $rule) {
                    $result['skipped_no_rule']++;
                    continue;
                }

                $allocation->update(['amount_due' => $rule->price]);
                $result['recalculated']++;
            }

            return $result;
        });

        return response()->json($result);
    }

    /**
     * Copy active allocations from another season.
     *
     * Only members and units enrolled in the destination are eligible. Occupied units and
     * allocations without a matching destination price are skipped. Copies start pending.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The destination season ID.
     * @bodyParam source_season_id integer required The source season ID.
     * @responseField copied integer Number of allocations copied.
     * @responseField skipped_ineligible integer Number missing a destination enrollment.
     * @responseField skipped_occupied integer Number whose destination unit was already allocated.
     * @responseField skipped_no_rule integer Number without a matching destination pricing rule.
     */
    public function copy(Request $request, Season $season, PricingService $pricing): JsonResponse
    {
        $data = $request->validate([
            'source_season_id' => ['required', 'integer', 'exists:seasons,id', Rule::notIn([$season->id])],
        ]);

        $result = DB::transaction(function () use ($season, $pricing, $data) {
            $members = $season->memberSeasons()->get()->keyBy('member_id');
            $units = $season->unitSeasons()->get()->keyBy('unit_id');
            $occupied = Allocation::whereHas('unitSeason', fn ($q) => $q->where('season_id', $season->id))
                ->where('status', '!=', Allocation::STATUS_CANCELLED)
                ->pluck('unit_season_id')
                ->flip();
            $source = Allocation::with(['memberSeason', 'unitSeason'])
                ->whereHas('unitSeason', fn ($q) => $q->where('season_id', $data['source_season_id']))
                ->where('status', '!=', Allocation::STATUS_CANCELLED)
                ->orderBy('id')
                ->get();
            $result = ['copied' => 0, 'skipped_ineligible' => 0, 'skipped_occupied' => 0, 'skipped_no_rule' => 0];

            foreach ($source as $allocation) {
                $member = $members->get($allocation->memberSeason->member_id);
                $unit = $units->get($allocation->unitSeason->unit_id);
                if (! $member || ! $unit) {
                    $result['skipped_ineligible']++;
                    continue;
                }
                if ($occupied->has($unit->id)) {
                    $result['skipped_occupied']++;
                    continue;
                }
                $rule = $pricing->resolve($season->id, $unit->category, $member->category);
                if (! $rule) {
                    $result['skipped_no_rule']++;
                    continue;
                }
                $symbol = $this->nextVariableSymbol();
                if (strlen($symbol) > 10) {
                    throw ValidationException::withMessages(['variable_symbol' => 'No variable symbols are available.']);
                }
                Allocation::create([
                    'member_season_id' => $member->id,
                    'unit_season_id' => $unit->id,
                    'status' => Allocation::STATUS_PENDING,
                    'amount_due' => $rule->price,
                    'variable_symbol' => $symbol,
                ]);
                $occupied->put($unit->id, true);
                $result['copied']++;
            }

            return $result;
        });

        return response()->json($result);
    }

    /**
     * Preview the current rule price for an allocation.
     *
     * Uses the season enrollment categories and does not change the stored amount.
     *
     * @endpoint
     * @authenticated
     * @urlParam allocation integer required The allocation ID.
     * @responseField price string|null The matching price, or null when no rule matches.
     */
    public function previewPrice(Allocation $allocation, PricingService $pricing): JsonResponse
    {
        $rule = $pricing->resolve(
            $allocation->unitSeason->season_id,
            $allocation->unitSeason->category,
            $allocation->memberSeason->category,
        );

        return response()->json(['price' => $rule?->price])->header('Cache-Control', 'no-store');
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
