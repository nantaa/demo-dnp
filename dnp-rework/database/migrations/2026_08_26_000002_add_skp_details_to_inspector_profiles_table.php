<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('inspector_profiles')) {
            Schema::table('inspector_profiles', function (Blueprint $table) {
                if (!Schema::hasColumn('inspector_profiles', 'skp_details')) {
                    $table->json('skp_details')->nullable()->after('spesialisasi');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('inspector_profiles')) {
            Schema::table('inspector_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('inspector_profiles', 'skp_details')) {
                    $table->dropColumn('skp_details');
                }
            });
        }
    }
};
