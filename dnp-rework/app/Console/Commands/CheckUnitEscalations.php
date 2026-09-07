<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Unit;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;

class CheckUnitEscalations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dnp:check-unit-escalations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for units stuck in the Stage 4b-4c-4d rework loop and trigger multi-tier escalation reminders.';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notifications)
    {
        $this->info('Checking units in rework loop for escalation triggers...');

        $stuckUnits = Unit::with('job')
            ->where('unit_status', 'ReworkLoop')
            ->whereNotNull('rework_started_at')
            ->get();

        $now = Carbon::now();
        $count = 0;

        foreach ($stuckUnits as $unit) {
            $days = $unit->rework_started_at->diffInDays($now);
            $jobKode = $unit->job?->kode ?? 'N/A';
            $jobKlien = $unit->job?->klien ?? 'N/A';

            // Level 2 & 3: > 14 days -> Notify Manager
            if ($days >= 14) {
                $managers = User::whereIn('role', ['manager', 'superadmin'])->get();
                foreach ($managers as $mgr) {
                    $notifications->send(
                        $mgr->id,
                        'Eskalasi Unit Rework (Level 2/3)',
                        "Unit {$unit->nama_alat} pada Job {$jobKode} ({$jobKlien}) telah tertahan selama {$days} hari di rantai rework. Perlu keputusan Manager.",
                        'warning'
                    );
                }
                $this->warn("Unit {$unit->id} ({$unit->nama_alat}): {$days} hari -> Eskalasi Manager terkirim.");
                $count++;
            }
            // Level 1: > 7 days -> Notify Marketing & Admin
            elseif ($days >= 7) {
                $operators = User::whereIn('role', ['marketing', 'admin'])->get();
                foreach ($operators as $op) {
                    $notifications->send(
                        $op->id,
                        'Peringatan Keterlambatan Rework (Level 1)',
                        "Unit {$unit->nama_alat} pada Job {$jobKode} telah tertahan {$days} hari di rantai reschedule.",
                        'info'
                    );
                }
                $this->info("Unit {$unit->id} ({$unit->nama_alat}): {$days} hari -> Reminder Level 1 terkirim.");
                $count++;
            }
        }

        $this->info("Pengecekan selesai. {$count} notifikasi eskalasi diproses.");
        return Command::SUCCESS;
    }
}
