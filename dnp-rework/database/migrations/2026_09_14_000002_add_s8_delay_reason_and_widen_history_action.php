<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add s8_delay_reason to dnp_jobs and widen job_history.action to text.
     */
    public function up(): void
    {
        if (Schema::hasTable('dnp_jobs') && !Schema::hasColumn('dnp_jobs', 's8_delay_reason')) {
            Schema::table('dnp_jobs', function (Blueprint $table) {
                $table->text('s8_delay_reason')->nullable();
            });
        }

        if (Schema::hasTable('job_history')) {
            Schema::table('job_history', function (Blueprint $table) {
                $table->text('action')->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('dnp_jobs') && Schema::hasColumn('dnp_jobs', 's8_delay_reason')) {
            Schema::table('dnp_jobs', function (Blueprint $table) {
                $table->dropColumn('s8_delay_reason');
            });
        }
    }
};
