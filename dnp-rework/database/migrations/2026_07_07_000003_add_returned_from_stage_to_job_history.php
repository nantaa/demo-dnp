<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_history', function (Blueprint $table) {
            $table->unsignedSmallInteger('returned_from_stage')->nullable()->after('action');
        });
    }

    public function down(): void
    {
        Schema::table('job_history', function (Blueprint $table) {
            $table->dropColumn('returned_from_stage');
        });
    }
};
