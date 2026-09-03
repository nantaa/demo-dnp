<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->json('schedule_days')->nullable()->after('no_resi');
        });
    }

    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn('schedule_days');
        });
    }
};
