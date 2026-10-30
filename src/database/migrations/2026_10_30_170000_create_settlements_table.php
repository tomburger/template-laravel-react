<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->restrictOnDelete();
            $table->foreignId('allocation_id')->constrained('allocations')->restrictOnDelete();
            // Part of the payment applied to the allocation (supports partial and multiple matching)
            $table->decimal('amount', 12, 2);
            $table->timestamps();

            $table->unique(['payment_id', 'allocation_id']);
            $table->index('allocation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settlements');
    }
};
