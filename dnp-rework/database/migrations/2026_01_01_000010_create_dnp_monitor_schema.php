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
        // 1. Alter existing users table to add RBAC role
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 50)->default('admin')->after('password');
            // roles: superadmin, marketing, admin, inspektur, manager, finance
        });

        // 2. User Stage Permissions (For Superadmin to assign Admins)
        Schema::create('user_stage_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedSmallInteger('stage'); // 1 to 12
            $table->boolean('is_owner')->default(false);
            $table->boolean('can_view')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'stage']);
        });

        // 3. Jobs Table
        Schema::create('dnp_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 50)->unique(); // e.g. DNP/YYYY/XXXX
            $table->string('klien')->index();
            $table->string('lokasi');
            $table->string('owner_marketing')->index();
            $table->string('pic_klien');
            $table->string('pic_klien_phone');
            $table->string('pesawat', 50)->index();
            $table->integer('units')->default(1);
            $table->decimal('nilai', 15, 2)->default(0);
            
            $table->string('no_po')->nullable();
            $table->date('tgl_po')->nullable();
            
            $table->unsignedSmallInteger('stage')->default(1)->index(); // 1 to 12 (Closed)
            $table->timestamp('stage_started_at')->useCurrent()->index();
            $table->date('tgl_pelaksanaan')->nullable()->index();
            
            $table->string('no_surat_tugas')->nullable();
            $table->date('tgl_surat_tugas')->nullable();
            $table->string('disnaker_tujuan')->nullable()->index();
            
            $table->date('tgl_h5')->nullable();
            $table->boolean('h5_confirmed')->default(false);
            $table->string('h5_method', 50)->nullable();
            $table->timestamp('h5_confirmed_at')->nullable();
            $table->string('h5_confirmed_by')->nullable();
            
            $table->string('peer_review_status', 50)->nullable(); // submitted, approved, rejected
            $table->timestamp('peer_review_submitted_at')->nullable();
            $table->string('peer_review_submitted_by')->nullable();
            $table->timestamp('peer_review_approved_at')->nullable();
            $table->string('peer_review_approved_by')->nullable();
            
            $table->date('disnaker_deadline_at')->nullable()->index(); // EWS Deadline tracking
            
            $table->string('laik_status', 50)->nullable()->index(); // laik, laik_bersyarat, tidak_laik
            
            $table->boolean('paid')->default(false)->index();
            $table->string('invoice_no')->nullable()->index();
            $table->date('invoice_date')->nullable();
            $table->integer('top_days')->default(30);
            $table->date('payment_due_date')->nullable();
            $table->string('payment_status', 50)->default('pending'); // pending, sent, paid
            $table->timestamp('payment_paid_at')->nullable();
            $table->decimal('payment_amount_received', 15, 2)->default(0);
            $table->boolean('tanda_terima_kembali')->default(false);
            
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 4. Job Inspectors (Pivot)
        Schema::create('job_inspectors', function (Blueprint $table) {
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->string('inspector_id', 50); // e.g. I001 (references internal inspector ID system)
            $table->primary(['job_id', 'inspector_id']);
        });

        // 5. Job Documents
        Schema::create('job_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->unsignedSmallInteger('stage');
            $table->string('type', 100);
            $table->string('name');
            $table->string('path', 512);
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 6. Job History (Audit Log)
        Schema::create('job_history', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->unsignedSmallInteger('stage');
            $table->string('action');
            $table->foreignId('action_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 7. Job Evaluations (Unit specific)
        Schema::create('job_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->integer('unit_no');
            $table->string('unit_label');
            $table->string('status', 50); // laik, laik_bersyarat, tidak_laik
            $table->text('findings')->nullable();
            $table->text('recommendation')->nullable();
            $table->timestamps();
        });

        // 8. Units Tracking (Suket lifecycle)
        Schema::create('units_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->integer('unit_no');
            $table->string('unit_label');
            $table->string('laik_status', 50);
            $table->string('status', 50); // submitted, issued, rejected, progress
            $table->date('tgl_submit')->nullable();
            $table->string('no_registrasi')->nullable();
            $table->string('no_suket')->nullable()->index();
            $table->date('tgl_suket')->nullable();
            $table->date('suket_expired_at')->nullable()->index();
            $table->integer('suket_validity_months')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 9. Disnaker Followups
        Schema::create('disnaker_followups', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->foreignId('action_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 50);
            $table->text('notes');
            $table->timestamps();
        });

        // 10. App States (Key Value metadata)
        Schema::create('app_states', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->jsonb('value');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_states');
        Schema::dropIfExists('disnaker_followups');
        Schema::dropIfExists('units_tracking');
        Schema::dropIfExists('job_evaluations');
        Schema::dropIfExists('job_history');
        Schema::dropIfExists('job_documents');
        Schema::dropIfExists('job_inspectors');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('user_stage_permissions');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
