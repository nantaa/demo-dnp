/**
 * DNP Monitor v3 — Core Domain Workflow Engine
 * Implements business rules specified in Laporan_Revisi_Sistem_DNP_Monitor_tahap_1_Rev6.md
 */

/**
 * Validates Stage 1 requirements (PO/SPK).
 * - termin_pembayaran must be 'DP' or 'FULL'
 * - no_seri is mandatory for 'Listrik' and 'Kebakaran' categories
 */
export function validateStage1(job) {
  if (!job.termin_pembayaran || !['DP', 'FULL'].includes(job.termin_pembayaran)) {
    return {
      valid: false,
      error: 'Opsi termin_pembayaran (DP atau FULL) wajib dipilih.',
    };
  }

  if (Array.isArray(job.units)) {
    for (const unit of job.units) {
      const isElectricOrFire = ['Listrik', 'Kebakaran'].includes(unit.kategori);
      if (isElectricOrFire && (!unit.no_seri || unit.no_seri.trim() === '')) {
        return {
          valid: false,
          error: `no_seri wajib diisi untuk kategori ${unit.kategori}.`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Masks commercial and pricing information for unauthorized roles (e.g. Admin).
 */
export function maskSensitiveData(data, role) {
  if (role === 'admin') {
    return {
      ...data,
      nilai: null,
      total_invoice_amount: null,
      payment_amount_received: null,
    };
  }
  return data;
}

/**
 * Hard gate check for Stage 3 Surat Tugas issuance.
 * Surat Tugas blocked if termin is DP and DP is not paid.
 */
export function canIssueSuratTugas(job) {
  if (job.termin_pembayaran === 'DP' && !job.dp_paid) {
    return {
      canIssue: false,
      reason: 'Surat Tugas tidak bisa diterbitkan karena DP belum lunas.',
    };
  }
  return { canIssue: true };
}

/**
 * Records Stage 4 RU results per unit, splitting Sesuai into Stage 5 and Tidak Sesuai into Stage 4b.
 * Generates an InspectionEvent and 1:1 BAP covering all units in the session.
 */
export function recordInspectionRU({ jobId, inspectorId, tanggal, unitResults = [] }) {
  const timestamp = Date.now();
  const inspectionEvent = {
    id: `insp-${timestamp}`,
    job_id: jobId,
    inspector_id: inspectorId,
    tanggal_pelaksanaan: tanggal,
  };

  const bap = {
    id: `bap-${timestamp}`,
    inspection_id: inspectionEvent.id,
    tanggal_terbit: tanggal,
  };

  const updatedUnits = unitResults.map((u) => {
    const isSesuai = u.result === 'Sesuai';
    return {
      ...u,
      ru_result: u.result,
      current_stage: isSesuai ? 5 : '4b',
      unit_status: isSesuai ? 'InProgress' : 'ReworkLoop',
      inspection_id: inspectionEvent.id,
    };
  });

  return { updatedUnits, inspectionEvent, bap };
}

/**
 * Calculates multi-tier escalation level for units stuck in the Stage 4b–4c–4d loop (Infinite Ceiling).
 * Level 1: > 7 days -> Warning badge (Yellow), notify Marketing & Admin
 * Level 2: > 14 days -> Escalation badge (Red), notify Manager
 * Level 3: > 28 days -> Recurring escalation badge (Red), notify Manager
 */
export function calculateEscalationLevel(daysInLoop) {
  if (daysInLoop > 28) {
    return {
      level: 3,
      badge: 'red',
      recurring: true,
      notifyRoles: ['manager'],
      message: 'Eskalasi berulang: Unit tertahan lebih dari 28 hari di rantai rework.',
    };
  }

  if (daysInLoop > 14) {
    return {
      level: 2,
      badge: 'red',
      recurring: false,
      notifyRoles: ['manager'],
      message: 'Perlu Keputusan Manager: Unit tertahan lebih dari 14 hari di rantai rework.',
    };
  }

  if (daysInLoop > 7) {
    return {
      level: 1,
      badge: 'yellow',
      recurring: false,
      notifyRoles: ['marketing', 'admin'],
      message: 'Peringatan: Unit tertahan lebih dari 7 hari di rantai reschedule.',
    };
  }

  return {
    level: 0,
    badge: 'normal',
    recurring: false,
    notifyRoles: [],
    message: 'On Track',
  };
}

/**
 * Records three Stage 5 tracking dates per LHPP and computes sub-phase lead times.
 */
export function recordLHPPTracking({
  unitId,
  tanggal_data_teknis_diserahkan,
  tanggal_mulai_pengerjaan,
  tanggal_selesai,
}) {
  const d1 = new Date(tanggal_data_teknis_diserahkan);
  const d2 = new Date(tanggal_mulai_pengerjaan);
  const d3 = new Date(tanggal_selesai);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const queue_days = Math.max(0, Math.round((d2 - d1) / MS_PER_DAY));
  const drafting_days = Math.max(0, Math.round((d3 - d2) / MS_PER_DAY));

  return {
    unit_id: unitId,
    tanggal_data_teknis_diserahkan,
    tanggal_mulai_pengerjaan,
    tanggal_selesai,
    queue_days,
    drafting_days,
    status: 'Selesai',
  };
}

/**
 * Evaluates Stage 6 Manager Review.
 * Decision 'Approve' advances LHPP to Stage 7.
 * Decision 'Reject-to-Revise' loops LHPP back to Stage 5 for revision.
 */
export function evaluateManagerReview({ decision, notes = '' }) {
  if (decision === 'Approve') {
    return {
      status: 'Approved',
      next_stage: 7,
      notes,
    };
  }

  return {
    status: 'Rejected-Revisi',
    next_stage: 5,
    notes,
  };
}

/**
 * Creates a Batch grouping for Stage 7–11b.
 * Enforces rule: only units with Approved LHPP can be grouped into a Batch.
 */
export function createBatchFromApprovedUnits({ jobId, sequence = 1, selectedUnitIds = [], allUnits = [] }) {
  const selectedUnits = allUnits.filter((u) => selectedUnitIds.includes(u.id));
  const unapproved = selectedUnits.filter((u) => u.lhpp_status !== 'Approved');

  if (unapproved.length > 0) {
    return {
      valid: false,
      error: 'hanya unit dengan LHPP Approved yang dapat dimasukkan ke Batch.',
    };
  }

  return {
    valid: true,
    batch: {
      id: `batch-${jobId}-${sequence}-${Date.now()}`,
      job_id: jobId,
      batch_sequence: sequence,
      units: selectedUnitIds,
      current_stage: 7,
      status_tag: 'On Track',
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Computes SUKET processing duration in calendar days.
 */
export function calculateSuketDuration(tglInput, tglTerbit) {
  const dInput = new Date(tglInput);
  const dTerbit = new Date(tglTerbit);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((dTerbit - dInput) / MS_PER_DAY));
}

/**
 * Evaluates Stage 11c Payment Verification and Gateway 'Status Lunas?'.
 * Placed immediately after Stage 11 (Penagihan).
 * - Verified -> unlocks Stage 11b (SUKET delivery)
 * - Partial / Pending -> loops Job back to Stage 11, increments retry_count
 */
export function evaluatePaymentVerification({ jobId, status, currentRetryCount = 0 }) {
  if (status === 'Verified') {
    return {
      job_id: jobId,
      status: 'Verified',
      canDeliverSuket: true,
      next_stage: '11b',
      retry_count: currentRetryCount,
    };
  }

  return {
    job_id: jobId,
    status: status, // 'Partial' or 'Pending'
    canDeliverSuket: false,
    next_stage: 11,
    retry_count: currentRetryCount + 1,
    message: 'Pembayaran belum lunas. Job dikembalikan ke Stage 11 untuk ditagih ulang.',
  };
}

/**
 * Evaluates Stage 11c Payment Verification payload (v5-2-2).
 */
export function evaluateStage11cPaymentVerification(job, { status, amount_received, bank_reference, notes, verified_by }) {
  const currentRetry = job.payment_retry_count || 0;
  if (status === 'Verified' || status === 'Lunas') {
    return {
      job_id: job.id,
      status: 'Verified',
      nextStage: '11b',
      is_unlocked_for_suket: true,
      payment_retry_count: currentRetry,
      notes: notes || '',
      verified_by: verified_by || 'Finance',
      verified_at: new Date().toISOString(),
      bank_reference,
      amount_received,
    };
  }

  return {
    job_id: job.id,
    status: status, // 'Partial' or 'Pending'
    nextStage: '11',
    is_unlocked_for_suket: false,
    payment_retry_count: currentRetry + 1,
    notes: notes || '',
    verified_by: verified_by || 'Finance',
    verified_at: new Date().toISOString(),
    bank_reference,
    amount_received,
  };
}

/**
 * Validates whether a Batch of SUKET can be delivered to client.
 * Requires Stage 11c payment verification status = Verified.
 */
export function canDeliverSuketBatch(job) {
  const latestVerification = job.latest_payment_verification || job.latestPaymentVerification;
  if (!latestVerification || (latestVerification.status !== 'Verified' && latestVerification.status !== 'Lunas')) {
    return {
      allowed: false,
      message: 'Pembayaran belum diverifikasi Finance (Status harus Verified / Lunas sebelum SUKET dikirim).',
    };
  }
  return { allowed: true };
}

/**
 * Calculates LHPP sub-phase lead times from 3 milestone dates.
 */
export function calculateLHPPLeadTimes({ tanggal_data_teknis_diserahkan, tanggal_mulai_pengerjaan, tanggal_selesai }) {
  const d1 = new Date(tanggal_data_teknis_diserahkan);
  const d2 = new Date(tanggal_mulai_pengerjaan);
  const d3 = new Date(tanggal_selesai);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const queue_days = Math.max(0, Math.round((d2 - d1) / MS_PER_DAY));
  const drafting_days = Math.max(0, Math.round((d3 - d2) / MS_PER_DAY));
  const total_days = Math.max(0, Math.round((d3 - d1) / MS_PER_DAY));

  return { queue_days, drafting_days, total_days };
}

/**
 * Calculates Batch SUKET duration in calendar days.
 */
export function calculateBatchSuketDuration({ tanggal_input_suket, tanggal_terbit_suket }) {
  const dInput = new Date(tanggal_input_suket);
  const dTerbit = new Date(tanggal_terbit_suket);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((dTerbit - dInput) / MS_PER_DAY));
}

/**
 * Checks if a unit can be assigned to a Batch (must have Approved LHPP).
 */
export function canAssignUnitToBatch(unit) {
  const finalLhpp = unit.final_lhpp || unit.finalLhpp;
  if (!finalLhpp || finalLhpp.status !== 'Approved') {
    return {
      allowed: false,
      message: `Unit ${unit.nama_alat} tidak dapat masuk Batch — LHPP belum berstatus Approved.`,
    };
  }
  if (unit.batch_id) {
    return {
      allowed: false,
      message: `Unit ${unit.nama_alat} sudah ada di Batch lain.`,
    };
  }
  return { allowed: true };
}

/**
 * Computes Job-level rollup status based on all constituent units.
 * Eliminates manual 'Merge' stage.
 */
export function calculateJobRollupStatus(units = [], isPaymentVerified = false) {
  const total = units.length;
  if (total === 0) {
    return {
      job_status: 'Open',
      closed_unit_count: 0,
      total_unit_count: 0,
      label: '0/0 Unit',
    };
  }

  const closedCount = units.filter((u) => u.unit_status === 'Closed').length;

  if (closedCount === total && isPaymentVerified) {
    return {
      job_status: 'Closed',
      closed_unit_count: closedCount,
      total_unit_count: total,
      label: `Closed (${closedCount}/${total} Unit Selesai)`,
    };
  }

  if (closedCount > 0 || units.some((u) => u.unit_status === 'ReworkLoop')) {
    return {
      job_status: 'Partial',
      closed_unit_count: closedCount,
      total_unit_count: total,
      label: `${closedCount}/${total} Unit Closed`,
    };
  }

  return {
    job_status: 'Open',
    closed_unit_count: closedCount,
    total_unit_count: total,
    label: `${closedCount}/${total} Unit Selesai`,
  };
}

export const computeAggregateJobStatus = calculateJobRollupStatus;

