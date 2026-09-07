<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\Job;
use App\Models\PaymentVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SuketDeliveryGateTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_verification_partial_loops_to_stage_11()
    {
        $finance = User::factory()->create(['role'=>'finance']);
        $job = Job::create(['kode'=>'DNP/2026/SG001','klien'=>'PT SUKET Gate','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'BOILER','units'=>1,'no_po'=>'PO/SG/001','termin_pembayaran'=>'FULL',
            'stage'=>15,'payment_retry_count'=>0]);
        $response = $this->actingAs($finance)->post(route('jobs.payment-verification', $job), [
            'status'=>'Partial','notes'=>'Baru dibayar 50%',
        ]);
        $response->assertSessionHasNoErrors();
        $job->refresh();
        $this->assertEquals(11, $job->stage);
        $this->assertEquals(1, $job->payment_retry_count);
    }

    public function test_payment_verification_verified_does_not_loop()
    {
        $finance = User::factory()->create(['role'=>'finance']);
        $job = Job::create(['kode'=>'DNP/2026/SG002','klien'=>'PT SUKET Verified','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'BOILER','units'=>1,'no_po'=>'PO/SG/002','termin_pembayaran'=>'FULL',
            'stage'=>15,'payment_retry_count'=>0]);
        $response = $this->actingAs($finance)->post(route('jobs.payment-verification', $job), [
            'status'=>'Verified','notes'=>'Pembayaran penuh diterima',
        ]);
        $response->assertSessionHasNoErrors();
        $job->refresh();
        $this->assertEquals(15, $job->stage); // Did NOT loop back
        $this->assertEquals(0, $job->payment_retry_count);
    }

    public function test_non_finance_cannot_submit_verification()
    {
        $admin = User::factory()->create(['role'=>'admin']);
        $job = Job::create(['kode'=>'DNP/2026/SG003','klien'=>'PT Unauth','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>1,'no_po'=>'PO/SG/003','termin_pembayaran'=>'FULL','stage'=>15]);
        $response = $this->actingAs($admin)->post(route('jobs.payment-verification', $job), [
            'status'=>'Verified',
        ]);
        $response->assertStatus(403);
    }
}
