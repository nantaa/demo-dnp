/**
 * Stage Role Permission Matrix (RBAC).
 */
export const STAGE_ROLE_PERMISSIONS = {
  stage1_create: ['marketing', 'superadmin'],
  stage2_verify: ['admin', 'superadmin'],
  stage2_bypass: ['manager', 'kadiv', 'superadmin'],
  stage3_schedule: ['admin', 'superadmin'],
  stage4_inspection: ['inspektur', 'ahli_k3', 'tenaga_ahli', 'superadmin'],
  stage4b_actualize: ['marketing', 'superadmin'],
  stage4c_reschedule: ['admin', 'superadmin'],
  stage4d_reinspection: ['inspektur', 'ahli_k3', 'tenaga_ahli', 'superadmin'],
  stage5_draft: ['admin', 'superadmin'],
  stage6_review: ['manager', 'kadiv', 'superadmin'],
  stage7_dinas: ['admin', 'superadmin'],
  stage8_disnaker: ['admin', 'superadmin'],
  stage9_suket: ['admin', 'superadmin'],
  stage10_invoice: ['finance', 'superadmin'],
  invoice_revise: ['finance', 'superadmin'],
  stage11_collection: ['marketing', 'superadmin'],
  stage11c_verify: ['finance', 'superadmin'],
  stage11b_dispatch: ['marketing', 'superadmin'],
  stage12_reopen: ['manager', 'kadiv', 'superadmin'],
};

export function validateStageActionPermission(role, action, options = {}) {
  if (!role) {
    if (options.allowAnonymous) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Header identitas pengguna (x-user-role) wajib disertakan untuk aksi '${action}'.`,
    };
  }
  const normalizedRole = String(role).toLowerCase().trim();
  if (normalizedRole === 'superadmin') {
    return { allowed: true };
  }
  const allowedRoles = STAGE_ROLE_PERMISSIONS[action];
  if (!allowedRoles) {
    return { allowed: true };
  }
  if (allowedRoles.includes(normalizedRole)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Role '${role}' tidak memiliki hak akses untuk aksi '${action}'. Diperlukan salah satu dari: ${allowedRoles.join(', ')}.`,
  };
}

/**
 * Validates stage-to-stage transition permissions based on actor role and target stage.
 */
export function validateStageTransitionPermission(currentStage, targetStage, role) {
  if (!role) {
    return {
      allowed: false,
      reason: 'Header identitas pengguna (x-user-role) wajib disertakan untuk memindahkan stage.',
    };
  }
  const normRole = String(role).toLowerCase().trim();
  if (normRole === 'superadmin') {
    return { allowed: true };
  }

  const curr = Number(currentStage);
  const target = Number(targetStage);

  // Transition-specific overrides
  if (curr === 5 && target === 6) {
    // Submitting LHPP draft to QC Review: Admin only
    if (!['admin', 'superadmin'].includes(normRole)) {
      return { allowed: false, reason: `Hanya Admin atau Superadmin yang dapat mengajukan draf LHPP ke Stage 6 (Review QC). Role '${role}' ditolak.` };
    }
    return { allowed: true };
  }

  if (curr === 4 && target === 6) {
    // Technical finding / rusak from field to QC: Inspector or Admin/Superadmin
    if (!['admin', 'inspektur', 'ahli_k3', 'tenaga_ahli', 'superadmin'].includes(normRole)) {
      return { allowed: false, reason: `Hanya Inspektur atau Admin yang dapat memindahkan temuan lapangan ke Stage 6. Role '${role}' ditolak.` };
    }
    return { allowed: true };
  }

  if (target === 7) {
    // Review QC approval into Stage 7: Manager/Kadiv only
    if (!['manager', 'kadiv', 'superadmin'].includes(normRole)) {
      return { allowed: false, reason: `Hanya Manager Teknis atau Kadiv yang dapat menyetujui QC (Stage 6 -> 7). Role '${role}' ditolak.` };
    }
    return { allowed: true };
  }

  if ([2, 3, 4, 8, 9, 17].includes(target)) {
    const allowed = (target === 2) ? ['marketing', 'admin', 'superadmin'] : ['admin', 'superadmin'];
    if (!allowed.includes(normRole)) {
      return { allowed: false, reason: `Role '${role}' tidak memiliki wewenang untuk memindahkan job ke Stage ${target}.` };
    }
    return { allowed: true };
  }

  if (target === 10) {
    if (!['admin', 'finance', 'superadmin'].includes(normRole)) {
      return { allowed: false, reason: `Hanya Finance atau Admin yang dapat memindahkan job ke Stage 10. Role '${role}' ditolak.` };
    }
    return { allowed: true };
  }

  if (target === 11) {
    if (!['finance', 'marketing', 'superadmin'].includes(normRole)) {
      return { allowed: false, reason: `Hanya Finance atau Marketing yang dapat memindahkan job ke Stage 11. Role '${role}' ditolak.` };
    }
    return { allowed: true };
  }

  if (target === 12) {
    if (!['marketing', 'finance', 'superadmin'].includes(normRole)) {
      return { allowed: false, reason: `Hanya Marketing atau Finance yang dapat menutup Job (Stage 12). Role '${role}' ditolak.` };
    }
    return { allowed: true };
  }

  return { allowed: true };
}


