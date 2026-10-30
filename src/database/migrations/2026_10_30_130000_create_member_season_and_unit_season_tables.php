<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_season', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->restrictOnDelete();
            $table->foreignId('season_id')->constrained()->restrictOnDelete();
            // Snapshot of the member's category at enrollment time
            $table->string('category')->nullable();
            $table->timestamps();

            $table->unique(['member_id', 'season_id']);
        });

        Schema::create('unit_season', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->foreignId('season_id')->constrained()->restrictOnDelete();
            // Snapshot of the unit's category at enrollment time
            $table->string('category')->nullable();
            $table->timestamps();

            $table->unique(['unit_id', 'season_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_season');
        Schema::dropIfExists('member_season');
    }
};
