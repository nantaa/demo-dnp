<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            // Stage 10: Finance billing (Task 18)
            $table->decimal('total_invoice_amount', 15, 2)->nullable()->after('s9_progress_status');
            $table->date('tgl_invoice_issued')->nullable()->after('total_invoice_amount');
            $table->string('s10_progress_status', 50)->nullable()->after('tgl_invoice_issued');
            // Values: not_started, delayed, in_progress, almost_done, done
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn(['total_invoice_amount', 'tgl_invoice_issued', 's10_progress_status']);
        });
    }
};
