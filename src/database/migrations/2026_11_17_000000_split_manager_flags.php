<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_content_manager')->default(false);
            $table->boolean('is_community_manager')->default(false);
            $table->boolean('is_pricing_manager')->default(false);
        });

        DB::table('users')
            ->where('is_manager', true)
            ->update([
                'is_content_manager' => true,
                'is_community_manager' => true,
                'is_pricing_manager' => true,
            ]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_manager');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_manager')->default(false);
        });

        DB::table('users')
            ->where('is_content_manager', true)
            ->orWhere('is_community_manager', true)
            ->orWhere('is_pricing_manager', true)
            ->update(['is_manager' => true]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_content_manager',
                'is_community_manager',
                'is_pricing_manager',
            ]);
        });
    }
};
