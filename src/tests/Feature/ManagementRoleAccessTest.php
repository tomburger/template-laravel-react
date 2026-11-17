<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class ManagementRoleAccessTest extends TestCase
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

    public function test_content_manager_can_manage_content_but_not_community_or_pricing(): void
    {
        $contentManager = User::create(['name' => 'Content', 'email' => 'content@example.test', 'password' => 'password']);
        $contentManager->forceFill(['is_content_manager' => true])->save();
        $this->actingAs($contentManager, 'sanctum');

        $this->postJson('/api/locations', [
            'name' => 'Location',
            'owner_ids' => [$contentManager->id],
        ])->assertCreated();

        $this->postJson('/api/seasons', [
            'name' => 'Season',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'owner_ids' => [$contentManager->id],
        ])->assertCreated();

        $this->getJson('/api/users')->assertOk();
        $this->getJson('/api/members')->assertForbidden();
        $this->getJson('/api/pricing-rules')->assertForbidden();
    }

    public function test_community_manager_can_manage_members_but_not_content_or_pricing(): void
    {
        $communityManager = User::create(['name' => 'Community', 'email' => 'community@example.test', 'password' => 'password']);
        $communityManager->forceFill(['is_community_manager' => true])->save();
        $candidate = User::create(['name' => 'Candidate', 'email' => 'candidate@example.test', 'password' => 'password']);
        $this->actingAs($communityManager, 'sanctum');

        $this->getJson('/api/members/candidates')->assertOk();
        $this->postJson('/api/members', [
            'user_id' => $candidate->id,
            'first_name' => 'Community',
            'last_name' => 'Member',
        ])->assertCreated();

        $this->postJson('/api/locations', ['name' => 'Location', 'owner_ids' => [$communityManager->id]])
            ->assertForbidden();
        $this->getJson('/api/pricing-rules')->assertForbidden();
    }

    public function test_pricing_manager_can_manage_pricing_and_read_seasons_only(): void
    {
        $pricingManager = User::create(['name' => 'Pricing', 'email' => 'pricing@example.test', 'password' => 'password']);
        $pricingManager->forceFill(['is_pricing_manager' => true])->save();
        $this->actingAs($pricingManager, 'sanctum');

        $this->getJson('/api/seasons')->assertOk();
        $this->postJson('/api/pricing-rules', ['priority' => 0, 'price' => 100])->assertCreated();

        $this->getJson('/api/users')->assertForbidden();
        $this->getJson('/api/members')->assertForbidden();
        $this->postJson('/api/locations', ['name' => 'Location', 'owner_ids' => [$pricingManager->id]])
            ->assertForbidden();
    }
}
