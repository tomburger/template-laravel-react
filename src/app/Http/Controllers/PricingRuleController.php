<?php

namespace App\Http\Controllers;

use App\Http\Requests\PricingRuleRequest;
use App\Models\PricingRule;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingRuleController extends Controller
{
    /**
     * List pricing rules
     *
     * @endpoint
     * @authenticated
     * @responseField rules object[] Pricing rules with season_name, highest priority first
     */
    public function index(): JsonResponse
    {
        $rules = PricingRule::with('season:id,name')
            ->orderByDesc('priority')
            ->orderBy('id')
            ->get()
            ->map(fn (PricingRule $rule) => $this->present($rule));

        return response()->json(['rules' => $rules]);
    }

    /**
     * Create pricing rule
     *
     * @endpoint
     * @authenticated
     * @bodyParam season_id integer Season the rule applies to. Omit for all seasons.
     * @bodyParam unit_category string Unit category the rule applies to. Omit for all categories.
     * @bodyParam member_category string Member category the rule applies to. Omit for all categories.
     * @bodyParam priority integer required Higher priority wins when several rules match.
     * @bodyParam price number required Price in CZK.
     */
    public function store(PricingRuleRequest $request): JsonResponse
    {
        $rule = PricingRule::create($request->validated());

        return response()->json(['rule' => $this->present($rule->load('season:id,name'))], 201);
    }

    /**
     * Update pricing rule
     *
     * @endpoint
     * @authenticated
     * @urlParam pricingRule integer required The pricing rule ID.
     * @bodyParam season_id integer Season the rule applies to. Omit for all seasons.
     * @bodyParam unit_category string Unit category the rule applies to. Omit for all categories.
     * @bodyParam member_category string Member category the rule applies to. Omit for all categories.
     * @bodyParam priority integer required Higher priority wins when several rules match.
     * @bodyParam price number required Price in CZK.
     */
    public function update(PricingRuleRequest $request, PricingRule $pricingRule): JsonResponse
    {
        $data = $request->validated();
        $pricingRule->update($data + ['season_id' => null, 'unit_category' => null, 'member_category' => null]);

        return response()->json(['rule' => $this->present($pricingRule->load('season:id,name'))]);
    }

    /**
     * Delete pricing rule
     *
     * @endpoint
     * @authenticated
     * @urlParam pricingRule integer required The pricing rule ID.
     */
    public function destroy(PricingRule $pricingRule): JsonResponse
    {
        $pricingRule->delete();

        return response()->json(['message' => 'Pricing rule deleted']);
    }

    /**
     * Preview price
     *
     * Shows which rule would apply, and the resulting price, for a season and categories.
     *
     * @endpoint
     * @authenticated
     * @queryParam season_id integer required The season ID.
     * @queryParam unit_category string Unit category.
     * @queryParam member_category string Member category.
     * @responseField rule object|null The matching rule, or null when none matches
     * @responseField price string|null The resulting price, or null when no rule matches
     */
    public function preview(Request $request, PricingService $pricing): JsonResponse
    {
        $data = $request->validate([
            'season_id' => ['required', 'integer', 'exists:seasons,id'],
            'unit_category' => ['nullable', 'string', 'max:255'],
            'member_category' => ['nullable', 'string', 'max:255'],
        ]);

        $rule = $pricing->resolve(
            (int) $data['season_id'],
            ($data['unit_category'] ?? '') !== '' ? $data['unit_category'] : null,
            ($data['member_category'] ?? '') !== '' ? $data['member_category'] : null,
        );

        return response()->json([
            'rule' => $rule ? $this->present($rule->load('season:id,name')) : null,
            'price' => $rule?->price,
        ]);
    }

    private function present(PricingRule $rule): array
    {
        return [
            'id' => $rule->id,
            'season_id' => $rule->season_id,
            'season_name' => $rule->season?->name,
            'unit_category' => $rule->unit_category,
            'member_category' => $rule->member_category,
            'priority' => $rule->priority,
            'price' => $rule->price,
        ];
    }
}
