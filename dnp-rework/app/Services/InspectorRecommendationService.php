<?php

namespace App\Services;

use App\Models\User;
use App\Models\Job;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InspectorRecommendationService
{
    // Stages that count as "active" work for an inspector
    const ACTIVE_STAGES = [3, 4, 5, 6, 7, 8, 9, 10, 11];
    // Max concurrent jobs before overload penalty kicks in
    const OVERLOAD_THRESHOLD = 4;

    public function getRecommendations(Job $targetJob)
    {
        $inspectors = User::where('name', 'NOT LIKE', '%Diba Aini%')
            ->where(function ($query) {
                $query->whereIn('role', ['inspektur', 'manager'])
                      ->orWhereHas('inspectorProfile');
            })
            ->with(['inspectorProfile'])
            ->get();

        // ── Pre-load active job counts for ALL inspectors in one query ────────
        // Counts jobs in active stages where the inspector is assigned
        $activeJobCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->whereIn('dnp_jobs.stage', self::ACTIVE_STAGES)
            ->where('dnp_jobs.id', '!=', $targetJob->id) // exclude current job
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');

        // ── Pre-load klien experience per inspector (completed jobs for same klien) ─
        $klienExpCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->where('dnp_jobs.klien', $targetJob->klien)
            ->where('dnp_jobs.stage', 12) // stage 12 = closed/completed
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');

        // ── Pre-load pesawat experience per inspector (completed, same pesawat type) ─
        // Match on the first word of pesawat (e.g. "Boiler", "Elevator", "PAA")
        $pesawatKeyword = explode(' ', trim($targetJob->pesawat))[0];
        $pesawatExpCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->where('dnp_jobs.pesawat', 'LIKE', "%{$pesawatKeyword}%")
            ->where('dnp_jobs.stage', 12)
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');

        // ─────────────────────────────────────────────────────────────────────
        $results   = [];
        $eliminated = [];

        foreach ($inspectors as $inspector) {
            if (stripos($inspector->name, 'Diba Aini') !== false) {
                continue;
            }

            $profile = $inspector->inspectorProfile;

            if (!$profile) {
                $profile = (object)[
                    'active'         => true,
                    'skp_expired_at' => null,
                    'spesialisasi'   => [],
                    'domisili'       => 'Bekasi',
                    'senior_level'   => 1,
                    'subrole'        => 'tenaga_ahli',
                ];
            } else {
                if (empty($profile->subrole)) {
                    $profile->subrole = 'tenaga_ahli';
                }
            }

            // ── Hard Filters ─────────────────────────────────────────────────
            if (!$profile->active) {
                $eliminated[] = ['user' => $inspector, 'reason' => 'Status Inactive'];
                continue;
            }
            if ($profile->skp_expired_at && $profile->skp_expired_at->isPast()) {
                $eliminated[] = ['user' => $inspector, 'reason' => 'SKP Expired'];
                continue;
            }

            // ── Specialisation match ──────────────────────────────────────────
            $isMatch = false;
            if (!empty($profile->spesialisasi)) {
                $specs = is_array($profile->spesialisasi)
                    ? $profile->spesialisasi
                    : json_decode($profile->spesialisasi, true) ?? [];
                foreach ((array)$specs as $spec) {
                    if ($spec && (
                        stripos($targetJob->pesawat, $spec) !== false ||
                        stripos($spec, $targetJob->pesawat) !== false
                    )) {
                        $isMatch = true;
                        break;
                    }
                }
            }

            // ── Real data lookups ─────────────────────────────────────────────
            $activeJobs = (int)($activeJobCounts[$inspector->id] ?? 0);
            $klienExp   = (int)($klienExpCounts[$inspector->id]  ?? 0);
            $pesawatExp = (int)($pesawatExpCounts[$inspector->id] ?? 0);

            // ── Score Calculation ─────────────────────────────────────────────
            $score   = 0;
            $details = [];

            // 1. Spesialisasi (30)
            if ($isMatch) {
                $score += 30;
                $details['Spesialisasi'] = '30/30';
            } else {
                $details['Spesialisasi'] = '0/30';
            }

            // 2. Workload (25) — fewer active jobs = higher score
            $workloadScore = max(0, 25 - ($activeJobs * 5));
            $score += $workloadScore;
            $details['Workload'] = "{$workloadScore}/25";

            // 3. Pengalaman Klien (15) — capped at 15
            $klienScore = min(15, $klienExp * 5);
            $score += $klienScore;
            $details['Pengalaman Klien'] = "{$klienScore}/15";

            // 4. Pengalaman Pesawat (15) — capped at 15
            $pesawatScore = min(15, $pesawatExp * 2);
            $score += $pesawatScore;
            $details['Pengalaman Pesawat'] = "{$pesawatScore}/15";

            // 5. Availability (15) — always 15 if not overloaded
            $availScore = ($activeJobs >= self::OVERLOAD_THRESHOLD) ? 0 : 15;
            $score += $availScore;
            $details['Availability'] = "{$availScore}/15";

            // ── Bonuses / Penalties ───────────────────────────────────────────
            $bonuses = [];

            // Long-valid SKP bonus
            if ($profile->skp_expired_at && $profile->skp_expired_at->isFuture()
                && $profile->skp_expired_at->diffInDays(now()) > 365) {
                $score += 5;
                $bonuses[] = '+5 SKP >1 thn';
            }

            // Domisili match bonus
            if ($profile->domisili && stripos($targetJob->lokasi, $profile->domisili) !== false) {
                $score += 5;
                $bonuses[] = '+5 Domisili';
            }

            // Critical pesawat modifier
            $isCritical = stripos($targetJob->pesawat, 'Boiler') !== false
                       || stripos($targetJob->pesawat, 'PV')     !== false;

            if ($isCritical && $profile->senior_level >= 3) {
                $score += 10;
                $bonuses[] = '+10 Senior Critical';
            }
            if ($isCritical && $profile->senior_level < 3) {
                $score -= 5;
                $bonuses[] = '-5 Junior Critical';
            }

            // Overload penalty
            if ($activeJobs >= self::OVERLOAD_THRESHOLD) {
                $score -= 10;
                $bonuses[] = "-10 Overload ({$activeJobs} job aktif)";
            }

            $results[] = [
                'user'        => $inspector,
                'profile'     => $profile,
                'score'       => $score,
                'details'     => $details,
                'bonuses'     => $bonuses,
                'active_jobs' => $activeJobs,
                'klien_exp'   => $klienExp,
                'pesawat_exp' => $pesawatExp,
            ];
        }

        // Sort by score descending
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

        return [
            'recommended' => $results,
            'eliminated'  => $eliminated,
        ];
    }
}
