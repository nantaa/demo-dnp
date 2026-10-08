<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\DailyDigestService;
use App\Mail\DailyDigestMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendDailyDigestCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'report:daily-digest 
                            {--time=morning : Edition: morning (08:00) or afternoon (16:00)} 
                            {--dry-run : Simulate and preview outputs in console without sending emails} 
                            {--user= : Target specific user ID for testing} 
                            {--force : Force send even if already sent today}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send role-tailored morning agenda or afternoon recap email digests to DNP team members.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $time = strtolower($this->option('time') ?: 'morning');
        if (!in_array($time, ['morning', 'afternoon'])) {
            $this->error("Pilihan --time tidak valid. Gunakan 'morning' atau 'afternoon'.");
            return 1;
        }

        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $targetUserId = $this->option('user');

        $this->info("=======================================================");
        $this->info(" DNP Monitor · Daily Digest Email Dispatcher");
        $this->info(" Edisi : " . strtoupper($time) . " (" . ($time === 'morning' ? '08:00 WIB' : '16:00 WIB') . ")");
        $this->info(" Mode  : " . ($dryRun ? "SIMULASI (DRY-RUN - Tidak mengirim email)" : "LIVE SEND (SMTP)"));
        $this->info("=======================================================");

        // Fetch target users
        if ($targetUserId) {
            $users = User::where('id', $targetUserId)->get();
            if ($users->isEmpty()) {
                $this->error("User ID {$targetUserId} tidak ditemukan.");
                return 1;
            }
        } else {
            $users = DailyDigestService::getEligibleUsers();
        }

        $today = now()->format('Y-m-d');
        $sentCount = 0;
        $skippedZeroCount = 0;
        $skippedDuplicateCount = 0;

        $tableRows = [];

        foreach ($users as $user) {
            $payload = DailyDigestService::buildDigestPayload($user, $time);

            // 1. Zero-Task Suppression
            if (!$payload) {
                $skippedZeroCount++;
                $tableRows[] = [
                    $user->name,
                    $user->email,
                    strtoupper($user->role),
                    '0',
                    '0',
                    'Dilewati (0 Tugas)',
                ];
                continue;
            }

            // 2. Idempotency Check (Prevent duplicate sends in same edition window)
            $cacheKey = "daily_digest_{$user->id}_{$today}_{$time}";
            if (!$force && !$dryRun && Cache::has($cacheKey)) {
                $skippedDuplicateCount++;
                $tableRows[] = [
                    $user->name,
                    $user->email,
                    strtoupper($user->role),
                    $payload['total_tasks'],
                    $payload['overdue_count'],
                    'Dilewati (Sudah Terkirim)',
                ];
                continue;
            }

            // 3. Dry-run vs Live Send
            if ($dryRun) {
                $sentCount++;
                $tableRows[] = [
                    $user->name,
                    $user->email,
                    strtoupper($user->role),
                    $payload['total_tasks'],
                    $payload['overdue_count'],
                    'Siap Kirim (Simulasi)',
                ];
            } else {
                try {
                    Mail::to($user->email)->send(new DailyDigestMail($payload));
                    Cache::put($cacheKey, true, now()->addHours(6));
                    $sentCount++;

                    $tableRows[] = [
                        $user->name,
                        $user->email,
                        strtoupper($user->role),
                        $payload['total_tasks'],
                        $payload['overdue_count'],
                        'TERKIRIM ✓',
                    ];

                    // 250ms throttle delay to protect Google Workspace SMTP socket limits
                    usleep(250000);
                } catch (\Throwable $e) {
                    Log::error("Gagal mengirim email digest ke {$user->email}: " . $e->getMessage());
                    $tableRows[] = [
                        $user->name,
                        $user->email,
                        strtoupper($user->role),
                        $payload['total_tasks'],
                        $payload['overdue_count'],
                        'GAGAL: ' . substr($e->getMessage(), 0, 30),
                    ];
                }
            }
        }

        $this->table(
            ['Nama', 'Email', 'Role', 'Total Tugas', 'Overdue', 'Status'],
            $tableRows
        );

        $this->info("-------------------------------------------------------");
        $this->info("Ringkasan: {$sentCount} diproses, {$skippedZeroCount} tanpa tugas, {$skippedDuplicateCount} duplikat dicegah.");
        $this->info("=======================================================");

        return 0;
    }
}
