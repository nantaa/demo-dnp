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
        // Drop the old pivot table
        Schema::dropIfExists('job_inspectors');

        // Recreate the pivot table with correct types
        Schema::create('job_inspectors', function (Blueprint $table) {
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->foreignId('inspector_id')->constrained('users')->onDelete('cascade');
            
            $table->primary(['job_id', 'inspector_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_inspectors');

        Schema::create('job_inspectors', function (Blueprint $table) {
            $table->foreignUuid('job_id')->constrained('dnp_jobs')->onDelete('cascade');
            $table->string('inspector_id', 50); // The old string format
            
            $table->primary(['job_id', 'inspector_id']);
        });
    }
};
