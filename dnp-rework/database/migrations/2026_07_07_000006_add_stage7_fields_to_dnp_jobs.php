<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            // Stage 7: Penyerahan ke Dinas by MGR (Task 15)
            $table->date('tgl_submit_disnaker')->nullable()->after('disnaker_deadline_at');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn('tgl_submit_disnaker');
        });
    }
};