/**
 * Deduplicates sequential or rapid double/triple logs to prevent clutter.
 */
export function deduplicateHistoryLogs(logs = []) {
  if (!Array.isArray(logs)) return [];
  const deduped = [];
  for (const entry of logs) {
    if (!entry) continue;
    const prev = deduped[deduped.length - 1];
    if (prev) {
      const sameStage = prev.stage === entry.stage;
      const sameAction = prev.action === entry.action;
      const sameBy = (prev.by || '') === (entry.by || '');
      let withinTimeWindow = false;
      if (prev.ts && entry.ts) {
        const diff = Math.abs(new Date(entry.ts).getTime() - new Date(prev.ts).getTime());
        if (diff < 5000) { // within 5 seconds
          withinTimeWindow = true;
        }
      }
      if (sameStage && sameAction && sameBy && (withinTimeWindow || !prev.ts || !entry.ts)) {
        continue; // skip duplicate log
      }
    }
    deduped.push(entry);
  }
  return deduped;
}

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

  if (job.termin_pembayaran === 'DP') {
    const hasDpAmount = job.dp_amount != null && job.dp_amount !== '' && Number(job.dp_amount) > 0;
    const hasDpPercentage = job.dp_percentage != null && job.dp_percentage !== '' && Number(job.dp_percentage) > 0;
    if (!hasDpAmount && !hasDpPercentage) {
      return {
        valid: false,
        error: 'Nominal atau persentase DP wajib diisi jika memilih skema termin DP.',
      };
    }
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
    const masked = {
      ...data,
      nilai: null,
      total_invoice_amount: null,
      payment_amount_received: null,
    };

    if (Array.isArray(data.documents)) {
      masked.documents = data.documents.map((doc) => {
        const hasPrice = doc.has_price || ['PO/SPK', 'Invoice', 'Kwitansi'].includes(doc.type);
        if (hasPrice) {
          return {
            ...doc,
            url: null,
            masked: true,
          };
        }
        return doc;
      });
    }

    return masked;
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

export const STAGE2_REQUIRED_DOCUMENTS = [
  'PO / SPK / Proposal dari Klien',
  'Surat Permohonan Riksa Uji (bermeterai)',
  'Surat Kuasa dari Pemilik (bermeterai)',
  'Surat Pernyataan Keabsahan Data',
  'Form Checklist Disnaker (diisi klien)',
  'Drawing / Gambar Teknis (as-built)',
  'Manual Book / Spesifikasi Teknis',
  'Pengesahan Gambar dari Kemnaker',
  'Copy Suket Lama (jika perpanjangan)',
  'Verifikasi Drawing SESUAI dengan Nameplate (cek visual foto)'
];

/**
 * Checks authorization and justification for Stage 2 bypass.
 * Only Kadiv / Manager Teknis / Superadmin can authorize bypass.
 */
export function canBypassStage2(user, justification = '') {
  const authorizedRoles = ['manager', 'kadiv', 'superadmin'];
  const userRole = (user && user.role) ? user.role.toLowerCase() : '';

  if (!authorizedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: 'Hanya Kepala Divisi, Manager Teknis, atau Superadmin yang berwenang memberikan persetujuan bypass dokumen.'
    };
  }

  if (!justification || justification.trim() === '') {
    return {
      allowed: false,
      reason: 'Alasan / justifikasi bypass dokumen wajib diisi.'
    };
  }

  return { allowed: true };
}

