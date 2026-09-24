<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seed Stage 16 (Selesai) permissions for Finance and Superadmin.
     * Stage 16 is the hidden archival state after Final Financial Closing (Stage 12).
     * Only Finance users can archive a job to Stage 16.
     * Only Superadmin can restore a Stage 16 job back to active stages.
     */
    public function up(): void
    {
        // Finance users: owner of Stage 16 (they perform the archive action)
        $financeUsers = DB::table('users')->where('role', 'finance')->get();
        foreach ($financeUsers as $user) {
            DB::table('user_stage_permissions')->updateOrInsert(
                ['user_id' => $user->id, 'stage' => 16],
                ['is_owner' => true, 'can_view' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // Superadmin users: owner of Stage 16 (they can restore)
        $superadminUsers = DB::table('users')->where('role', 'superadmin')->get();
        foreach ($superadminUsers as $user) {
            DB::table('user_stage_permissions')->updateOrInsert(
                ['user_id' => $user->id, 'stage' => 16],
                ['is_owner' => true, 'can_view' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Remove Stage 16 permissions.
     */
    public function down(): void
    {
        DB::table('user_stage_permissions')->where('stage', 16)->delete();
    }
};
