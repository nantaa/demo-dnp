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
                $query->whereIn('role', ['inspektur', 'inspector', 'manager'])
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

        // ── Pre-load klien experience per inspector (completed & archived jobs for same klien) ─
        $klienExpCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->where('dnp_jobs.klien', $targetJob->klien)
            ->whereIn('dnp_jobs.stage', [12, 16]) // stage 12 = completed, stage 16 = archived
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');

        // ── Pre-load pesawat experience per inspector (completed/archived, same pesawat type) ─
        $pesawatKeyword = $this->extractPesawatKeyword($targetJob->pesawat);
        $pesawatExpQuery = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->whereIn('dnp_jobs.stage', [12, 16]);

        if (!empty($pesawatKeyword)) {
            $pesawatExpQuery->where('dnp_jobs.pesawat', 'LIKE', "%{$pesawatKeyword}%");
        }

        $pesawatExpCounts = $pesawatExpQuery
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
            $isMatch = $this->matchesSpecialization($profile->spesialisasi ?? [], $targetJob->pesawat);

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
            $isOverloaded = ($activeJobs >= self::OVERLOAD_THRESHOLD);
            if ($isOverloaded) {
                $score -= 10;
                $bonuses[] = "-10 Overload ({$activeJobs} job aktif)";
            }

            $results[] = [
                'user'          => $inspector,
                'profile'       => $profile,
                'score'         => $score,
                'details'       => $details,
                'bonuses'       => $bonuses,
                'statuses'      => $isOverloaded ? ['Overload'] : ['Available'],
                'is_overloaded' => $isOverloaded,
                'active_jobs'   => $activeJobs,
                'klien_exp'     => $klienExp,
                'pesawat_exp'   => $pesawatExp,
            ];
        }

        // Sort by score descending
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

        return [
            'recommended' => $results,
            'eliminated'  => $eliminated,
        ];
    }

    /**
     * Clean and extract primary keyword from pesawat name.
     */
    public function extractPesawatKeyword(?string $pesawat): string
    {
        if (empty($pesawat)) {
            return '';
        }

        $cleaned = trim(preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $pesawat));
        $words = preg_split('/\s+/', $cleaned, -1, PREG_SPLIT_NO_EMPTY);

        if (empty($words)) {
            return '';
        }

        $genericPrefixes = ['pesawat', 'instalasi', 'alat', 'unit'];
        if (count($words) > 1 && in_array(strtolower($words[0]), $genericPrefixes)) {
            return $words[1];
        }

        return $words[0];
    }

    /**
     * Match inspector specialization against target job pesawat using standard K3 domains.
     */
    public function matchesSpecialization($profileSpecs, ?string $targetPesawat): bool
    {
        if (empty($profileSpecs) || empty($targetPesawat)) {
            return false;
        }

        $specs = is_array($profileSpecs)
            ? $profileSpecs
            : (json_decode($profileSpecs, true) ?? []);

        $domainMap = [
            'pubt'     => ['uap', 'boiler', 'bejana', 'ketel', 'tangki timbun', 'pubt'],
            'paa'      => ['angkat', 'angkut', 'crane', 'forklift', 'hoist', 'excavator', 'gondola', 'paa'],
            'papa'     => ['petir', 'penyalur petir', 'papa'],
            'listrik'  => ['listrik', 'instalasi listrik', 'genset', 'panel', 'transformator', 'trafo'],
            'damkar'   => ['damkar', 'kebakaran', 'fire', 'sprinkler', 'hydrant', 'apar'],
            'ptp'      => ['ptp', 'tenaga', 'produksi', 'perkakas', 'mesin'],
            'elevator' => ['elevator', 'lift', 'eskalator'],
        ];

        foreach ((array)$specs as $spec) {
            if (!$spec) continue;
            $specTrimmed = trim((string)$spec);
            $specLower = strtolower($specTrimmed);

            // Direct substring match
            if (stripos($targetPesawat, $specTrimmed) !== false || stripos($specTrimmed, $targetPesawat) !== false) {
                return true;
            }

            // Domain acronym mapping (e.g. spec is PUBT and target contains Boiler or Bejana)
            foreach ($domainMap as $domain => $keywords) {
                $isSpecInDomain = ($specLower === $domain) || in_array($specLower, $keywords);
                if ($isSpecInDomain) {
                    foreach ($keywords as $kw) {
                        if (stripos($targetPesawat, $kw) !== false) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }
}
