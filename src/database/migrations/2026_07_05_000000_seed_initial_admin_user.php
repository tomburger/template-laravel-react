<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::table('users')->exists()) {
            return;
        }

        $now = now();

        DB::table('users')->insert([
            'name' => 'Admin',
            'email' => 'admin@prazelenina.burger.software',
            'email_verified_at' => $now,
            'is_admin' => true,
            'is_deactivated' => false,
            'password' => Hash::make('LetsStart2026'),
            'remember_token' => null,
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')
            ->where('email', 'admin@prazelenina.burger.software')
            ->delete();
    }
};