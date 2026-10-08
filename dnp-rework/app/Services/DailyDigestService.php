<?php

namespace App\Services;

use App\Models\Job;
use App\Models\User;
use Carbon\Carbon;

class DailyDigestService
{
    /**
     * Map of stages and their standard SLA days
     */
    protected static array $stageSlas = [
        1  => null,
        2  => 1,
        3  => 1,
        4  => null,
        13 => 1,
        5  => 3,
        6  => 1,
        7  => 1,
        8  => 30,
        9  => 1,
        10 => 1,
        11 => null,
        14 => 1,
        15 => null,
        12 => null,
    ];

    protected static array $stageNames = [
        1  => 'PO / SPK / Proposal',
        2  => 'Verifikasi Dokumen',
        3  => 'Penjadwalan & Surat Tugas',
        4  => 'Pelaksanaan RU (Inspeksi Lapangan)',
        13 => 'Aktualisasi Unit (Stage 4b)',
        5  => 'Penyusunan LHPP',
        6  => 'Review Laporan Teknis',
        7  => 'Verifikasi ke Dinas',
        8  => 'Proses Disnaker',
        9  => 'Pengurusan SUKET',
        10 => 'Invoice & Kwitansi',
        11 => 'Penagihan / Follow-up',
        14 => 'Verifikasi Bayar & PPh (Stage 11b)',
        15 => 'Kirim SUKET ke Klien (Stage 11c)',
        12 => 'Final Financial Closing',
    ];

    /**
     * Get all users eligible for receiving notifications.
     */
    public static function getEligibleUsers()
    {
        return User::whereNotNull('email')
            ->where('email', '!=', '')
            ->get();
    }

