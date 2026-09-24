<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seed Stage 16 (Selesai) permissions exclusively for Superadmin.
     * Stage 16 is the hidden archival vault state after Final Financial Closing (Stage 12).
     * Stage 16 is a Superadmin special privilege: only Superadmin can view and restore jobs in this stage.
     */
    public function up(): void
    {
        // Superadmin users: exclusive owner of Stage 16 (they can view archive and restore)
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
