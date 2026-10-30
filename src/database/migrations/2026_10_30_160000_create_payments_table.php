<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            // Bank transaction id (or generated id for manual entries); guards against duplicate imports
            $table->string('external_id')->unique();
            $table->decimal('amount', 12, 2);
            $table->date('paid_at');
            $table->string('variable_symbol', 10)->nullable();
            $table->string('counterparty_account')->nullable();
            $table->string('counterparty_name')->nullable();
            $table->string('message')->nullable();
            // manual | bank
            $table->string('source')->default('manual');
            $table->timestamps();

            $table->index('variable_symbol');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
