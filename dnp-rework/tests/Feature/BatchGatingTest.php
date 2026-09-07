<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\Job;
use App\Models\Unit;
use App\Models\LHPP;
use App\Models\Batch;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BatchGatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unit_with_approved_lhpp_can_join_batch()
    {
        $job = Job::create(['kode'=>'DNP/2026/BG001','klien'=>'PT Batch Gate','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'ELEVATOR','units'=>1,'no_po'=>'PO/BG/001','termin_pembayaran'=>'FULL','stage'=>7]);
        $unit = $job->units()->create(['nama_alat'=>'Elevator','ru_result'=>'Sesuai','current_stage'=>'7','unit_status'=>'InProgress']);
        $lhpp = $unit->lhpps()->create(['version_number'=>1,'is_final'=>true,'status'=>'Approved']);
        $unit->update(['final_lhpp_id'=>$lhpp->id]);

        $batch = $job->batches()->create(['batch_sequence'=>1,'current_stage'=>'7','status_tag'=>'On Track']);
        $batch->units()->attach($unit->id);

        $this->assertCount(1, $batch->units);
        $this->assertEquals('Approved', $batch->units->first()->finalLhpp->status);
    }

    public function test_batch_can_have_multiple_units()
    {
        $job = Job::create(['kode'=>'DNP/2026/BG002','klien'=>'PT Multi Batch','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>3,'total_unit_count'=>3,'no_po'=>'PO/BG/002','termin_pembayaran'=>'FULL','stage'=>7]);
        $batch = $job->batches()->create(['batch_sequence'=>1,'current_stage'=>'7']);
        for ($i=1; $i<=3; $i++) {
            $unit = $job->units()->create(['nama_alat'=>"Unit $i",'ru_result'=>'Sesuai','current_stage'=>'7','unit_status'=>'InProgress']);
            $lhpp = $unit->lhpps()->create(['version_number'=>1,'is_final'=>true,'status'=>'Approved']);
            $unit->update(['final_lhpp_id'=>$lhpp->id]);
            $batch->units()->attach($unit->id);
        }
        $this->assertCount(3, $batch->fresh()->units);
    }
}
