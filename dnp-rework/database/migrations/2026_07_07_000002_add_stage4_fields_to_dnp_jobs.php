<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->integer('actual_units')->nullable()->after('units');
            $table->text('unit_count_notes')->nullable()->after('actual_units');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn(['actual_units', 'unit_count_notes']);
        });
    }
};
