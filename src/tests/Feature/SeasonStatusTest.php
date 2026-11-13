<?php

namespace Tests\Feature;

use App\Models\Season;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class SeasonStatusTest extends TestCase
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

    public function test_only_owners_can_change_status_without_changing_other_fields(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $manager = User::create(['name' => 'Manager', 'email' => 'manager@example.test', 'password' => 'password']);
        $manager->forceFill(['is_manager' => true])->save();
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/seasons/{$season->id}/status", [
                'status' => 'open',
                'name' => 'Ignored',
                'owner_ids' => [$manager->id],
            ])
            ->assertOk()->assertJsonPath('season.status', 'open');

        $this->actingAs($manager, 'sanctum')
            ->patchJson("/api/seasons/{$season->id}/status", ['status' => 'closed'])
            ->assertForbidden();

        $season->owners()->attach($manager);
        $this->actingAs($manager, 'sanctum')
            ->patchJson("/api/seasons/{$season->id}/status", ['status' => 'closed'])
            ->assertOk()->assertJsonPath('season.status', 'closed');

        $this->assertSame('Season', $season->fresh()->name);
        $this->assertSame('2026-01-01', $season->fresh()->start_date->format('Y-m-d'));
        $this->assertSame('2026-12-31', $season->fresh()->end_date->format('Y-m-d'));
        $this->assertEqualsCanonicalizing([$owner->id, $manager->id], $season->owners()->pluck('users.id')->all());
    }

    public function test_status_requires_a_valid_value_and_edit_permission(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $season = Season::create(['name' => 'Season', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $season->owners()->attach($owner);

        $this->patchJson("/api/seasons/{$season->id}/status", ['status' => 'open'])->assertUnauthorized();
        $this->actingAs($other, 'sanctum')
            ->patchJson("/api/seasons/{$season->id}/status", ['status' => 'open'])->assertForbidden();
        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/seasons/{$season->id}/status", ['status' => 'invalid'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->assertSame('preparation', $season->fresh()->status);
    }
}
