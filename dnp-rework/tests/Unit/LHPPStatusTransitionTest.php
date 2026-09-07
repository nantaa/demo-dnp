<?php
namespace Tests\Unit;
use Tests\TestCase;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LHPPStatusTransitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_lhpp_status_can_be_approved()
    {
        $job = Job::create(['kode'=>'DNP/2026/LH001','klien'=>'PT G','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>1,'no_po'=>'PO/LH/001','termin_pembayaran'=>'FULL','stage'=>5]);
        $unit = $job->units()->create(['nama_alat'=>'Forklift','ru_result'=>'Sesuai','current_stage'=>'5','unit_status'=>'InProgress']);
        $lhpp = $unit->lhpps()->create(['version_number'=>1,'is_final'=>true,'status'=>'Draft']);
        $lhpp->update(['status' => 'Approved']);
        $this->assertEquals('Approved', $lhpp->fresh()->status);
    }

    public function test_only_one_lhpp_is_final_per_unit()
    {
        $job = Job::create(['kode'=>'DNP/2026/LH002','klien'=>'PT H','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>1,'no_po'=>'PO/LH/002','termin_pembayaran'=>'FULL','stage'=>5]);
        $unit = $job->units()->create(['nama_alat'=>'Forklift','ru_result'=>'Sesuai','current_stage'=>'5','unit_status'=>'InProgress']);
        $lhpp1 = $unit->lhpps()->create(['version_number'=>1,'is_final'=>true,'status'=>'Approved']);
        $lhpp1->update(['is_final' => false]);
        $unit->lhpps()->create(['version_number'=>2,'is_final'=>true,'status'=>'Draft']);
        $this->assertEquals(1, $unit->lhpps()->where('is_final', true)->count());
    }
}
