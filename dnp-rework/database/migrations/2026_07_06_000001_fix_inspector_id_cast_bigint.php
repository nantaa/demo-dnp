<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only needed on PostgreSQL — check the column type first
        $driver = DB::getDriverName();

        if ($driver !== 'pgsql') {
            return;
        }

        // Check current type of inspector_id
        $col = DB::select("
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'job_inspectors'
              AND column_name = 'inspector_id'
            LIMIT 1
        ");

        if (empty($col) || $col[0]->data_type === 'bigint') {
            // Already correct type or table doesn't exist — nothing to do
            return;
        }

        // Drop existing foreign key constraints if any
        try {
            DB::statement("ALTER TABLE job_inspectors DROP CONSTRAINT IF EXISTS job_inspectors_inspector_id_foreign");
        } catch (\Exception $e) {
            // Ignore if constraint doesn't exist
        }

        // Clean up rows with non-numeric inspector_id
        DB::statement("DELETE FROM job_inspectors WHERE inspector_id !~ '^[0-9]+$'");

        // Clean up orphan rows whose inspector_id doesn't match any user
        DB::statement("DELETE FROM job_inspectors WHERE inspector_id::bigint NOT IN (SELECT id FROM users)");

        // Cast column to bigint
        DB::statement("ALTER TABLE job_inspectors ALTER COLUMN inspector_id TYPE bigint USING inspector_id::bigint");

        // Re-add foreign key
        DB::statement("ALTER TABLE job_inspectors ADD CONSTRAINT job_inspectors_inspector_id_foreign FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE");
    }

    public function down(): void
    {
        // No safe rollback — don't reverse
    }
};
