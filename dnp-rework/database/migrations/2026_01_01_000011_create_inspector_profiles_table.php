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
        Schema::create('inspector_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->string('skp')->nullable();
            $table->date('skp_expired_at')->nullable();
            $table->jsonb('spesialisasi')->nullable(); // e.g. ["Umum", "Listrik", "PUBT"]
            $table->string('domisili')->nullable();
            $table->integer('senior_level')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();


        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspector_profiles');
    }
};