    /**
     * Extract pending tasks specifically relevant to a user based on their role and assignments.
     */
    public static function getUserTasks(User $user): array
    {
        $role = strtolower($user->role ?? '');
        $userId = $user->id;
        $userName = $user->name;

        // Fetch all active (unarchived) jobs
        $activeJobs = Job::where('stage', '<', 16)
            ->with(['inspectors'])
            ->orderBy('stage_started_at', 'asc')
            ->get();

        $tasks = [];

        foreach ($activeJobs as $job) {
            $stage = (int) $job->stage;
            $isAssigned = false;
            $actionRequired = '';

            // 1. INSPEKTUR / INSPECTOR
            if (in_array($role, ['inspektur', 'inspector'])) {
                $isAssignedInspector = $job->inspectors->contains('id', $userId);
                $isReportWriter = (int) $job->report_writer_id === (int) $userId;

                if (($isAssignedInspector || $isReportWriter) && in_array($stage, [4, 5])) {
                    $isAssigned = true;
                    $actionRequired = ($stage === 4)
                        ? 'Laksanakan inspeksi lapangan & unggah dokumentasi foto.'
                        : 'Selesaikan penyusunan draft link LHPP unit.';
                }
            }

            // 2. TIM AHLI
            elseif (in_array($role, ['tim_ahli', 'ahli'])) {
                if ($stage === 6) {
                    $isAssigned = true;
                    $actionRequired = 'Review teknis & putuskan persetujuan / revisi LHPP.';
                }
            }

            // 3. FINANCE / ADMIN KEUANGAN
            elseif ($role === 'finance') {
                if (in_array($stage, [10, 14, 12])) {
                    $isAssigned = true;
                    if ($stage === 10) $actionRequired = 'Terbitkan Invoice & Kwitansi pembayaran.';
                    elseif ($stage === 14) $actionRequired = 'Verifikasi bukti transfer / status pelunasan Lunas.';
                    elseif ($stage === 12) $actionRequired = 'Konfirmasi final financial closing & arsipkan pekerjaan.';
                }
            }

            // 4. MARKETING
            elseif ($role === 'marketing') {
                $isJobOwner = !empty($job->owner_marketing) && (stripos($job->owner_marketing, $userName) !== false || $user->canOwnStage($stage));
                if ($isJobOwner || in_array($stage, [1, 11, 13, 15])) {
                    $isAssigned = true;
                    if ($stage === 1) $actionRequired = 'Lengkapi data PO / SPK dan submit ke Admin.';
                    elseif ($stage === 11) $actionRequired = 'Lakukan follow-up penagihan ke klien.';
                    elseif ($stage === 13) $actionRequired = 'Input aktualisasi unit hasil inspeksi lapangan.';
                    elseif ($stage === 15) $actionRequired = 'Kirim dokumen SUKET asli ke klien & input nomor resi.';
                }
            }

            // 5. ADMIN DOKUMEN & RU
            elseif ($role === 'admin') {
                if (in_array($stage, [2, 3, 7, 8, 9])) {
                    $isAssigned = true;
                    if ($stage === 2) $actionRequired = 'Verifikasi kelengkapan dokumen teknis.';
                    elseif ($stage === 3) $actionRequired = 'Tentukan jadwal inspeksi & buat Surat Tugas.';
                    elseif ($stage === 7) $actionRequired = 'Serahkan bundel dokumen ke Disnaker.';
                    elseif ($stage === 8) $actionRequired = 'Pantau perkembangan proses pemeriksaan Disnaker.';
                    elseif ($stage === 9) $actionRequired = 'Ambil dan input dokumen SUKET resmi.';
                }
            }

            // 6. MANAGER & SUPERADMIN (Executive Overview of All Stages & Bottlenecks)
            elseif (in_array($role, ['manager', 'superadmin'])) {
                $isAssigned = true;
                $actionRequired = 'Pengawasan manajerial: saat ini di tahap ' . (self::$stageNames[$stage] ?? "Stage {$stage}");
            }

            if ($isAssigned) {
                // SLA computation
                $slaDays = self::$stageSlas[$stage] ?? null;
                $daysElapsed = 0;
                $isOverdue = false;

                if ($job->stage_started_at) {
                    $started = Carbon::parse($job->stage_started_at);
                    $daysElapsed = max(0, (int) $started->diffInDays(now()));

                    // Custom Stage 8 Disnaker SLA calculation
                    if ($stage === 8 && $job->tgl_doc_submitted_disnaker) {
                        $disnakerStart = Carbon::parse($job->tgl_doc_submitted_disnaker);
                        $daysElapsed = max(0, (int) $disnakerStart->diffInDays(now()));
                    }

                    if ($slaDays !== null && $daysElapsed > $slaDays) {
                        $isOverdue = true;
                    }
                }

                $tasks[] = [
                    'job_id'          => $job->id,
                    'job_no'          => $job->job_no ?? "JOB-{$job->id}",
                    'client_name'     => $job->client_name ?? 'Klien',
                    'stage'           => $stage,
                    'stage_name'      => self::$stageNames[$stage] ?? "Stage {$stage}",
                    'days_elapsed'    => $daysElapsed,
                    'sla_days'        => $slaDays,
                    'is_overdue'      => $isOverdue,
                    'action_required' => $actionRequired,
                ];
            }
        }

        return $tasks;
    }

    /**
     * Build the structured digest payload for email rendering.
     * Returns null if user has 0 pending tasks (smart suppression).
     */
    public static function buildDigestPayload(User $user, string $edition = 'morning'): ?array
    {
        $tasks = self::getUserTasks($user);

        // Smart suppression: if 0 tasks, do not send email
        if (empty($tasks)) {
            return null;
        }

        $overdueCount = count(array_filter($tasks, fn($t) => $t['is_overdue']));
        $editionTitle = ($edition === 'afternoon') 
            ? 'Rekap Pekerjaan Tertunda' 
            : 'Agenda Pekerjaan Hari Ini';

        $greeting = ($edition === 'afternoon')
            ? 'Selamat sore'
            : 'Selamat pagi';

        return [
            'user'          => $user,
            'edition'       => $edition,
            'edition_title' => $editionTitle,
            'greeting'      => $greeting,
            'date_formatted'=> now()->translatedFormat('l, d F Y'),
            'tasks'         => $tasks,
            'total_tasks'   => count($tasks),
            'overdue_count' => $overdueCount,
            'base_url'      => config('app.url', 'https://monitor.deltaindo.co.id'),
        ];
    }
}
