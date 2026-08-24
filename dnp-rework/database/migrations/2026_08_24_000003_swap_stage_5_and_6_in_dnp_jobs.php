<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Swap stage values in dnp_jobs table: 5 -> 999 -> 6 -> 5
        DB::table('dnp_jobs')->where('stage', 5)->update(['stage' => 999]);
        DB::table('dnp_jobs')->where('stage', 6)->update(['stage' => 5]);
        DB::table('dnp_jobs')->where('stage', 999)->update(['stage' => 6]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert swap
        DB::table('dnp_jobs')->where('stage', 5)->update(['stage' => 999]);
        DB::table('dnp_jobs')->where('stage', 6)->update(['stage' => 5]);
        DB::table('dnp_jobs')->where('stage', 999)->update(['stage' => 6]);
    }
};
