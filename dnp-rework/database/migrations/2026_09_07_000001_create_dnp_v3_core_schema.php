<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for DNP Monitor v3.
     */
    public function up(): void
    {
        // 1. Alter dnp_jobs to support v3 workflow
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->string('termin_pembayaran', 20)->default('FULL')->after('no_po'); // DP or FULL
            $table->boolean('dp_paid')->default(false)->after('termin_pembayaran');
            $table->decimal('dp_amount', 15, 2)->default(0)->after('dp_paid');
            $table->integer('total_unit_count')->default(1)->after('units');
            $table->json('reschedule_reason_log')->nullable()->after('notes');
            $table->integer('payment_retry_count')->default(0)->after('payment_status');
        });

        // 2. Units table (Alat)
        Schema::create('dnp_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->string('nama_alat');
            $table->string('no_seri')->nullable();
            $table->string('kategori')->default('Umum'); // Pesawat Angkat & Angkut, Listrik, Kebakaran, etc.
            $table->string('ru_result', 30)->default('Pending'); // Pending, Sesuai, Tidak Sesuai
            $table->string('current_stage', 20)->default('4'); // 4, 4b, 4c, 4d, 5, 6, 7, 8, 9, 11b, 11c, 12
            $table->string('unit_status', 30)->default('InProgress'); // InProgress, ReworkLoop, Closed
            $table->uuid('final_lhpp_id')->nullable();
            $table->uuid('batch_id')->nullable();
            $table->timestamp('rework_started_at')->nullable(); // For escalation reminder calculations
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['job_id', 'current_stage']);
            $table->index(['job_id', 'unit_status']);
        });

        // 3. Inspection Events table (Sesi Riksa Uji)
        Schema::create('inspection_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->string('type', 50)->default('Initial RU (Stage 4)'); // Initial RU (Stage 4), Riksa Uji Ulang (Stage 4d)
            $table->date('tanggal_pelaksanaan');
            $table->string('petugas_ahli_id')->nullable();
            $table->timestamps();
        });

        // 4. Inspection Units join table
        Schema::create('inspection_units', function (Blueprint $table) {
            $table->foreignUuid('inspection_id')->constrained('inspection_events')->onDelete('cascade');
            $table->foreignUuid('unit_id')->constrained('dnp_units')->onDelete('cascade');
            $table->string('hasil_unit', 30)->default('Sesuai'); // Sesuai, Tidak Sesuai
            $table->text('catatan_temuan')->nullable();
            $table->primary(['inspection_id', 'unit_id']);
        });

        // 5. BAP table (Berita Acara Pemeriksaan — 1:1 per session)
        Schema::create('dnp_baps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inspection_id')->constrained('inspection_events')->onDelete('cascade');
            $table->string('no_bap')->nullable();
            $table->string('file_url')->nullable();
            $table->string('ditandatangani_oleh')->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->timestamps();
        });

        // 6. LHPP table (per Unit, versioned)
        Schema::create('dnp_lhpps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('unit_id')->constrained('dnp_units')->onDelete('cascade');
            $table->foreignUuid('source_inspection_id')->nullable()->constrained('inspection_events')->onDelete('set null');
            $table->integer('version_number')->default(1);
            $table->boolean('is_final')->default(true);
            $table->string('status', 50)->default('Draft'); // Draft, Pengerjaan, Selesai, Review Manager, Approved, Rejected-Revisi
            $table->date('tanggal_data_teknis_diserahkan')->nullable();
            $table->date('tanggal_mulai_pengerjaan')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->integer('queue_days')->default(0);
            $table->integer('drafting_days')->default(0);
            $table->string('reviewer_manager_id')->nullable();
            $table->string('decision', 30)->nullable(); // Approve, Reject-to-Revise
            $table->text('decision_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['unit_id', 'is_final']);
            $table->index(['status']);
        });

        // 7. Batches table (Pengajuan Dinas & Pengiriman SUKET)
        Schema::create('dnp_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->integer('batch_sequence')->default(1);
            $table->string('current_stage', 20)->default('7'); // 7, 8, 9, 11, 11c, 11b, Closed
            $table->string('status_tag', 30)->default('On Track'); // On Track, Delayed, Issue
            $table->text('status_tag_notes')->nullable();
            $table->date('tanggal_verifikasi_dinas')->nullable();
            $table->date('tanggal_input_suket')->nullable();
            $table->date('tanggal_terbit_suket')->nullable();
            $table->integer('durasi_proses_suket')->default(0);
            $table->date('tanggal_kirim')->nullable();
            $table->string('status_kirim', 30)->default('Menunggu'); // Menunggu, Siap Kirim, Terkirim
            $table->string('no_resi')->nullable();
            $table->timestamps();

            $table->index(['job_id', 'current_stage']);
        });

        // 8. Batch Units join table
        Schema::create('batch_units', function (Blueprint $table) {
            $table->foreignUuid('batch_id')->constrained('dnp_batches')->onDelete('cascade');
            $table->foreignUuid('unit_id')->constrained('dnp_units')->onDelete('cascade');
            $table->primary(['batch_id', 'unit_id']);
        });

        // 9. Payment Verifications table (Stage 11c)
        Schema::create('payment_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->string('verified_by')->nullable(); // Finance user
            $table->timestamp('verified_at')->nullable();
            $table->string('bukti_url')->nullable();
            $table->string('status', 30)->default('Pending'); // Pending, Verified, Partial
            $table->integer('retry_count')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['job_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_verifications');
        Schema::dropIfExists('batch_units');
        Schema::dropIfExists('dnp_batches');
        Schema::dropIfExists('dnp_lhpps');
        Schema::dropIfExists('dnp_baps');
        Schema::dropIfExists('inspection_units');
        Schema::dropIfExists('inspection_events');
        Schema::dropIfExists('dnp_units');

        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn([
                'termin_pembayaran',
                'dp_paid',
                'dp_amount',
                'total_unit_count',
                'reschedule_reason_log',
                'payment_retry_count',
            ]);
        });
    }
};
