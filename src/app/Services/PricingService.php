<?php

namespace App\Services;

use App\Models\PricingRule;

class PricingService
{
    /**
     * Resolve the rule that applies to the given season and categories.
     *
     * Null fields on a rule are wildcards. Highest priority wins; ties go to the
     * most specific rule (more non-null fields), then to the lowest id.
     */
    public function resolve(int $seasonId, ?string $unitCategory, ?string $memberCategory): ?PricingRule
    {
        return PricingRule::query()
            ->where(fn ($q) => $q->whereNull('season_id')->orWhere('season_id', $seasonId))
            ->where(fn ($q) => $q->whereNull('unit_category')->when($unitCategory !== null, fn ($q) => $q->orWhere('unit_category', $unitCategory)))
            ->where(fn ($q) => $q->whereNull('member_category')->when($memberCategory !== null, fn ($q) => $q->orWhere('member_category', $memberCategory)))
            ->get()
            ->sortBy([
                ['priority', 'desc'],
                fn ($a, $b) => $this->specificity($b) <=> $this->specificity($a),
                ['id', 'asc'],
            ])
            ->first();
    }

    private function specificity(PricingRule $rule): int
    {
        return (int) ($rule->season_id !== null) + (int) ($rule->unit_category !== null) + (int) ($rule->member_category !== null);
    }
}
