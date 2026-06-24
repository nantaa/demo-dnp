<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\InspectorProfile;
use App\Models\UserStagePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password123');

        // 1. Superadmin
        User::firstOrCreate(
            ['email' => 'superadmin@deltaindo.co.id'],
            [
                'name' => 'Super Administrator',
                'password' => $password,
                'role' => 'superadmin',
                'email_verified_at' => now(),
            ]
        );

        // 2. Marketing
        User::firstOrCreate(
            ['email' => 'andini@deltaindo.co.id'],
            [
                'name' => 'Andini Sari',
                'password' => $password,
                'role' => 'marketing',
                'email_verified_at' => now(),
            ]
        );

        // 3. Admin (Budi Susanto) - owns stages 2, 3, 4, 5
        $admin1 = User::firstOrCreate(
            ['email' => 'budi@deltaindo.co.id'],
            [
                'name' => 'Budi Susanto',
                'password' => $password,
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
        $this->assignStages($admin1, [2, 3, 4, 5]);

        // 4. Kadiv RU (Terzha)
        $mgr = User::firstOrCreate(
            ['email' => 'terzha@deltaindo.co.id'],
            [
                'name' => 'Terzha R. Perdanawan',
                'password' => $password,
                'role' => 'manager',
                'email_verified_at' => now(),
            ]
        );
        $this->assignStages($mgr, [8, 9]); // Review LHPP, Pengurusan Suket

        // 5. Finance (Putri)
        $fin = User::firstOrCreate(
            ['email' => 'putri@deltaindo.co.id'],
            [
                'name' => 'Putri Wahyuni',
                'password' => $password,
                'role' => 'finance',
                'email_verified_at' => now(),
            ]
        );
        $this->assignStages($fin, [10, 11]); // Penagihan, Lunas

        // 6. Inspekturs
        $this->createInspector('rendi@deltaindo.co.id', 'Rendi Pratama', $password, 'Bekasi', ['Umum', 'Listrik'], 3);
        $this->createInspector('sri@deltaindo.co.id', 'Sri Mulyani', $password, 'Bekasi', ['Listrik', 'Umum'], 2);
        $this->createInspector('bambang@deltaindo.co.id', 'Bambang Setiawan', $password, 'Jakarta', ['PUBT', 'Umum'], 4);
    }

    private function assignStages(User $user, array $stages)
    {
        foreach ($stages as $stage) {
            UserStagePermission::firstOrCreate([
                'user_id' => $user->id,
                'stage' => $stage,
            ]);
        }
    }

    private function createInspector($email, $name, $password, $domisili, $spesialisasi, $seniorLevel)
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'role' => 'inspektur',
                'email_verified_at' => now(),
            ]
        );

        $this->assignStages($user, [6, 7]); // Pelaksanaan RU, Penyusunan LHPP

        InspectorProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'skp' => 'SKP/AK3-'.strtoupper($spesialisasi[0]).'/2026/'.rand(100,999),
                'skp_expired_at' => now()->addYears(1),
                'spesialisasi' => $spesialisasi,
                'domisili' => $domisili,
                'senior_level' => $seniorLevel,
                'active' => true,
            ]
        );
    }
}
