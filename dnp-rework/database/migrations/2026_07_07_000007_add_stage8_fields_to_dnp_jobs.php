<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            // Stage 8: Proses Disnaker by Admin (Task 16)
            $table->date('tgl_doc_submitted_disnaker')->nullable()->after('tgl_submit_disnaker');
            $table->date('tgl_doc_received_disnaker')->nullable()->after('tgl_doc_submitted_disnaker');
            $table->string('disnaker_sla_status', 20)->nullable()->after('tgl_doc_received_disnaker');
            // Values: on_track, last_day, overdue
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn(['tgl_doc_submitted_disnaker', 'tgl_doc_received_disnaker', 'disnaker_sla_status']);
        });
    }
};
