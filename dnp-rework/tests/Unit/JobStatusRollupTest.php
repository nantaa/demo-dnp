<?php
namespace Tests\Unit;
use Tests\TestCase;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;

class JobStatusRollupTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_status_is_open_when_no_units()
    {
        $job = Job::create(['kode'=>'DNP/2026/R001','klien'=>'PT A','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>0,'no_po'=>'PO/R/001','termin_pembayaran'=>'FULL','stage'=>1]);
        $this->assertEquals('Open', $job->job_status);
    }

    public function test_job_status_is_partial_when_some_units_closed()
    {
        $job = Job::create(['kode'=>'DNP/2026/R003','klien'=>'PT C','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>2,'no_po'=>'PO/R/003','termin_pembayaran'=>'FULL','stage'=>9]);
        $job->units()->create(['nama_alat'=>'A','ru_result'=>'Sesuai','current_stage'=>'12','unit_status'=>'Closed','closed_at'=>now()]);
        $job->units()->create(['nama_alat'=>'B','ru_result'=>'Pending','current_stage'=>'4','unit_status'=>'InProgress']);
        $job->load('units');
        $this->assertEquals('Partial', $job->job_status);
        $this->assertEquals(1, $job->closed_unit_count);
    }

    public function test_job_status_is_closed_when_all_units_closed()
    {
        $job = Job::create(['kode'=>'DNP/2026/R004','klien'=>'PT D','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>2,'no_po'=>'PO/R/004','termin_pembayaran'=>'FULL','stage'=>12]);
        $job->units()->create(['nama_alat'=>'A','ru_result'=>'Sesuai','current_stage'=>'12','unit_status'=>'Closed','closed_at'=>now()]);
        $job->units()->create(['nama_alat'=>'B','ru_result'=>'Sesuai','current_stage'=>'12','unit_status'=>'Closed','closed_at'=>now()]);
        $job->load('units');
        $this->assertEquals('Closed', $job->job_status);
        $this->assertEquals(2, $job->closed_unit_count);
    }
}
