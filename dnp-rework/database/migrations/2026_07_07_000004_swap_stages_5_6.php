<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Swap stages 5 and 6 in all relevant tables.
     * Uses temp value 99 to avoid unique constraint conflicts during swap.
     */
    public function up(): void
    {
        // Swap in dnp_jobs
        DB::table('dnp_jobs')->where('stage', 5)->update(['stage' => 99]);
        DB::table('dnp_jobs')->where('stage', 6)->update(['stage' => 5]);
        DB::table('dnp_jobs')->where('stage', 99)->update(['stage' => 6]);

        // Swap in job_documents
        DB::table('job_documents')->where('stage', 5)->update(['stage' => 99]);
        DB::table('job_documents')->where('stage', 6)->update(['stage' => 5]);
        DB::table('job_documents')->where('stage', 99)->update(['stage' => 6]);

        // Swap in job_history
        DB::table('job_history')->where('stage', 5)->update(['stage' => 99]);
        DB::table('job_history')->where('stage', 6)->update(['stage' => 5]);
        DB::table('job_history')->where('stage', 99)->update(['stage' => 6]);
    }

    public function down(): void
    {
        // Reverse: swap them back
        DB::table('dnp_jobs')->where('stage', 5)->update(['stage' => 99]);
        DB::table('dnp_jobs')->where('stage', 6)->update(['stage' => 5]);
        DB::table('dnp_jobs')->where('stage', 99)->update(['stage' => 6]);

        DB::table('job_documents')->where('stage', 5)->update(['stage' => 99]);
        DB::table('job_documents')->where('stage', 6)->update(['stage' => 5]);
        DB::table('job_documents')->where('stage', 99)->update(['stage' => 6]);

        DB::table('job_history')->where('stage', 5)->update(['stage' => 99]);
        DB::table('job_history')->where('stage', 6)->update(['stage' => 5]);
        DB::table('job_history')->where('stage', 99)->update(['stage' => 6]);
    }
};
