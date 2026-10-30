<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Widen pesawat column in dnp_jobs from varchar(50) to text.
     * Prevents SQLSTATE[22001]: String data, right truncated when marketing selects multiple pesawat types.
     */
    public function up(): void
    {
        if (Schema::hasTable('dnp_jobs')) {
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE dnp_jobs ALTER COLUMN pesawat TYPE text');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE dnp_jobs MODIFY pesawat TEXT');
            } else {
                Schema::table('dnp_jobs', function (Blueprint $table) {
                    $table->text('pesawat')->change();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('dnp_jobs')) {
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE dnp_jobs ALTER COLUMN pesawat TYPE varchar(50)');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE dnp_jobs MODIFY pesawat VARCHAR(50)');
            } else {
                Schema::table('dnp_jobs', function (Blueprint $table) {
                    $table->string('pesawat', 50)->change();
                });
            }
        }
    }
};
