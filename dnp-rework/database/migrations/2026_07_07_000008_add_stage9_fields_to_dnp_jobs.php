<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            // Stage 9: Pengurusan Suket by Admin (Task 17)
            $table->string('s9_progress_status', 50)->nullable()->after('disnaker_sla_status');
            // Values: not_started, delayed, in_progress, almost_done, done
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn('s9_progress_status');
        });
    }
};
