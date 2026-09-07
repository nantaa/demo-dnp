<?php

namespace App\Services;

use App\Models\Job;
use App\Models\Unit;
use App\Models\PaymentVerification;

/**
 * WorkflowService — Central gate-keeper for DNP Monitor v3 stage transitions.
 *
 * Key responsibilities:
 *  - Enforce hard gates (DP paid before Stage 4, Payment verified before Stage 11b)
 *  - Handle Payment Verification retry loop (Stage 11 <-> 11c <-> Gateway)
 *  - Compute Job status rollup from Unit statuses
 *  - Validate Unit eligibility for Batch assignment
 */
class WorkflowService
{
    // DP gate: Stage 3 → 4 requires DP paid when termin = DP
    public static function canIssueSuratTugas(Job $job): array
    {
        if ($job->termin_pembayaran === 'DP' && !$job->dp_paid) {
            return [
                'allowed' => false,
                'field'   => 'dp_paid',
                'message' => 'DP belum lunas. Surat Tugas tidak bisa diterbitkan sebelum DP dibayarkan.',
            ];
        }
        return ['allowed' => true];
    }

    // Payment verification gate: Stage 11b requires Verified status
    public static function canDeliverSuket(Job $job): array
    {
        $latest = $job->latestPaymentVerification;
        if (!$latest || $latest->status !== 'Verified') {
            return [
                'allowed' => false,
                'field'   => 'payment_status',
                'message' => 'Pembayaran belum diverifikasi Finance. SUKET tidak dapat dikirim sebelum status Verified.',
            ];
        }
        return ['allowed' => true];
    }

    // Check if a Unit is eligible to be added to a Batch
    public static function canAddUnitToBatch(Unit $unit): array
    {
        $finalLhpp = $unit->finalLhpp;
        if (!$finalLhpp || $finalLhpp->status !== 'Approved') {
            return [
                'allowed' => false,
                'message' => "Unit {$unit->nama_alat} tidak dapat masuk Batch — LHPP belum berstatus Approved.",
            ];
        }
        if ($unit->batch_id !== null) {
            return [
                'allowed' => false,
                'message' => "Unit {$unit->nama_alat} sudah ada di Batch lain.",
            ];
        }
        return ['allowed' => true];
    }

    // Compute job_status from unit rollup (Open / Partial / Closed)
    public static function computeJobStatus(Job $job): string
    {
        $units = $job->units()->get();
        if ($units->isEmpty()) {
            return 'Open';
        }
        $closed = $units->where('unit_status', 'Closed')->count();
        if ($closed === 0) {
            return 'Open';
        }
        if ($closed === $units->count()) {
            return 'Closed';
        }
        return 'Partial';
    }

    // Get escalation level for a unit stuck in rework loop
    public static function getEscalationLevel(Unit $unit): int
    {
        if (!$unit->rework_started_at) {
            return 0;
        }
        $days = $unit->rework_started_at->diffInDays(now());
        if ($days >= 14) {
            return 2; // Manager escalation
        }
        if ($days >= 7) {
            return 1; // Marketing + Admin reminder
        }
        return 0; // No escalation yet
    }
}
