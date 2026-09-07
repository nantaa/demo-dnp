<?php
namespace Tests\Unit;
use Tests\TestCase;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class BatchDurationComputedTest extends TestCase
{
    use RefreshDatabase;

    public function test_duration_computed_correctly()
    {
        $job = Job::create(['kode'=>'DNP/2026/BD001','klien'=>'PT E','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'LIFT','units'=>1,'no_po'=>'PO/BD/001','termin_pembayaran'=>'FULL','stage'=>9]);
        $batch = $job->batches()->create([
            'batch_sequence'=>1,'current_stage'=>'9',
            'tanggal_input_suket'=>Carbon::parse('2026-09-01'),
            'tanggal_terbit_suket'=>Carbon::parse('2026-09-08'),
        ]);
        $this->assertEquals(7, $batch->calculateDuration());
    }

    public function test_duration_is_zero_when_dates_missing()
    {
        $job = Job::create(['kode'=>'DNP/2026/BD002','klien'=>'PT F','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'LIFT','units'=>1,'no_po'=>'PO/BD/002','termin_pembayaran'=>'FULL','stage'=>9]);
        $batch = $job->batches()->create(['batch_sequence'=>1,'current_stage'=>'9']);
        $this->assertEquals(0, $batch->calculateDuration());
    }
}
