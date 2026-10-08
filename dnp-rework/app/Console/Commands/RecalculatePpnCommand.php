<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Job;

class RecalculatePpnCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jobs:recalc-ppn-11 {--apply : Apply changes to the database} {--kode= : Recalculate specific job by kode}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate jobs stored with 12% PPN to 11% PPN (e.g. 5.600.000 -> 5.550.000)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $apply = $this->option('apply');
        $kode = $this->option('kode');

        $query = Job::where('nilai', '>', 0);
        if ($kode) {
            $query->where('kode', $kode);
        }

        $jobs = $query->get();
        $this->info("Found {$jobs->count()} jobs to inspect.");

        $updatedCount = 0;
        foreach ($jobs as $job) {
            $currentNilai = (float) $job->nilai;

            // Check if currentNilai was calculated as DPP * 1.12
            // If so, DPP = round(currentNilai / 1.12)
            $possibleDpp12 = round($currentNilai / 1.12);
            $recomputed12 = round($possibleDpp12 * 1.12);

            // If it cleanly matches 1.12 calculation
            if (abs($currentNilai - $recomputed12) < 2) {
                $newNilai11 = round($possibleDpp12 * 1.11);
                $dppFormatted = number_format($possibleDpp12, 0, ',', '.');
                $oldFormatted = number_format($currentNilai, 0, ',', '.');
                $newFormatted = number_format($newNilai11, 0, ',', '.');

                $this->line("Job [{$job->kode}] {$job->klien}: DPP Rp {$dppFormatted} | 12% Rp {$oldFormatted} -> 11% Rp {$newFormatted}");

                if ($apply) {
                    $job->update(['nilai' => $newNilai11]);
                }
                $updatedCount++;
            }
        }

        if ($apply) {
            $this->info("Successfully updated {$updatedCount} jobs to 11% PPN.");
        } else {
            $this->warn("DRY RUN: {$updatedCount} jobs identified. Run with --apply to commit changes to the database.");
        }
    }
}
