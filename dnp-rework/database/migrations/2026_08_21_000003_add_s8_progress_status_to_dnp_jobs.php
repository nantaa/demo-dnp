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
        Schema::table('dnp_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('dnp_jobs', 's8_progress_status')) {
                $table->string('s8_progress_status', 50)->nullable()->after('disnaker_sla_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            if (Schema::hasColumn('dnp_jobs', 's8_progress_status')) {
                $table->dropColumn('s8_progress_status');
            }
        });
    }
};
