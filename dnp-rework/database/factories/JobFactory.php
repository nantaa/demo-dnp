<?php

namespace Database\Factories;

use App\Models\Job;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Job>
 */
class JobFactory extends Factory
{
    protected $model = Job::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'kode' => 'DNP/2026/' . str_pad(fake()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'klien' => fake()->company(),
            'lokasi' => fake()->city(),
            'owner_marketing' => fake()->name(),
            'pesawat' => 'Pesawat Angkat & Angkut',
            'units' => 1,
            'total_unit_count' => 1,
            'nilai' => fake()->numberBetween(10000000, 100000000),
            'termin_pembayaran' => 'FULL',
            'dp_paid' => false,
            'stage' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
