<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class UserManagementFlagsTest extends TestCase
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

    public function test_admin_can_enable_and_disable_each_manager_flag(): void
    {
        $admin = User::findOrFail(1);
        $user = User::create([
            'name' => 'Example User',
            'email' => 'user@example.test',
            'password' => 'password',
        ])->fresh();

        $this->actingAs($admin, 'sanctum');

        foreach (['is_content_manager', 'is_community_manager', 'is_pricing_manager'] as $flag) {
            $this->assertFalse($user->fresh()->{$flag});

            $this->postJson("/api/users/{$user->id}", [$flag => true])
                ->assertOk()
                ->assertJsonPath("user.{$flag}", true);
            $this->assertTrue($user->fresh()->{$flag});

            $this->getJson('/api/users')
                ->assertOk()
                ->assertJsonFragment(['id' => $user->id, $flag => true]);

            $this->postJson("/api/users/{$user->id}", [$flag => false])
                ->assertOk()
                ->assertJsonPath("user.{$flag}", false);
            $this->assertFalse($user->fresh()->{$flag});
        }
    }

    public function test_manager_flags_require_booleans_and_admin_access(): void
    {
        $admin = User::findOrFail(1);
        $user = User::create([
            'name' => 'Example User',
            'email' => 'user@example.test',
            'password' => 'password',
        ]);

        foreach (['is_content_manager', 'is_community_manager', 'is_pricing_manager'] as $flag) {
            $this->actingAs($admin, 'sanctum')
                ->postJson("/api/users/{$user->id}", [$flag => 'invalid'])
                ->assertUnprocessable()
                ->assertJsonValidationErrors($flag);
        }

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/users/{$user->id}", ['is_pricing_manager' => true])
            ->assertForbidden();

        $this->assertFalse($user->fresh()->is_content_manager);
        $this->assertFalse($user->fresh()->is_community_manager);
        $this->assertFalse($user->fresh()->is_pricing_manager);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/users/{$user->id}", ['is_manager' => true])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('is_manager');
    }

    public function test_admin_cannot_remove_their_own_admin_status(): void
    {
        $admin = User::findOrFail(1);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/users/{$admin->id}", ['is_admin' => false])
            ->assertForbidden()
            ->assertJsonPath('code', 'cannot_remove_own_admin');

        $this->assertTrue($admin->fresh()->is_admin);
    }
}