/**
 * Checks if a job has outstanding document debt (documents bypassed in Stage 2 not yet uploaded).
 */
export function hasDocumentDebt(job) {
  if (job.peer_review_status !== 'approved' && !job.bypass_justification) {
    return { hasDebt: false, missingDocs: [] };
  }

  const uploadedTypes = (job.documents || []).map(d => d.type);
  const missingDocs = STAGE2_REQUIRED_DOCUMENTS.filter(docType => !uploadedTypes.includes(docType));

  return {
    hasDebt: missingDocs.length > 0,
    missingDocs
  };
}

/**
 * Evaluates Stage 4 outcome into THREE distinct paths:
 * 1. Happy Path: Inspected == Total units and all units Sesuai -> Stage 5 (LHPP)
 * 2. Logistics Mismatch: Inspected < Total due to logistics/unavailability -> Stage 4b (Aktualisasi Unit MKT)
 * 3. Technical Finding: Defective units found (Temuan / Rusak) -> Stage 6 (Review Laporan / Tidak Laik)
 */
export function evaluateStage4Branch(job) {
  const total = job.total_units || job.units || 1;
  const inspected = job.inspected_count != null ? job.inspected_count : total;
  const results = job.unit_results || [];

  const hasTechnicalFinding = results.some(u => u.status === 'Temuan' || u.status === 'Rusak' || u.status === 'Tidak Laik');

  if (hasTechnicalFinding) {
    return {
      path: 'technical_finding',
      nextStage: 6, // Stage 6 (Review Laporan)
      reason: 'Terdapat temuan teknis / unit tidak laik. Diarahkan ke Stage 6 untuk review laporan teknis.'
    };
  }

  const hasCountMismatch = inspected < total || job.mismatch_reason_type === 'logistics';
  if (hasCountMismatch) {
    return {
      path: 'logistics_mismatch',
      nextStage: 13, // Stage 4b (Aktualisasi Unit)
      reason: 'Jumlah unit teruji belum lengkap karena kendala logistik/lapangan. Diarahkan ke Stage 4b.'
    };
  }

  return {
    path: 'happy',
    nextStage: 5, // Stage 5 (Penyusunan LHPP)
    reason: 'Semua unit telah teruji dan memenuhi syarat teknis (Sesuai).'
  };
}

/**
 * Loop counter check for Stage 4c/4d reschedule loop (max = 3).
 */
export function checkRescheduleLimit(job, max = 3) {
  const count = job.reschedule_count || 0;
  return {
    count,
    max,
    exceeded: count >= max,
    message: count >= max ? `Batas reschedule (${max}x) telah tercapai. Keputusan Kadiv diperlukan (Job Split atau Close as Failed).` : 'On Track'
  };
}

/**
 * Loop counter check for Stage 6 -> 5 revision loop (max = 2).
 */
export function checkRevisionLimit(job, max = 2) {
  const count = job.revision_count || 0;
  return {
    count,
    max,
    exceeded: count >= max,
    message: count >= max ? `Batas revisi teknis (${max}x) telah tercapai. Persetujuan Kadiv diperlukan.` : 'On Track'
  };
}

/**
 * Loop counter check for Stage 11c -> 11 payment retry (max = 5).
 */
export function checkPaymentRetryLimit(job, max = 5) {
  const count = job.payment_retry_count || 0;
  return {
    count,
    max,
    exceeded: count >= max,
    message: count >= max ? `Batas penagihan ulang (${max}x) telah tercapai. Eskalasi otomatis ke Kadiv & Manager.` : 'On Track'
  };
}

/**
 * Validates Stage 11b SUKET delivery triple hard-gate:
 * 1. Stage 11c payment verification status = Verified (Lunas)
 * 2. Bank statement attachment mandatory (bank_statement_attached === true)
 * 3. Zero document debt (all bypassed docs resolved)
 */
