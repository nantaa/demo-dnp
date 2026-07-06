<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // 1. Delete non-numeric or invalid inspector_id records to avoid cast errors
            DB::statement("DELETE FROM job_inspectors WHERE inspector_id IS NULL OR inspector_id !~ '^[0-9]+$'");
            
            // 2. Delete orphaned records that do not exist in users table
            DB::statement("DELETE FROM job_inspectors WHERE CAST(inspector_id AS bigint) NOT IN (SELECT id FROM users)");

            // 3. Alter table column type to bigint with explicit cast
            DB::statement("ALTER TABLE job_inspectors ALTER COLUMN inspector_id TYPE bigint USING inspector_id::bigint");

            // 4. Add foreign key constraint
            Schema::table('job_inspectors', function (Blueprint $table) {
                $table->foreign('inspector_id')->references('id')->on('users')->onDelete('cascade');
            });
        } else {
            // Fallback for non-pgsql (e.g. SQLite, MySQL)
            Schema::dropIfExists('job_inspectors');
            Schema::create('job_inspectors', function (Blueprint $table) {
                $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
                $table->foreignId('inspector_id')->constrained('users')->onDelete('cascade');
                $table->primary(['job_id', 'inspector_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_inspectors');

        Schema::create('job_inspectors', function (Blueprint $table) {
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->string('inspector_id', 50); // The old string format
            
            $table->primary(['job_id', 'inspector_id']);
        });
    }
};
