<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

class ProfileTest extends TestCase
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

    public function test_user_can_update_their_name_and_create_and_edit_their_member_details(): void
    {
        $user = User::create(['name' => 'Original', 'email' => 'profile@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/user/profile')->assertOk()->assertJsonPath('member', null);
        $this->putJson('/api/user/profile', ['name' => 'New name'])
            ->assertOk()->assertJsonPath('name', 'New name')->assertJsonPath('member', null);
        $this->assertNull($user->member()->first());

        $this->putJson('/api/user/profile', [
            'name' => 'New name',
            'member' => ['first_name' => 'First', 'last_name' => 'Last', 'phone_number' => '123'],
        ])->assertOk()->assertJsonPath('member.first_name', 'First');
        $user->member()->update(['category' => 'managed']);

        $this->putJson('/api/user/profile', [
            'name' => 'Updated name',
            'member' => ['first_name' => 'Updated', 'last_name' => 'Last', 'phone_number' => null],
        ])->assertOk()->assertJsonPath('member.first_name', 'Updated')->assertJsonPath('member.category', 'managed');

        $this->assertSame('Updated name', $user->fresh()->name);
        $this->assertSame('Other', $other->fresh()->name);
        $this->assertNull($other->member()->first());
    }

    public function test_user_cannot_set_member_category_or_choose_another_member(): void
    {
        $user = User::create(['name' => 'Original', 'email' => 'profile@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $this->actingAs($user, 'sanctum');

        foreach (['category' => 'discount', 'id' => $other->id] as $field => $value) {
            $this->putJson('/api/user/profile', [
                'name' => 'Changed',
                'member' => ['first_name' => 'First', 'last_name' => 'Last', $field => $value],
            ])->assertUnprocessable();
        }

        $this->assertSame('Original', $user->fresh()->name);
        $this->assertNull($user->member()->first());
        $this->assertNull($other->member()->first());
    }

    public function test_profile_requires_authentication_and_complete_member_details(): void
    {
        $this->getJson('/api/user/profile')->assertUnauthorized();
        $this->putJson('/api/user/profile', ['name' => 'New'])->assertUnauthorized();

        $user = User::create(['name' => 'Original', 'email' => 'profile@example.test', 'password' => 'password']);
        $this->actingAs($user, 'sanctum')
            ->putJson('/api/user/profile', ['name' => 'Changed', 'member' => []])
            ->assertUnprocessable();
        $this->assertSame('Original', $user->fresh()->name);

        $user->forceFill(['is_deactivated' => true])->save();
        $this->getJson('/api/user/profile')->assertForbidden();
        $this->putJson('/api/user/profile', ['name' => 'Changed'])->assertForbidden();
        $this->assertSame('Original', $user->fresh()->name);
    }
}
