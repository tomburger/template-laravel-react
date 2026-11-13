<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class UserManagerFlagTest extends TestCase
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

    public function test_admin_can_enable_and_disable_manager_flag(): void
    {
        $admin = User::findOrFail(1);
        $user = User::create([
            'name' => 'Example User',
            'email' => 'user@example.test',
            'password' => 'password',
        ])->fresh();

        $this->assertFalse($user->is_manager);
        $user->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin, 'sanctum');

        foreach ([true, false] as $manager) {
            $this->postJson("/api/users/{$user->id}", ['is_manager' => $manager])
                ->assertOk()
                ->assertJsonPath('user.is_manager', $manager)
                ->assertJsonPath('user.is_admin', true);

            $this->assertSame($manager, $user->fresh()->is_manager);
            $this->getJson('/api/users')
                ->assertOk()
                ->assertJsonFragment(['id' => $user->id, 'is_manager' => $manager]);
        }
    }

    public function test_manager_flag_requires_a_boolean_and_admin_access(): void
    {
        $admin = User::findOrFail(1);
        $user = User::create([
            'name' => 'Example User',
            'email' => 'user@example.test',
            'password' => 'password',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/users/{$user->id}", ['is_manager' => 'invalid'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('is_manager');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/users/{$user->id}", ['is_manager' => true])
            ->assertForbidden();

        $this->assertFalse($user->fresh()->is_manager);
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
