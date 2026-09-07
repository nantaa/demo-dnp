<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Job;
use App\Models\Unit;
use App\Models\InspectionEvent;
use App\Models\LHPP;
use App\Models\Batch;
use App\Models\PaymentVerification;
use Illuminate\Foundation\Testing\RefreshDatabase;

class JobV3DataModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_creates_and_relates_to_units()
    {
        $job = Job::create([
            'kode'              => 'DNP/2026/0001',
            'klien'             => 'PT Test Client',
            'lokasi'            => 'Jakarta',
            'owner_marketing'   => 'Marketing Test',
            'pesawat'           => 'Pesawat Angkat & Angkut',
            'units'             => 2,
            'total_unit_count'  => 2,
            'nilai'             => 10000000,
            'no_po'             => 'PO/TEST/001',
            'termin_pembayaran' => 'DP',
            'dp_paid'           => false,
            'stage'             => 1,
        ]);

        $u1 = $job->units()->create([
            'nama_alat'     => 'Forklift 01',
            'kategori'      => 'Pesawat Angkat & Angkut',
            'ru_result'     => 'Pending',
            'current_stage' => '4',
            'unit_status'   => 'InProgress',
        ]);

        $u2 = $job->units()->create([
            'nama_alat'     => 'Crane 01',
            'kategori'      => 'Pesawat Angkat & Angkut',
            'ru_result'     => 'Pending',
            'current_stage' => '4',
            'unit_status'   => 'InProgress',
        ]);

        $this->assertCount(2, $job->units);
        $this->assertEquals('Open', $job->job_status);
        $this->assertEquals(0, $job->closed_unit_count);
    }

    public function test_inspection_event_creates_bap_and_links_units()
    {
        $job = Job::create([
            'kode'              => 'DNP/2026/0002',
            'klien'             => 'PT Inspect',
            'lokasi'            => 'Cikarang',
            'owner_marketing'   => 'Marketing Test',
            'pesawat'           => 'FIRE',
            'units'             => 2,
            'total_unit_count'  => 2,
            'no_po'             => 'PO/TEST/002',
            'termin_pembayaran' => 'FULL',
            'stage'             => 4,
        ]);

        $unit = $job->units()->create([
            'nama_alat'     => 'Hydrant',
            'kategori'      => 'Kebakaran',
            'no_seri'       => 'HYD-001',
            'ru_result'     => 'Sesuai',
            'current_stage' => '5',
            'unit_status'   => 'InProgress',
        ]);

        $event = $job->inspectionEvents()->create([
            'type'                => 'Initial RU (Stage 4)',
            'tanggal_pelaksanaan' => now()->toDateString(),
        ]);

        $bap = $event->bap()->create([
            'no_bap'         => 'BAP/001',
            'tanggal_terbit' => now()->toDateString(),
        ]);

        $event->units()->attach($unit->id, [
            'hasil_unit' => 'Sesuai',
        ]);

        $this->assertEquals('BAP/001', $event->bap->no_bap);
        $this->assertTrue($event->units->contains($unit));
    }

    public function test_batch_groups_approved_units()
    {
        $job = Job::create([
            'kode'              => 'DNP/2026/0003',
            'klien'             => 'PT Batch Test',
            'lokasi'            => 'Surabaya',
            'owner_marketing'   => 'Marketing',
            'pesawat'           => 'ELEVATOR',
            'units'             => 1,
            'total_unit_count'  => 1,
            'no_po'             => 'PO/TEST/003',
            'termin_pembayaran' => 'FULL',
            'stage'             => 6,
        ]);

        $unit = $job->units()->create([
            'nama_alat'     => 'Elevator Passenger',
            'kategori'      => 'ELEVATOR',
            'ru_result'     => 'Sesuai',
            'current_stage' => '7',
            'unit_status'   => 'InProgress',
        ]);

        $lhpp = $unit->lhpps()->create([
            'version_number' => 1,
            'is_final'       => true,
            'status'         => 'Approved',
        ]);
        $unit->update(['final_lhpp_id' => $lhpp->id]);

        $batch = $job->batches()->create([
            'batch_sequence' => 1,
            'current_stage'  => '7',
            'status_tag'     => 'On Track',
        ]);
        $batch->units()->attach($unit->id);

        $this->assertCount(1, $batch->units);
        $this->assertEquals('Approved', $batch->units->first()->finalLhpp->status);
    }
}
