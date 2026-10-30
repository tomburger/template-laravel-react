<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_season_id')->constrained('member_season')->restrictOnDelete();
            $table->foreignId('unit_season_id')->constrained('unit_season')->restrictOnDelete();
            $table->string('status')->default('pending');
            // Price snapshot taken from the pricing rules at creation time
            $table->decimal('amount_due', 12, 2);
            // Used by the bank to match incoming payments
            $table->string('variable_symbol', 10)->unique();
            $table->timestamps();

            $table->index('member_season_id');
            $table->index('unit_season_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocations');
    }
};
