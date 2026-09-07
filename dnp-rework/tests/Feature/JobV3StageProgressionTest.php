<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;

class JobV3StageProgressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_stage_1_requires_termin_pembayaran()
    {
        $marketing = User::factory()->create(['role' => 'marketing', 'name' => 'Marketing']);

        $response = $this->actingAs($marketing)->post(route('jobs.store'), [
            'klien'           => 'PT Termin Test',
            'pesawat'         => 'CRANE',
            'lokasi'          => 'Tangerang',
            'owner_marketing' => 'Marketing',
            'no_po'           => 'PO/TERM/01',
            'units'           => 1,
            'nilai'           => 10000000,
            // omitting termin_pembayaran
        ]);

        $response->assertSessionHasErrors('termin_pembayaran');
    }

    public function test_stage_3_surat_tugas_blocked_if_dp_unpaid()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $job = Job::create([
            'kode'              => 'DNP/2026/0020',
            'klien'             => 'PT DP Blocked',
            'lokasi'            => 'Jakarta',
            'owner_marketing'   => 'Marketing',
            'pesawat'           => 'ELEVATOR',
            'units'             => 1,
            'no_po'             => 'PO/DP/01',
            'termin_pembayaran' => 'DP',
            'dp_paid'           => false,
            'stage'             => 3,
        ]);

        $response = $this->actingAs($admin)->post(route('jobs.move', $job), [
            'next_stage'    => 4,
            'schedule_days' => [
                ['date' => now()->addDays(2)->toDateString(), 'inspector_ids' => [$admin->id]]
            ],
            'jam_mulai'       => '09:00',
            'disnaker_tujuan' => 'Disnaker DKI',
        ]);

        $response->assertSessionHasErrors('dp_paid');
    }

    public function test_stage_3_reschedule_logs_reason()
    {
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'Admin User']);

        $job = Job::create([
            'kode'              => 'DNP/2026/0021',
            'klien'             => 'PT Reschedule Test',
            'lokasi'            => 'Jakarta',
            'owner_marketing'   => 'Marketing',
            'pesawat'           => 'ELEVATOR',
            'units'             => 1,
            'no_po'             => 'PO/RS/01',
            'termin_pembayaran' => 'FULL',
            'tgl_pelaksanaan'   => '2026-09-10',
            'stage'             => 3,
        ]);

        $response = $this->actingAs($admin)->post(route('jobs.reschedule', $job), [
            'reason'              => 'Unit rusak sedang dalam perbaikan oleh teknisi',
            'new_tgl_pelaksanaan' => '2026-09-20',
        ]);

        $response->assertSessionHasNoErrors();
        $job->refresh();

        $this->assertEquals('2026-09-20', $job->tgl_pelaksanaan->toDateString());
        $this->assertNotEmpty($job->reschedule_reason_log);
        $this->assertEquals('Unit rusak sedang dalam perbaikan oleh teknisi', $job->reschedule_reason_log[0]['reason']);
    }

    public function test_stage_11c_payment_partial_loops_back_to_stage_11()
    {
        $finance = User::factory()->create(['role' => 'finance', 'name' => 'Finance Officer']);

        $job = Job::create([
            'kode'                 => 'DNP/2026/0022',
            'klien'                => 'PT Partial Payment',
            'lokasi'               => 'Jakarta',
            'owner_marketing'      => 'Marketing',
            'pesawat'              => 'BOILER',
            'units'                => 1,
            'no_po'                => 'PO/FIN/01',
            'termin_pembayaran'    => 'FULL',
            'stage'                => 15, // Stage 11c
            'payment_retry_count'  => 0,
        ]);

        $response = $this->actingAs($finance)->post(route('jobs.payment-verification', $job), [
            'status' => 'Partial',
            'notes'  => 'Transfer baru 50%, menunggu pelunasan',
        ]);

        $response->assertSessionHasNoErrors();
        $job->refresh();

        $this->assertEquals(11, $job->stage); // Looped back to Stage 11
        $this->assertEquals(1, $job->payment_retry_count);
    }
}
