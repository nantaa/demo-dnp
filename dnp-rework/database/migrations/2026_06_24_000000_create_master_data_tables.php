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
        Schema::create('alat_ujis', function (Blueprint $table) {
            $table->id();
            $table->string('kode_alat')->unique();
            $table->string('nama');
            $table->string('merk')->nullable();
            $table->string('serial')->nullable();
            $table->json('kategori')->nullable();
            $table->date('kalibrasi_terakhir')->nullable();
            $table->date('kalibrasi_expired')->nullable();
            $table->string('lab')->nullable();
            $table->string('status')->default('tersedia');
            $table->timestamps();
        });

        Schema::create('sertifikat_pjk3s', function (Blueprint $table) {
            $table->id();
            $table->string('kode_cert')->unique();
            $table->string('nama');
            $table->string('no_sk')->nullable();
            $table->date('terbit')->nullable();
            $table->date('expired')->nullable();
            $table->string('file')->nullable();
            $table->string('kategori')->nullable();
            $table->timestamps();
        });

        Schema::create('regulasi_k3s', function (Blueprint $table) {
            $table->id();
            $table->string('kode_reg')->unique();
            $table->string('kategori')->nullable();
            $table->string('nama');
            $table->string('tentang')->nullable();
            $table->date('terbit')->nullable();
            $table->string('status')->nullable();
            $table->string('source')->nullable();
            $table->string('revisi_terakhir')->nullable();
            $table->timestamps();
        });

        Schema::create('form_disnakers', function (Blueprint $table) {
            $table->id();
            $table->string('kode_form')->unique();
            $table->string('kode_disnaker')->nullable(); // e.g., Form 6, Form 36
            $table->string('nama');
            $table->string('pesawat')->nullable();
            $table->string('revisi')->nullable();
            $table->date('last_updated')->nullable();
            $table->string('file')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_disnakers');
        Schema::dropIfExists('regulasi_k3s');
        Schema::dropIfExists('sertifikat_pjk3s');
        Schema::dropIfExists('alat_ujis');
    }
};
