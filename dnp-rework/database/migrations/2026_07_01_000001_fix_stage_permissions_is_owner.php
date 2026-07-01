<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * HOTFIX: Set is_owner = true for all existing user_stage_permissions rows.
 *
 * Root cause: The original DatabaseSeeder::assignStages() used firstOrCreate()
 * without explicitly setting is_owner=true, so all seeded rows defaulted to
 * is_owner=false. Permissions saved via the UI before the controller fix was
 * deployed were also saved with is_owner=0.
 *
 * This migration safely sets is_owner=true for every existing row, making all
 * assigned permissions actually effective.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Set all existing permission rows to is_owner = true.
        // The mere existence of a row means the superadmin intentionally
        // assigned that stage to that user, so ownership is implied.
        DB::statement('UPDATE user_stage_permissions SET is_owner = true WHERE is_owner = false OR is_owner IS NULL');
        DB::statement('UPDATE user_stage_permissions SET can_view = true WHERE can_view = false OR can_view IS NULL');
    }

    public function down(): void
    {
        // Cannot safely reverse this — we don't know which rows were originally false.
        // Leave as-is on rollback.
    }
};
