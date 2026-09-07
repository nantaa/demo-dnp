<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\User;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_marketing_cannot_create_job()
    {
        $admin = User::factory()->create(['role'=>'admin']);
        // Admin should not be able to own stage 1
        // This depends on UserStagePermission — test that the route returns 403
        $response = $this->actingAs($admin)->get(route('jobs.create'));
        // Admin cannot own Stage 1 by default
        $response->assertStatus(403);
    }

    public function test_non_finance_cannot_verify_payment()
    {
        $marketing = User::factory()->create(['role'=>'marketing','name'=>'MKT']);
        $job = Job::create(['kode'=>'DNP/2026/RP001','klien'=>'PT RP','lokasi'=>'JKT','owner_marketing'=>'MKT',
            'pesawat'=>'CRANE','units'=>1,'no_po'=>'PO/RP/001','termin_pembayaran'=>'FULL','stage'=>15]);
        $response = $this->actingAs($marketing)->post(route('jobs.payment-verification', $job), [
            'status'=>'Verified',
        ]);
        $response->assertStatus(403);
    }
}
