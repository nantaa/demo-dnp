<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create the default Superadmin
        User::firstOrCreate(
            ['email' => 'superadmin@deltaindo.co.id'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'), // Change this after first login!
                'role' => 'superadmin',
                'email_verified_at' => now(),
            ]
        );

        // Optionally, you can add default Marketing or Admin users here later
    }
}
