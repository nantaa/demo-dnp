<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->string('jam_mulai', 50)->nullable()->after('tgl_pelaksanaan');
            $table->integer('durasi_hari')->default(1)->after('jam_mulai');
            $table->json('alat_ids')->nullable()->after('disnaker_tujuan');
            $table->json('cert_ids')->nullable()->after('alat_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dnp_jobs', function (Blueprint $table) {
            $table->dropColumn(['jam_mulai', 'durasi_hari', 'alat_ids', 'cert_ids']);
        });
    }
};
