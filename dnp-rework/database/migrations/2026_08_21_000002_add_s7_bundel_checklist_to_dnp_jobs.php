<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 7: Add s7_bundel_checklist JSON column for bundel fisik checklist.
     * Grup A (8 items from client), Grup B (6 items from PJK3), Grup C (4 physical items).
     * Each item: { status: 'checked'|'unchecked'|'na', catatan: string|null }
     */
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->json('s7_bundel_checklist')->nullable()->after('tgl_submit_disnaker');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn('s7_bundel_checklist');
        });
    }
};
