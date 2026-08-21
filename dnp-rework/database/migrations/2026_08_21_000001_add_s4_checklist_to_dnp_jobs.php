<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 4: Add s4_checklist JSON column for lapangan checklist items.
     * 8 items: nameplate, visual, dimensi, kelistrikan, pengaman, fungsi, apd, bap
     * Each item: { status: 'checked'|'unchecked', catatan: string|null }
     */
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->json('s4_checklist')->nullable()->after('unit_count_notes');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn('s4_checklist');
        });
    }
};
