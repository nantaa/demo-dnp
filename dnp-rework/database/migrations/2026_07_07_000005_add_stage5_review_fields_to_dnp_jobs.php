<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            // Stage 5: Review Laporan Teknis by MGR (Task 14)
            $table->string('s5_review_decision', 50)->nullable()->after('peer_review_approved_by');
            // Values: approved, approved_conditional, rejected
            $table->text('s5_review_notes')->nullable()->after('s5_review_decision');
            $table->string('s5_reviewed_by')->nullable()->after('s5_review_notes');
            $table->timestamp('s5_reviewed_at')->nullable()->after('s5_reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn(['s5_review_decision', 's5_review_notes', 's5_reviewed_by', 's5_reviewed_at']);
        });
    }
};
