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
            if (!Schema::hasColumn('dnp_jobs', 'report_writer_id')) {
                $table->foreignId('report_writer_id')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('dnp_jobs', 's14_payment_status')) {
                $table->string('s14_payment_status')->nullable()->default('pending');
            }
            if (!Schema::hasColumn('dnp_jobs', 's14_payment_notes')) {
                $table->text('s14_payment_notes')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            if (Schema::hasColumn('dnp_jobs', 'report_writer_id')) {
                $table->dropForeign(['report_writer_id']);
                $table->dropColumn('report_writer_id');
            }
            if (Schema::hasColumn('dnp_jobs', 's14_payment_status')) {
                $table->dropColumn('s14_payment_status');
            }
            if (Schema::hasColumn('dnp_jobs', 's14_payment_notes')) {
                $table->dropColumn('s14_payment_notes');
            }
        });
    }
};
