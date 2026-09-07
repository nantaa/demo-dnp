<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WorkflowStageGateTest extends TestCase
{
    use RefreshDatabase;

    public function test_surat_tugas_blocked_when_termin_dp_and_dp_not_paid()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $job = Job::create([
            'kode' => 'DNP/2026/GT001', 'klien' => 'PT DP Gate', 'lokasi' => 'Jakarta',
            'owner_marketing' => 'Marketing', 'pesawat' => 'BOILER', 'units' => 1,
            'no_po' => 'PO/GT/001', 'termin_pembayaran' => 'DP', 'dp_paid' => false, 'stage' => 3,
        ]);
        $response = $this->actingAs($admin)->post(route('jobs.move', $job), [
            'next_stage' => 4,
            'schedule_days' => [['date' => now()->addDays(3)->toDateString(), 'inspector_ids' => [$admin->id]]],
            'jam_mulai' => '08:00', 'disnaker_tujuan' => 'Disnaker DKI',
        ]);
        $response->assertSessionHasErrors('dp_paid');
        $this->assertEquals(3, $job->fresh()->stage);
    }

    public function test_surat_tugas_allowed_when_termin_full()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $job = Job::create([
            'kode' => 'DNP/2026/GT002', 'klien' => 'PT Full Pay', 'lokasi' => 'Jakarta',
            'owner_marketing' => 'Marketing', 'pesawat' => 'CRANE', 'units' => 1,
            'no_po' => 'PO/GT/002', 'termin_pembayaran' => 'FULL', 'stage' => 3,
        ]);
        $response = $this->actingAs($admin)->post(route('jobs.move', $job), [
            'next_stage' => 4,
            'schedule_days' => [['date' => now()->addDays(3)->toDateString(), 'inspector_ids' => [$admin->id]]],
            'jam_mulai' => '08:00', 'disnaker_tujuan' => 'Disnaker DKI',
        ]);
        $response->assertSessionHasNoErrors();
        $this->assertEquals(4, $job->fresh()->stage);
    }

    public function test_job_create_rejected_without_termin_pembayaran()
    {
        $marketing = User::factory()->create(['role' => 'marketing', 'name' => 'MKT User']);
        $response = $this->actingAs($marketing)->post(route('jobs.store'), [
            'klien' => 'PT No Termin', 'pesawat' => 'ELEVATOR', 'lokasi' => 'Bandung',
            'owner_marketing' => 'MKT User', 'no_po' => 'PO/NT/001', 'units' => 2,
        ]);
        $response->assertSessionHasErrors('termin_pembayaran');
    }
}
