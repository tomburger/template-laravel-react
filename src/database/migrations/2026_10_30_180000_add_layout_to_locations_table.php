<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            // SVG drawn over the background image; elements with id "unit-<unitId>" represent units
            $table->longText('layout_svg')->nullable();
            // Path of the background image on the public disk
            $table->string('layout_image_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['layout_svg', 'layout_image_path']);
        });
    }
};
