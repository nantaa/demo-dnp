<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inspector_profiles', function (Blueprint $table) {
            $table->string('subrole', 50)->nullable()->after('senior_level');
            // Values: tenaga_ahli, teknisi
        });
    }

    public function down(): void
    {
        Schema::table('inspector_profiles', function (Blueprint $table) {
            $table->dropColumn('subrole');
        });
    }
};
