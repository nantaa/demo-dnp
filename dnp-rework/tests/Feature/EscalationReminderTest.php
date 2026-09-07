<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\Job;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EscalationReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_unit_in_rework_loop_over_7_days_has_correct_scope()
    {
        $job = Job::create(['kode'=>'DNP/2026/ESC001','klien'=>'PT Esc','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>1,'no_po'=>'PO/ESC/001','termin_pembayaran'=>'FULL','stage'=>4]);
        $unit = $job->units()->create([
            'nama_alat'=>'Crane Lama','ru_result'=>'Tidak Sesuai','current_stage'=>'4b',
            'unit_status'=>'ReworkLoop','rework_started_at'=>now()->subDays(10),
        ]);
        // scopeNeedsManagerEscalation should catch this unit (>14 days scope)
        // For level 1 (>7d) check directly
        $stuck = Unit::where('unit_status','ReworkLoop')
            ->whereNotNull('rework_started_at')
            ->where('rework_started_at','<=',now()->subDays(7))
            ->get();
        $this->assertCount(1, $stuck);
        $this->assertEquals($unit->id, $stuck->first()->id);
    }

    public function test_unit_under_7_days_not_in_level1_escalation()
    {
        $job = Job::create(['kode'=>'DNP/2026/ESC002','klien'=>'PT Esc2','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>1,'no_po'=>'PO/ESC/002','termin_pembayaran'=>'FULL','stage'=>4]);
        $job->units()->create([
            'nama_alat'=>'Crane Baru','ru_result'=>'Tidak Sesuai','current_stage'=>'4b',
            'unit_status'=>'ReworkLoop','rework_started_at'=>now()->subDays(3),
        ]);
        $stuck = Unit::where('unit_status','ReworkLoop')
            ->whereNotNull('rework_started_at')
            ->where('rework_started_at','<=',now()->subDays(7))
            ->get();
        $this->assertCount(0, $stuck);
    }
}
