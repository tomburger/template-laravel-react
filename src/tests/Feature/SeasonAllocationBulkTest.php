<?php

namespace Tests\Feature;

use App\Models\Allocation;
use App\Models\Location;
use App\Models\Member;
use App\Models\MemberSeason;
use App\Models\PricingRule;
use App\Models\Season;
use App\Models\UnitSeason;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class SeasonAllocationBulkTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = require __DIR__ . '/../../bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $this->mockConsoleOutput = false;

        return $app;
    }

    private function allocate(MemberSeason $member, UnitSeason $unit, string $status, string $symbol): Allocation
    {
        return Allocation::create([
            'member_season_id' => $member->id,
            'unit_season_id' => $unit->id,
            'status' => $status,
            'amount_due' => 100,
            'variable_symbol' => $symbol,
        ]);
    }

    public function test_bulk_removal_preserves_confirmed_paid_and_other_seasons(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $memberUser = User::create(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password']);
        $member = Member::create(['id' => $memberUser->id, 'first_name' => 'First', 'last_name' => 'Last']);
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $other = Season::create(['name' => 'Other', 'start_date' => '2025-01-01', 'end_date' => '2025-12-31']);
        $season->owners()->attach($owner);
        $memberSeason = $season->memberSeasons()->create(['member_id' => $member->id]);
        $otherMemberSeason = $other->memberSeasons()->create(['member_id' => $member->id]);
        $location = Location::create(['name' => 'Location']);
        $unit = $location->units()->create(['code' => 'A']);
        $unitSeason = $season->unitSeasons()->create(['unit_id' => $unit->id]);
        $otherUnitSeason = $other->unitSeasons()->create(['unit_id' => $unit->id]);
        $pending = $this->allocate($memberSeason, $unitSeason, 'pending', '1');
        $cancelled = $this->allocate($memberSeason, $unitSeason, 'cancelled', '2');
        $confirmed = $this->allocate($memberSeason, $unitSeason, 'confirmed', '3');
        $paid = $this->allocate($memberSeason, $unitSeason, 'paid', '4');
        $otherAllocation = $this->allocate($otherMemberSeason, $otherUnitSeason, 'pending', '5');

        $this->actingAs($owner, 'sanctum')->deleteJson("/api/seasons/{$season->id}/allocations")
            ->assertOk()->assertExactJson(['deleted' => 2, 'retained' => 2]);
        $this->assertDatabaseMissing('allocations', ['id' => $pending->id]);
        $this->assertDatabaseMissing('allocations', ['id' => $cancelled->id]);
        foreach ([$confirmed, $paid, $otherAllocation] as $allocation) {
            $this->assertDatabaseHas('allocations', ['id' => $allocation->id]);
        }
    }

    public function test_recalculation_only_updates_matching_pending_allocations(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $memberUser = User::create(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password']);
        $member = Member::create(['id' => $memberUser->id, 'first_name' => 'First', 'last_name' => 'Last']);
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);
        $memberSeason = $season->memberSeasons()->create(['member_id' => $member->id, 'category' => 'Eligible']);
        $location = Location::create(['name' => 'Location']);
        $firstUnit = $location->units()->create(['code' => 'A']);
        $secondUnit = $location->units()->create(['code' => 'B']);
        $first = $season->unitSeasons()->create(['unit_id' => $firstUnit->id, 'category' => 'Priced']);
        $second = $season->unitSeasons()->create(['unit_id' => $secondUnit->id, 'category' => 'Unpriced']);
        $pending = $this->allocate($memberSeason, $first, 'pending', '1');
        $unmatched = $this->allocate($memberSeason, $second, 'pending', '2');
        $paid = $this->allocate($memberSeason, $first, 'paid', '3');
        $cancelled = $this->allocate($memberSeason, $first, 'cancelled', '4');
        PricingRule::create(['season_id' => $season->id, 'unit_category' => 'Priced', 'member_category' => 'Eligible', 'priority' => 1, 'price' => 250]);

        $this->actingAs($owner, 'sanctum')->postJson("/api/seasons/{$season->id}/allocations/recalculate")
            ->assertOk()->assertExactJson(['recalculated' => 1, 'skipped_no_rule' => 1]);
        $this->assertSame('250.00', $pending->fresh()->amount_due);
        foreach ([$unmatched, $paid, $cancelled] as $allocation) {
            $this->assertSame('100.00', $allocation->fresh()->amount_due);
        }
    }

    public function test_copy_uses_destination_enrollments_and_prices_and_reports_skips(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $memberUser = User::create(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password']);
        $member = Member::create(['id' => $memberUser->id, 'first_name' => 'First', 'last_name' => 'Last']);
        $source = Season::create(['name' => 'Source', 'start_date' => '2025-01-01', 'end_date' => '2025-12-31']);
        $destination = Season::create(['name' => 'Destination', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $destination->owners()->attach($owner);
        $sourceMember = $source->memberSeasons()->create(['member_id' => $member->id]);
        $targetMember = $destination->memberSeasons()->create(['member_id' => $member->id, 'category' => 'Eligible']);
        $location = Location::create(['name' => 'Location']);
        $units = [];
        foreach (['A', 'B', 'C', 'D', 'E'] as $code) {
            $units[$code] = $location->units()->create(['code' => $code]);
            $sourceUnit = $source->unitSeasons()->create(['unit_id' => $units[$code]->id]);
            $this->allocate($sourceMember, $sourceUnit, $code === 'E' ? 'cancelled' : 'confirmed', (string) (count($units)));
        }
        $targetA = $destination->unitSeasons()->create(['unit_id' => $units['A']->id, 'category' => 'Priced']);
        $targetB = $destination->unitSeasons()->create(['unit_id' => $units['B']->id, 'category' => 'Priced']);
        $destination->unitSeasons()->create(['unit_id' => $units['D']->id, 'category' => 'Unpriced']);
        $destination->unitSeasons()->create(['unit_id' => $units['E']->id, 'category' => 'Priced']);
        $this->allocate($targetMember, $targetB, 'paid', '6');
        $this->allocate($targetMember, $targetA, 'cancelled', '7');
        $otherUser = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $otherMember = Member::create(['id' => $otherUser->id, 'first_name' => 'Other', 'last_name' => 'Member']);
        $otherSourceMember = $source->memberSeasons()->create(['member_id' => $otherMember->id]);
        $unitF = $location->units()->create(['code' => 'F']);
        $sourceF = $source->unitSeasons()->create(['unit_id' => $unitF->id]);
        $destination->unitSeasons()->create(['unit_id' => $unitF->id, 'category' => 'Priced']);
        $this->allocate($otherSourceMember, $sourceF, 'pending', '8');
        PricingRule::create(['season_id' => $destination->id, 'unit_category' => 'Priced', 'member_category' => 'Eligible', 'priority' => 1, 'price' => 250]);

        $this->actingAs($owner, 'sanctum')->postJson("/api/seasons/{$destination->id}/allocations/copy", ['source_season_id' => $source->id])
            ->assertOk()->assertExactJson(['copied' => 1, 'skipped_ineligible' => 2, 'skipped_occupied' => 1, 'skipped_no_rule' => 1]);
        $copy = Allocation::where('unit_season_id', $targetA->id)->where('status', 'pending')->sole();
        $this->assertSame($targetMember->id, $copy->member_season_id);
        $this->assertSame('pending', $copy->status);
        $this->assertSame('250.00', $copy->amount_due);
        $this->assertSame('1000000001', $copy->variable_symbol);
        $this->postJson("/api/seasons/{$destination->id}/allocations/copy", ['source_season_id' => $source->id])
            ->assertOk()->assertJsonPath('copied', 0)->assertJsonPath('skipped_occupied', 2);
    }

    public function test_bulk_actions_require_destination_ownership_and_valid_source(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $manager = User::create(['name' => 'Manager', 'email' => 'manager@example.test', 'password' => 'password']);
        $manager->forceFill(['is_content_manager' => true])->save();
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);
        $base = "/api/seasons/{$season->id}/allocations";

        $this->deleteJson($base)->assertUnauthorized();
        $this->actingAs($manager, 'sanctum')->deleteJson($base)->assertForbidden();
        $this->postJson("{$base}/recalculate")->assertForbidden();
        $this->postJson("{$base}/copy", ['source_season_id' => $season->id])->assertForbidden();
        $this->actingAs($owner, 'sanctum');
        foreach ([[], ['source_season_id' => $season->id], ['source_season_id' => 99999]] as $body) {
            $this->postJson("{$base}/copy", $body)->assertUnprocessable()->assertJsonValidationErrors('source_season_id');
        }
    }
}
