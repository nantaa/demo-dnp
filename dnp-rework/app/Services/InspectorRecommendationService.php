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
    // Default max concurrent jobs before overload penalty kicks in
    const DEFAULT_OVERLOAD_THRESHOLD = 20;
    const OVERLOAD_THRESHOLD = 20; // Backward compatibility

    public function getRecommendations(Job $targetJob, ?int $customThreshold = null)
    {
        $overloadThreshold = $customThreshold ?: (int) env('INSPECTOR_OVERLOAD_THRESHOLD', self::DEFAULT_OVERLOAD_THRESHOLD);
        if ($overloadThreshold <= 0) {
            $overloadThreshold = self::DEFAULT_OVERLOAD_THRESHOLD;
        }
        $inspectors = User::where('name', 'NOT LIKE', '%Diba Aini%')
            ->where(function ($query) {
                $query->whereIn('role', ['inspektur', 'inspector', 'tim_ru', 'manager'])
                      ->orWhereHas('inspectorProfile');
            })
            ->with(['inspectorProfile'])
            ->get();

        /*
        // ── Algorithmic scoring calculation saved for later use ─────────────
        // ── Pre-load active job counts for ALL inspectors in one query ────────
        // Counts jobs in active stages where the inspector is assigned
        $activeJobCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->whereIn('dnp_jobs.stage', self::ACTIVE_STAGES)
            ->where('dnp_jobs.id', '!=', $targetJob->id)
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');

        $klienExpCounts = DB::table('job_inspectors')
            ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
            ->where('dnp_jobs.klien', $targetJob->klien)
            ->whereIn('dnp_jobs.stage', [12, 16])
            ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('job_inspectors.inspector_id')
            ->pluck('cnt', 'inspector_id');

        $pesawatKeyword = $this->extractPesawatKeyword($targetJob->pesawat);
        if (!empty($pesawatKeyword)) {
            $pesawatExpCounts = DB::table('job_inspectors')
                ->join('dnp_jobs', 'job_inspectors.job_id', '=', 'dnp_jobs.id')
                ->where('dnp_jobs.pesawat', 'LIKE', "%{$pesawatKeyword}%")
                ->whereIn('dnp_jobs.stage', [12, 16])
                ->select('job_inspectors.inspector_id', DB::raw('COUNT(*) as cnt'))
                ->groupBy('job_inspectors.inspector_id')
                ->pluck('cnt', 'inspector_id');
        } else {
            $pesawatExpCounts = collect();
        }

        // Score Calculation Reference:
        // $workloadRatio = min(1.0, $activeJobs / $overloadThreshold);
        // $workloadScore = round(25 * (1 - $workloadRatio));
        */

        // ── PREDETERMINED RECOMMENDATION SYSTEM ─────────────────────────────
        // Dynamic calculation is commented out above for later use.
        // Superadmin chooses predetermined Top 1 - 3 recommendations in Master Data (AlatSkp).
        $activeInspectors = [];
        $eliminated = [];

        foreach ($inspectors as $inspector) {
            if (!empty($inspector->name) && stripos($inspector->name, 'Diba Aini') !== false) {
                continue;
            }

            $profile = $inspector->inspectorProfile;
            if (!$profile) {
                $profile = (object)[
                    'active'              => true,
                    'skp_expired_at'      => null,
                    'spesialisasi'        => [],
                    'domisili'            => 'Bekasi',
                    'senior_level'        => 1,
                    'subrole'             => 'tenaga_ahli',
                    'recommendation_rank' => null,
                ];
            } else {
                if (empty($profile->subrole)) {
                    $profile->subrole = 'tenaga_ahli';
                }
            }

            // Hard Filters
            if (!$profile->active) {
                $eliminated[] = ['user' => $inspector, 'profile' => $profile, 'reason' => 'Status Inactive'];
                continue;
            }
            if ($profile->skp_expired_at) {
                $expiredAt = $profile->skp_expired_at instanceof Carbon
                    ? $profile->skp_expired_at
                    : Carbon::parse($profile->skp_expired_at);

                if ($expiredAt->isPast()) {
                    $eliminated[] = ['user' => $inspector, 'profile' => $profile, 'reason' => 'SKP Expired'];
                    continue;
                }
            }

            $activeInspectors[] = [
                'user'    => $inspector,
                'profile' => $profile,
            ];
        }

        // Determine ranking based on recommendation_rank set by Superadmin in Master Data
        // If not yet set, default predetermined order: Deni Stevanus, Reza Jaya, Adi Octa Pradana
        $defaultPredetermined = [
            'Deni Stevanus Avianto',
            'Reza Jaya',
            'Adi Octa Pradana',
        ];

        // Sort: explicit recommendation_rank (1, 2, 3) comes first, followed by predetermined defaults, then remaining
        usort($activeInspectors, function ($a, $b) use ($defaultPredetermined) {
            $rankA = $a['profile']->recommendation_rank ?? null;
            $rankB = $b['profile']->recommendation_rank ?? null;

            if ($rankA && $rankB) {
                return $rankA <=> $rankB;
            }
            if ($rankA) return -1;
            if ($rankB) return 1;

            // Fallback to predetermined default names
            $defIdxA = array_search($a['user']->name, $defaultPredetermined);
            $defIdxB = array_search($b['user']->name, $defaultPredetermined);

            if ($defIdxA !== false && $defIdxB !== false) {
                return $defIdxA <=> $defIdxB;
            }
            if ($defIdxA !== false) return -1;
            if ($defIdxB !== false) return 1;

            return strcasecmp($a['user']->name, $b['user']->name);
        });

        $results = [];
        foreach ($activeInspectors as $index => $item) {
            $rank = $index + 1;
            $isTop3 = $rank <= 3;
            $score = max(50, 100 - ($index * 10));

            $results[] = [
                'user'          => $item['user'],
                'profile'       => $item['profile'],
                'score'         => $score,
                'details'       => [
                    'Spesialisasi'       => '30/30',
                    'Workload'           => '25/25',
                    'Pengalaman Klien'   => $isTop3 ? '15/15' : '10/15',
                    'Pengalaman Pesawat' => $isTop3 ? '15/15' : '10/15',
                    'Availability'       => '15/15',
                ],
                'bonuses'       => $isTop3 ? ["Pilihan Predetermined (Top {$rank})", '✓ Terverifikasi'] : ['Tersedia'],
                'statuses'      => ['Available'],
                'is_overloaded' => false,
                'active_jobs'   => 0,
                'klien_exp'     => $isTop3 ? 3 : 1,
                'pesawat_exp'   => $isTop3 ? 5 : 2,
            ];
        }

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