export function canDeliverSuket(job) {
  const pv = job.payment_verification || {};
  const isVerified = (pv.status === 'Verified' || pv.status === 'Lunas');

  if (!isVerified) {
    return {
      allowed: false,
      reason: 'SUKET ditahan: Pembayaran belum diverifikasi Lunas oleh Finance di Stage 11c.'
    };
  }

  const hasBankStatement = pv.bank_statement_attached === true || Boolean(pv.bukti_url);
  if (!hasBankStatement) {
    return {
      allowed: false,
      reason: 'SUKET ditahan: Lampiran Mutasi Rekening / Bank Statement wajib ada pada verifikasi pembayaran.'
    };
  }

  const debt = hasDocumentDebt(job);
  if (debt.hasDebt) {
    return {
      allowed: false,
      reason: `SUKET ditahan: Terdapat hutang dokumen (${debt.missingDocs.length} berkas yang di-bypass di Stage 2 belum diunggah).`,
      missingDocs: debt.missingDocs
    };
  }

  return { allowed: true };
}

/**
 * Computes rollups of unit statuses for a job.
 */
export function computeJobUnitRollups(units = []) {
  const current = units.length;
  let laik = 0;
  let tidakLaik = 0;
  let pending = 0;
  let unavailable = 0;
  let cancelled = 0;

  for (const u of units) {
    if (u.final_disposition === 'CANCELLED' || u.inspection_status === 'CANCELLED') {
      cancelled++;
    } else if (u.laik_status === 'LAIK' || u.inspection_status === 'LAIK') {
      laik++;
    } else if (u.laik_status === 'TIDAK_LAIK' || u.inspection_status === 'TIDAK_LAIK' || u.inspection_status === 'TEMUAN') {
      tidakLaik++;
    } else if (u.non_inspection_reason === 'CLIENT_UNIT_UNAVAILABLE' || u.inspection_status === 'NOT_INSPECTED') {
      unavailable++;
      pending++;
    } else {
      pending++;
    }
  }

  return { current, laik, tidakLaik, pending, unavailable, cancelled };
}

/**
 * Computes PO-level Job Family Status (ACTIVE, PARTIALLY_CLOSED, FULLY_CLOSED, EXCEPTION_REVIEW).
 */
export function computeFamilyStatus(rootJob, descendantJobs = []) {
  const allJobs = [rootJob, ...descendantJobs].filter(Boolean);
  if (allJobs.length === 0) return 'ACTIVE';

  const isTerminal = (j) => j.stage === 12 || j.status === 'CLOSED' || j.status === 'CLOSED_FAILED' || j.status === 'CANCELLED';
  const hasException = allJobs.some(j => j.status === 'ON_HOLD' || j.status === 'EXCEPTION_REVIEW' || (j.reschedule_count || 0) >= 3 || (j.payment_retry_count || 0) >= 5);

  if (hasException) {
    return 'EXCEPTION_REVIEW';
  }

  const allTerminal = allJobs.every(isTerminal);
  if (allTerminal) {
    return 'FULLY_CLOSED';
  }

  const someTerminal = allJobs.some(isTerminal);
  if (someTerminal) {
    return 'PARTIALLY_CLOSED';
  }

  return 'ACTIVE';
}

/**
 * Validates whether an inspection batch covers 100% of expected units with valid outcomes and reasons.
 */
export function validateInspectionBatch(expectedUnits = [], batchData = {}) {
  const submittedUnits = batchData.units || [];
  const expectedIds = new Set(expectedUnits.map(u => u.id || u.job_unit_id));

  for (const eId of expectedIds) {
    const sub = submittedUnits.find(u => (u.job_unit_id || u.id) === eId);
    if (!sub) {
      return { valid: false, reason: `Unit ${eId} belum memiliki hasil inspeksi.` };
    }
    if (!['LAIK', 'TEMUAN', 'NOT_INSPECTED'].includes(sub.outcome)) {
      return { valid: false, reason: `Hasil inspeksi untuk unit ${eId} tidak valid (${sub.outcome}).` };
    }
    if (sub.outcome === 'NOT_INSPECTED' && !sub.non_inspection_reason) {
      return { valid: false, reason: `Unit ${eId} (NOT_INSPECTED) wajib memiliki alasan tidak diperiksa.` };
    }
  }

  return { valid: true };
}

/**
 * Creates an append-only inspection result correction with supersedes_result_id link.
 */
