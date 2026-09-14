<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add Faktur Pajak fields to dnp_jobs (Stage 10 - Finance billing).
     * Audit trail is handled via the existing job_history_logs table.
     * Documents stored as type Faktur Pajak in dnp_documents (no overwrite).
     */
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->string('no_faktur_pajak')->nullable()->after('invoice_no');
            $table->date('tgl_faktur_pajak')->nullable()->after('no_faktur_pajak');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn(['no_faktur_pajak', 'tgl_faktur_pajak']);
        });
    }
};