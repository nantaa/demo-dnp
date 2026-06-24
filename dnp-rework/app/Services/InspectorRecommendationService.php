<?php

namespace App\Services;

use App\Models\User;
use App\Models\Job;
use Carbon\Carbon;

class InspectorRecommendationService
{
    public function getRecommendations(Job $targetJob)
    {
        $inspectors = User::where('role', 'inspektur')
            ->with(['inspectorProfile'])
            ->get();

        $results = [];
        $eliminated = [];

        foreach ($inspectors as $inspector) {
            $profile = $inspector->inspectorProfile;
            
            if (!$profile) {
                continue;
            }

            // Hard Filters
            if (!$profile->active) {
                $eliminated[] = ['user' => $inspector, 'reason' => 'Status Inactive'];
                continue;
            }
            if ($profile->skp_expired_at && $profile->skp_expired_at->isPast()) {
                $eliminated[] = ['user' => $inspector, 'reason' => 'SKP Expired'];
                continue;
            }

            // Pesawat mapping simplified (e.g. Instalasi Listrik -> Listrik)
            $isMatch = false;
            foreach ((array)$profile->spesialisasi as $spec) {
                if (stripos($targetJob->pesawat, $spec) !== false) {
                    $isMatch = true;
                    break;
                }
            }

            if (!$isMatch) {
                $eliminated[] = [
                    'user' => $inspector, 
                    'reason' => 'Spesialisasi tidak sesuai (Butuh: ' . $targetJob->pesawat . ')'
                ];
                continue;
            }

            // Score Calculation
            $score = 0;
            $details = [];

            // 1. Spesialisasi (30)
            $score += 30; // Passed hard filter
            $details['Spesialisasi'] = '30/30';

            // 2. Workload (25)
            // Mocking active jobs for now
            $activeJobs = rand(0, 5); 
            $workloadScore = max(0, 25 - ($activeJobs * 5));
            $score += $workloadScore;
            $details['Workload'] = "$workloadScore/25";

            // 3. Pengalaman Klien (15)
            $klienExp = rand(0, 3);
            $klienScore = min(15, $klienExp * 5);
            $score += $klienScore;
            $details['Pengalaman Klien'] = "$klienScore/15";

            // 4. Pengalaman Pesawat (15)
            $pesawatExp = rand(1, 10);
            $pesawatScore = min(15, $pesawatExp * 2);
            $score += $pesawatScore;
            $details['Pengalaman Pesawat'] = "$pesawatScore/15";

            // 5. Availability (15)
            $availScore = 15; // Assume available
            $score += $availScore;
            $details['Availability'] = "$availScore/15";

            // Bonuses
            $bonuses = [];
            if ($profile->skp_expired_at && $profile->skp_expired_at->diffInDays(now()) > 365) {
                $score += 5;
                $bonuses[] = '+5 SKP >1 thn';
            }

            if (stripos($targetJob->lokasi, $profile->domisili) !== false) {
                $score += 5;
                $bonuses[] = '+5 Domisili';
            }

            $isCritical = stripos($targetJob->pesawat, 'Boiler') !== false || stripos($targetJob->pesawat, 'PV') !== false;
            
            if ($isCritical && $profile->senior_level >= 3) {
                $score += 10;
                $bonuses[] = '+10 Senior Critical';
            }
            if ($isCritical && $profile->senior_level < 3) {
                $score -= 5;
                $bonuses[] = '-5 Junior Critical';
            }
            if ($activeJobs >= 4) {
                $score -= 10;
                $bonuses[] = '-10 Overload';
            }

            $results[] = [
                'user' => $inspector,
                'profile' => $profile,
                'score' => $score,
                'details' => $details,
                'bonuses' => $bonuses,
                'active_jobs' => $activeJobs,
                'klien_exp' => $klienExp,
                'pesawat_exp' => $pesawatExp,
            ];
        }

        // Sort by score desc
        usort($results, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return [
            'recommended' => $results,
            'eliminated' => $eliminated,
        ];
    }
}
