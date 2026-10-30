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
                if (!Schema::hasColumn('inspector_profiles', 'recommendation_rank')) {
                    $table->unsignedTinyInteger('recommendation_rank')->nullable()->after('subrole')->index();
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
                if (Schema::hasColumn('inspector_profiles', 'recommendation_rank')) {
                    $table->dropColumn('recommendation_rank');
                }
            });
        }
    }
};
