<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Job;
use App\Models\Unit;
use App\Models\User;

/**
 * Seeds demo jobs with units to demonstrate v3 Kanban board.
 * Does NOT seed production data — use import_prod.js for that.
 */
class DemoJobSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure a Marketing user exists
        $marketing = User::firstOrCreate(
            ['email' => 'demo.marketing@dnp.local'],
            ['name' => 'Demo Marketing', 'role' => 'marketing', 'password' => bcrypt('password')]
        );

        // Job 1: Split scenario (3 units passing, 1 in rework)
        $job1 = Job::create([
            'kode'              => 'DNP/2026/DEMO01',
            'klien'             => 'PT Demo Split Job',
            'lokasi'            => 'Jakarta Selatan',
            'owner_marketing'   => $marketing->name,
            'pesawat'           => 'Pesawat Angkat & Angkut',
            'units'             => 4,
            'total_unit_count'  => 4,
            'no_po'             => 'PO/DEMO/001',
            'termin_pembayaran' => 'FULL',
            'stage'             => 5,
        ]);

        $unitsPassing = ['Forklift 01', 'Forklift 02', 'Crane Overhead 01'];
        foreach ($unitsPassing as $name) {
            $job1->units()->create([
                'nama_alat'     => $name,
                'kategori'      => 'Pesawat Angkat & Angkut',
                'ru_result'     => 'Sesuai',
                'current_stage' => '5',
                'unit_status'   => 'InProgress',
            ]);
        }
        $job1->units()->create([
            'nama_alat'          => 'Forklift 03 (Rusak)',
            'kategori'           => 'Pesawat Angkat & Angkut',
            'ru_result'          => 'Tidak Sesuai',
            'current_stage'      => '4b',
            'unit_status'        => 'ReworkLoop',
            'rework_started_at'  => now()->subDays(5),
        ]);

        // Job 2: Fully in-progress, all units at Stage 8
        $job2 = Job::create([
            'kode'              => 'DNP/2026/DEMO02',
            'klien'             => 'PT Demo Normal Flow',
            'lokasi'            => 'Tangerang',
            'owner_marketing'   => $marketing->name,
            'pesawat'           => 'ELEVATOR',
            'units'             => 2,
            'total_unit_count'  => 2,
            'no_po'             => 'PO/DEMO/002',
            'termin_pembayaran' => 'DP',
            'dp_paid'           => true,
            'dp_amount'         => 15000000,
            'stage'             => 8,
        ]);
        foreach (['Elevator Penumpang 01', 'Elevator Penumpang 02'] as $name) {
            $job2->units()->create([
                'nama_alat'     => $name,
                'kategori'      => 'ELEVATOR',
                'ru_result'     => 'Sesuai',
                'current_stage' => '8',
                'unit_status'   => 'InProgress',
            ]);
        }

        $this->command->info('Demo jobs seeded: DNP/2026/DEMO01, DNP/2026/DEMO02');
    }
}
