<?php

namespace Tests\Feature;

use App\Models\Allocation;
use App\Models\Location;
use App\Models\Member;
use App\Models\PricingRule;
use App\Models\Season;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class SeasonMemberCategoryTest extends TestCase
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

    public function test_owner_can_change_and_clear_the_season_category_without_repricing_existing_allocations(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $memberUser = User::create(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password']);
        $member = Member::create(['id' => $memberUser->id, 'first_name' => 'First', 'last_name' => 'Last', 'category' => 'General']);
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);
        $enrollment = $season->memberSeasons()->create(['member_id' => $member->id, 'category' => 'General']);
        $location = Location::create(['name' => 'Location']);
        $firstUnit = $location->units()->create(['code' => 'A']);
        $secondUnit = $location->units()->create(['code' => 'B']);
        $firstUnitSeason = $season->unitSeasons()->create(['unit_id' => $firstUnit->id]);
        $secondUnitSeason = $season->unitSeasons()->create(['unit_id' => $secondUnit->id]);
        $existing = Allocation::create([
            'member_season_id' => $enrollment->id,
            'unit_season_id' => $firstUnitSeason->id,
            'status' => 'pending',
            'amount_due' => 100,
            'variable_symbol' => '123',
        ]);
        PricingRule::create(['season_id' => $season->id, 'member_category' => 'Season', 'priority' => 1, 'price' => 200]);
        $this->actingAs($owner, 'sanctum');

        $this->patchJson("/api/seasons/{$season->id}/members/{$enrollment->id}", ['category' => 'Season'])
            ->assertOk()
            ->assertJsonPath('enrollment.category', 'Season')
            ->assertJsonPath('enrollment.member_category', 'General');
        $this->getJson("/api/seasons/{$season->id}/members")
            ->assertOk()
            ->assertJsonPath('enrollments.0.category', 'Season')
            ->assertJsonPath('enrollments.0.member_category', 'General');
        $this->assertSame('General', $member->fresh()->category);
        $this->assertSame('100.00', $existing->fresh()->amount_due);

        $this->postJson("/api/seasons/{$season->id}/allocations", [
            'member_season_id' => $enrollment->id,
            'unit_season_id' => $secondUnitSeason->id,
        ])->assertCreated()->assertJsonPath('allocation.amount_due', '200.00');
        $this->deleteJson("/api/seasons/{$season->id}/members/{$enrollment->id}")->assertStatus(409);

        $this->patchJson("/api/seasons/{$season->id}/members/{$enrollment->id}", ['category' => null])
            ->assertOk()
            ->assertJsonPath('enrollment.category', null)
            ->assertJsonPath('enrollment.member_category', 'General');
        $this->assertNull($enrollment->fresh()->category);

        $member->update(['category' => null]);
        $this->patchJson("/api/seasons/{$season->id}/members/{$enrollment->id}", ['category' => 'Season'])
            ->assertOk()
            ->assertJsonPath('enrollment.category', 'Season')
            ->assertJsonPath('enrollment.member_category', null);
    }

    public function test_update_requires_ownership_and_the_enrollment_to_belong_to_the_season(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $manager = User::create(['name' => 'Manager', 'email' => 'manager@example.test', 'password' => 'password']);
        $manager->forceFill(['is_manager' => true])->save();
        $memberUser = User::create(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password']);
        $member = Member::create(['id' => $memberUser->id, 'first_name' => 'First', 'last_name' => 'Last', 'category' => 'General']);
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $otherSeason = Season::create(['name' => 'Other', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);
        $enrollment = $otherSeason->memberSeasons()->create(['member_id' => $member->id, 'category' => 'General']);
        $url = "/api/seasons/{$season->id}/members/{$enrollment->id}";

        $this->patchJson($url, ['category' => 'Changed'])->assertUnauthorized();
        $this->actingAs($manager, 'sanctum')->patchJson($url, ['category' => 'Changed'])->assertForbidden();
        $this->actingAs($owner, 'sanctum')->patchJson($url, ['category' => 'Changed'])->assertNotFound();
        $this->assertSame('General', $enrollment->fresh()->category);
    }

    public function test_update_validates_the_category(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $memberUser = User::create(['name' => 'Member', 'email' => 'member@example.test', 'password' => 'password']);
        $member = Member::create(['id' => $memberUser->id, 'first_name' => 'First', 'last_name' => 'Last', 'category' => 'General']);
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);
        $enrollment = $season->memberSeasons()->create(['member_id' => $member->id, 'category' => 'General']);
        $url = "/api/seasons/{$season->id}/members/{$enrollment->id}";
        $this->actingAs($owner, 'sanctum');

        foreach ([[], ['category' => str_repeat('x', 101)], ['category' => ['invalid']]] as $payload) {
            $this->patchJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('category');
        }
        $this->assertSame('General', $enrollment->fresh()->category);
    }
}
