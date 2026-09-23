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
        // 1. Ensure any missing columns on dnp_jobs exist for Stage 11b and 11c
        Schema::table('dnp_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('dnp_jobs', 'no_resi')) {
                $table->string('no_resi')->nullable()->after('stage');
            }
            if (!Schema::hasColumn('dnp_jobs', 'tgl_submit_mkt')) {
                $table->date('tgl_submit_mkt')->nullable();
            }
            if (!Schema::hasColumn('dnp_jobs', 's14_payment_status')) {
                $table->string('s14_payment_status')->nullable()->default('pending');
            }
            if (!Schema::hasColumn('dnp_jobs', 's14_payment_notes')) {
                $table->text('s14_payment_notes')->nullable();
            }
        });

        // 2. Seed / update stage permissions in user_stage_permissions
        // A. Stage 15 (Kirim SUKET ke Klien - 11c) & 13 for Marketing users
        $marketingUsers = DB::table('users')->where('role', 'marketing')->get();
        foreach ($marketingUsers as $user) {
            foreach ([1, 11, 13, 15] as $stage) {
                DB::table('user_stage_permissions')->updateOrInsert(
                    ['user_id' => $user->id, 'stage' => $stage],
                    ['is_owner' => true, 'can_view' => true, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        // B. Users who already have ownership of Stage 1 or 11 get Stage 15
        $mktStageUserIds = DB::table('user_stage_permissions')
            ->whereIn('stage', [1, 11])
            ->where('is_owner', true)
            ->pluck('user_id')
            ->unique();

        foreach ($mktStageUserIds as $userId) {
            DB::table('user_stage_permissions')->updateOrInsert(
                ['user_id' => $userId, 'stage' => 15],
                ['is_owner' => true, 'can_view' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // C. Stage 14 (Verifikasi Bayar - 11b) for Finance users
        $financeUsers = DB::table('users')->where('role', 'finance')->get();
        foreach ($financeUsers as $user) {
            foreach ([10, 12, 14] as $stage) {
                DB::table('user_stage_permissions')->updateOrInsert(
                    ['user_id' => $user->id, 'stage' => $stage],
                    ['is_owner' => true, 'can_view' => true, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        // D. Admins, Managers, Superadmins can view and own Stage 14 & 15
        $adminUsers = DB::table('users')->whereIn('role', ['admin', 'manager', 'superadmin'])->get();
        foreach ($adminUsers as $user) {
            $isOwner = in_array($user->role, ['admin', 'superadmin']);
            foreach ([14, 15] as $stage) {
                DB::table('user_stage_permissions')->updateOrInsert(
                    ['user_id' => $user->id, 'stage' => $stage],
                    ['is_owner' => $isOwner, 'can_view' => true, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('user_stage_permissions')->whereIn('stage', [15])->delete();
    }
};
