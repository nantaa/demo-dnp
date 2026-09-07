<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\Job;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UnitLevelStatusRollupTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_correctly_shows_partial_when_split()
    {
        $job = Job::create(['kode'=>'DNP/2026/UL001','klien'=>'PT Split','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>5,'total_unit_count'=>5,'no_po'=>'PO/UL/001','termin_pembayaran'=>'FULL','stage'=>9]);
        // 3 units closed
        for ($i=1;$i<=3;$i++) {
            $job->units()->create(['nama_alat'=>"Unit $i",'ru_result'=>'Sesuai','current_stage'=>'12','unit_status'=>'Closed','closed_at'=>now()]);
        }
        // 2 units in rework
        for ($i=4;$i<=5;$i++) {
            $job->units()->create(['nama_alat'=>"Unit $i",'ru_result'=>'Tidak Sesuai','current_stage'=>'4b','unit_status'=>'ReworkLoop','rework_started_at'=>now()]);
        }
        $job->load('units');
        $this->assertEquals('Partial', $job->job_status);
        $this->assertEquals(3, $job->closed_unit_count);
    }

    public function test_unit_rework_loop_status_set_correctly()
    {
        $job = Job::create(['kode'=>'DNP/2026/UL002','klien'=>'PT Rework','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'BOILER','units'=>1,'no_po'=>'PO/UL/002','termin_pembayaran'=>'FULL','stage'=>4]);
        $unit = $job->units()->create(['nama_alat'=>'Boiler','ru_result'=>'Tidak Sesuai','current_stage'=>'4b','unit_status'=>'ReworkLoop','rework_started_at'=>now()]);
        $this->assertEquals('ReworkLoop', $unit->unit_status);
        $this->assertEquals('4b', $unit->current_stage);
        $this->assertNotNull($unit->rework_started_at);
    }
}