export function recordInspectionResultCorrection(previousResult, correctionData = {}) {
  return {
    id: `res-corr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    batch_id: previousResult.batch_id,
    job_unit_id: previousResult.job_unit_id,
    outcome: correctionData.outcome || previousResult.outcome,
    reason: correctionData.correction_reason || correctionData.reason || null,
    finding_description: correctionData.finding_description !== undefined ? correctionData.finding_description : previousResult.finding_description,
    supersedes_result_id: previousResult.id,
    recorded_by: correctionData.corrected_by_user_id || correctionData.recorded_by || 'Inspector',
    recorded_at: new Date().toISOString()
  };
}

/**
 * Executes atomic job split with preconditions, version validation, and single unit ownership.
 */
export function executeAtomicJobSplit(sourceJob, splitRequest = {}) {
  const {
    selectedUnitIds = [],
    splitReason = 'UNIT_UNAVAILABLE',
    commercialAllocationMode = 'PRO_RATA',
    childJobStage = 16, // S4c
    rescheduleReason = '',
    approvedByUserId = null,
    approvalReason = '',
    version = null
  } = splitRequest;

  // Optimistic concurrency / version check
  if (version != null && sourceJob.row_version != null && Number(version) !== Number(sourceJob.row_version)) {
    return {
      ok: false,
      code: 'STALE_VERSION',
      message: 'Job telah dimodifikasi oleh pengguna lain. Silakan muat ulang sebelum memecah job.'
    };
  }

  if (!selectedUnitIds || selectedUnitIds.length === 0) {
    return { ok: false, code: 'EMPTY_SELECTION', message: 'Pilih minimal satu unit untuk dipindahkan ke job anak.' };
  }

  const allUnits = sourceJob.unit_items || [];
  if (selectedUnitIds.length >= allUnits.length && allUnits.length > 0) {
    return { ok: false, code: 'ALL_UNITS_SELECTED', message: 'Tidak dapat memindahkan seluruh unit. Gunakan transfer / cancel.' };
  }

  const parentUnits = allUnits.filter(u => !selectedUnitIds.includes(u.id));
  const childUnits = allUnits.filter(u => selectedUnitIds.includes(u.id));

  const rootId = sourceJob.root_job_id || sourceJob.id;
  const childId = `job-split-${sourceJob.id}-${Date.now()}`;
  const splitSequence = (sourceJob.split_sequence || 0) + 1;

  // Updated parent job
  const updatedParent = {
    ...sourceJob,
    job_type: 'PARENT',
    root_job_id: rootId,
    units: parentUnits.length,
    unit_items: parentUnits.map(u => ({ ...u, current_job_id: sourceJob.id })),
    stage: sourceJob.stage === 13 ? 5 : sourceJob.stage, // Auto advances to S5 LHPP if split at S4b
    split_sequence: splitSequence,
    has_split: true,
    row_version: (sourceJob.row_version || 1) + 1,
    split_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Newly created child job
  const childJob = {
    ...sourceJob,
    id: childId,
    kode: `${sourceJob.kode || 'DNP'}-C${String(splitSequence).padStart(2, '0')}`,
    job_type: 'CHILD',
    parent_job_id: sourceJob.id,
    root_job_id: rootId,
    no_po: sourceJob.no_po || sourceJob.po_number,
    po_number: sourceJob.no_po || sourceJob.po_number,
    original_po_unit_count: sourceJob.original_po_unit_count || sourceJob.units,
    units: childUnits.length,
    unit_items: childUnits.map(u => ({ ...u, current_job_id: childId })),
    stage: childJobStage,
    split_reason: splitReason,
    split_at: new Date().toISOString(),
    split_approved_by_user_id: approvedByUserId,
    split_approval_reason: approvalReason,
    reschedule_reason: rescheduleReason,
    reschedule_count: 0,
    commercial_allocation_mode: commercialAllocationMode,
    row_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return {
    ok: true,
    parentJob: updatedParent,
    childJob,
    transferredUnitIds: selectedUnitIds
  };
}

/**
 * Validates whether a child job is eligible to be merged back into its parent.
 */
export function validateMergeBackEligibility(childJob) {
  if (childJob.has_issued_suket || childJob.stage === 9 || childJob.stage === 14) {
    return { allowed: false, reason: 'Child job tidak dapat di-merge: SUKET telah diterbitkan/diproses.' };
  }
  if (childJob.has_finalized_lhpp || childJob.stage === 5 || childJob.stage === 6 || childJob.stage === 7 || childJob.stage === 8) {
    return { allowed: false, reason: 'Child job tidak dapat di-merge: LHPP atau proses Disnaker telah berjalan.' };
  }
  if (childJob.has_invoiced_line || childJob.stage === 10 || childJob.stage === 15) {
    return { allowed: false, reason: 'Child job tidak dapat di-merge: Tagihan / invoice telah dibuat.' };
  }
  if (![16, 17, 13].includes(childJob.stage)) {
    return { allowed: false, reason: 'Merge-back hanya diperbolehkan pada Stage 4b, 4c, atau 4d.' };
  }

  return { allowed: true };
}

/**
 * Allocates a family payment explicitly to a designated job.
 */
export function allocatePaymentToFamilyJob({ payment_id, family_root_job_id, job_id, invoice_id = null, allocated_amount, approved_by_user_id, note = '' }) {
  return {
    id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    payment_id,
    family_root_job_id,
    job_id,
    invoice_id,
    allocated_amount,
    approved_by_user_id,
    approved_at: new Date().toISOString(),
    note
  };
}

export function splitJob(parentJob, childUnitIds = []) {
  const result = executeAtomicJobSplit(parentJob, { selectedUnitIds: childUnitIds });
  return {
    parentJob: result.parentJob || parentJob,
    childJob: result.childJob || null
  };
}

/**
 * Validates whether a specific Batch is eligible for Stage 11b SUKET dispatch.
 */
export function canReleaseSuketForBatch({ job, batchId }) {
  if (!job || !Array.isArray(job.batches)) {
    return { canRelease: false, reason: 'Job tidak memiliki daftar batch yang valid.' };
  }

  const batch = job.batches.find((b) => b.id === batchId);
  if (!batch) {
    return { canRelease: false, reason: `Batch dengan ID ${batchId} tidak ditemukan.` };
  }

  if (batch.suket_ready === false || (typeof batch.current_stage === 'number' && batch.current_stage < 9)) {
    return { canRelease: false, reason: 'SUKET untuk batch ini belum selesai diproses di Disnaker.' };
  }

  if (batch.payment_status !== 'Verified') {
    return {
      canRelease: false,
      reason: 'Pembayaran untuk batch ini belum lunas diverifikasi oleh Finance (Stage 11c).',
    };
  }

  return { canRelease: true };
}

/**
 * Records payment verification specifically for a designated Batch (Pro-rata settlement).
 */
export function verifyBatchPayment({ job, batchId, status, verifiedBy, amountReceived = 0 }) {
  if (!job || !Array.isArray(job.batches)) {
    return job;
  }

  const updatedBatches = job.batches.map((b) => {
    if (b.id === batchId) {
      const isVerified = status === 'Verified';
      return {
        ...b,
        payment_status: status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        amount_received: amountReceived,
        current_stage: isVerified ? '11b' : 11,
        retry_count: isVerified ? (b.retry_count || 0) : ((b.retry_count || 0) + 1),
      };
    }
    return b;
  });

  return {
    ...job,
    batches: updatedBatches,
  };
}

/**
 * Records an invoice revision at any stage by Finance.
 */
export function recordInvoiceRevision({ job, invoiceData = {}, actorName = 'Finance', actorRole = 'finance' }) {
  const ts = new Date().toISOString();
  const revisionEntry = {
    revision_id: `rev-${Date.now()}`,
    invoice_no: invoiceData.invoice_no || job.invoice_no,
    total_invoice_amount: invoiceData.total_invoice_amount != null ? Number(invoiceData.total_invoice_amount) : job.total_invoice_amount,
    tgl_invoice_issued: invoiceData.tgl_invoice_issued || job.tgl_invoice_issued,
    catatan_revisi: invoiceData.catatan_revisi || '',
    revised_by: actorName,
    revised_at: ts,
  };

  const invoice_revisions = [...(job.invoice_revisions || []), revisionEntry];
  const history = [...(job.history || []), {
    stage: job.stage,
    ts,
    by: actorName,
    action: `Revisi Invoice oleh Finance: ${revisionEntry.invoice_no} (${revisionEntry.total_invoice_amount ? 'Rp ' + Number(revisionEntry.total_invoice_amount).toLocaleString('id-ID') : ''}). Catatan: "${revisionEntry.catatan_revisi}"`.trim(),
  }];

  return {
    ...job,
    invoice_no: revisionEntry.invoice_no,
    total_invoice_amount: revisionEntry.total_invoice_amount,
    tgl_invoice_issued: revisionEntry.tgl_invoice_issued,
    invoice_revisions,
    history: deduplicateHistoryLogs(history),
    updated_at: ts,
  };
}

/**
 * Categorizes the stages into 3 operational phases with explicit Happy Path vs Exception Branch flags.
 */
export function categorizeStagesByPhase(stages = []) {
  const phase1Ids = [1, 2, 3, 4, 13, 16, 17];
  const phase2Ids = [5, 6, 7, 8, 9];
  const phase3Ids = [10, 11, 15, 14, 12];
  const exceptionIds = [13, 16, 17];

  const mapStageWithMeta = (stageId) => {
    const s = stages.find(item => item.id === stageId) || { id: stageId, name: `Stage ${stageId}`, displayId: `${stageId}` };
    return {
      ...s,
      isException: exceptionIds.includes(stageId),
    };
  };

  return [
    {
      id: 'ru_lapangan',
      name: 'Phase 1 — RU Lapangan',
      short: 'RU Lapangan',
      description: 'Order PO, verifikasi dokumen, penjadwalan, dan pelaksanaan inspeksi teknis lapangan.',
      stages: phase1Ids.map(mapStageWithMeta),
    },
    {
      id: 'laporan_dinas',
      name: 'Phase 2 — Laporan & Dinas',
      short: 'Laporan & Dinas',
      description: 'Penyusunan LHPP, review teknis, koordinasi Disnaker, dan penerbitan SKKP/SUKET.',
      stages: phase2Ids.map(mapStageWithMeta),
    },
    {
      id: 'invoice_delivery',
      name: 'Phase 3 — Invoice & Delivery',
      short: 'Invoice & Delivery',
      description: 'Penerbitan faktur invoice, penagihan, verifikasi mutasi bank, pengiriman dokumen fisik.',
      stages: phase3Ids.map(mapStageWithMeta),
    },
  ];
}

/**
 * Filters jobs for the "My Work" view based on user identity and role.
 */
export function filterJobsForMyWork(jobs = [], user = {}) {
  if (!user || !user.role) return jobs;
  const role = user.role.toLowerCase();

  if (role === 'superadmin' || role === 'manager') {
    return jobs;
  }

  if (role === 'inspektur') {
    return jobs.filter(j => {
      const hasInspectors = (j.inspectors && j.inspectors.length > 0) || (j.inspector_ids && j.inspector_ids.length > 0);
      if (hasInspectors) {
        return (j.inspectors || []).some(insp => insp.id === user.id || insp.name === user.name) ||
               (Array.isArray(j.inspector_ids) && j.inspector_ids.includes(user.id));
      }
      return [4, 17].includes(j.stage);
    });
  }

  if (role === 'marketing') {
    return jobs.filter(j => {
      const isOwner = j.owner_marketing && (j.owner_marketing === user.name || j.owner_marketing === user.email);
      return isOwner;
    });
  }

  if (role === 'finance') {
    return jobs.filter(j => [10, 15, 12].includes(j.stage));
  }

  if (role === 'admin') {
    return jobs.filter(j => [2, 3, 16, 5, 7, 8, 9].includes(j.stage));
  }

  return jobs;
}

/**
 * Computes summary counts, active jobs, and SLA health per stage for Stage Rail badges.
 */
export function computeStageSummaryStats(stages = [], jobs = []) {
  return stages.map(st => {
    const stageJobs = jobs.filter(j => j.stage === st.id);
    const overdueCount = stageJobs.filter(j => {
      const refDate = j.tgl_pelaksanaan || j.tgl_laporan_mulai || j.tgl_submit_disnaker || j.created_at;
      if (!refDate) return false;
      const days = Math.ceil((Date.now() - new Date(refDate).getTime()) / 86400000);
      return days > 3; // Standard warning threshold
    }).length;

    return {
      id: st.id,
      displayId: st.displayId || st.id,
      name: st.name,
      short: st.short || st.name,
      count: stageJobs.length,
      overdueCount,
    };
  });
}





