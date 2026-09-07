<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;

class JobV3SecurityAndMaskingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_see_nilai_on_jobs_list()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        Job::create([
            'kode'              => 'DNP/2026/0010',
            'klien'             => 'PT Commercial Secret',
            'lokasi'            => 'Jakarta',
            'owner_marketing'   => 'Marketing',
            'pesawat'           => 'BOILER',
            'units'             => 1,
            'nilai'             => 75000000,
            'total_invoice_amount' => 82500000,
            'no_po'             => 'PO/SEC/001',
            'termin_pembayaran' => 'FULL',
            'stage'             => 2,
        ]);

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertStatus(200);
        $jobs = $response->viewData('page')['props']['jobs'];
        
        $this->assertNotEmpty($jobs);
        $firstJob = $jobs[0];
        
        // Assert nilai is masked / hidden for admin
        $this->assertArrayNotHasKey('nilai', $firstJob);
        $this->assertArrayNotHasKey('total_invoice_amount', $firstJob);
    }

    public function test_marketing_can_see_nilai()
    {
        $marketing = User::factory()->create([
            'name' => 'Marketing Person',
            'role' => 'marketing',
        ]);

        Job::create([
            'kode'              => 'DNP/2026/0011',
            'klien'             => 'PT Visible Value',
            'lokasi'            => 'Bandung',
            'owner_marketing'   => 'Marketing Person',
            'pesawat'           => 'GENSET',
            'units'             => 1,
            'nilai'             => 45000000,
            'no_po'             => 'PO/MKT/001',
            'termin_pembayaran' => 'FULL',
            'stage'             => 1,
        ]);

        $response = $this->actingAs($marketing)->get(route('dashboard'));

        $response->assertStatus(200);
        $jobs = $response->viewData('page')['props']['jobs'];
        
        $this->assertNotEmpty($jobs);
        $firstJob = $jobs[0];
        
        $this->assertArrayHasKey('nilai', $firstJob);
        $this->assertEquals(45000000, $firstJob['nilai']);
    }
}
