import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStage1,
  maskSensitiveData,
  canIssueSuratTugas,
  recordInspectionRU,
  calculateEscalationLevel,
  recordLHPPTracking,
  evaluateManagerReview,
  createBatchFromApprovedUnits,
  calculateSuketDuration,
  evaluatePaymentVerification,
  calculateJobRollupStatus,
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor v3 — TDD Workflow Engine', () => {
  // ── Stage 1 Tests ──
  describe('Stage 1 — PO / SPK Requirements', () => {
    it('requires termin_pembayaran to be either DP or FULL', () => {
      const validJob = {
        klien: 'PT ABC',
        pesawat: 'Genset',
        kategori: 'Umum',
        termin_pembayaran: 'DP',
      };
      assert.equal(validateStage1(validJob).valid, true);

      const invalidJob = {
        klien: 'PT ABC',
        pesawat: 'Genset',
        kategori: 'Umum',
        termin_pembayaran: 'INVALID',
      };
      const result = validateStage1(invalidJob);
      assert.equal(result.valid, false);
      assert.match(result.error, /termin_pembayaran/i);
    });

    it('enforces mandatory no_seri only for Listrik and Kebakaran categories', () => {
      const generalUnit = { nama_alat: 'Forklift', kategori: 'Pesawat Angkat & Angkut', no_seri: '' };
      assert.equal(validateStage1({ termin_pembayaran: 'FULL', units: [generalUnit] }).valid, true);

      const electricUnitNoSerial = { nama_alat: 'Panel Listrik', kategori: 'Listrik', no_seri: '' };
      const resElectric = validateStage1({ termin_pembayaran: 'FULL', units: [electricUnitNoSerial] });
      assert.equal(resElectric.valid, false);
      assert.match(resElectric.error, /no_seri wajib/i);

      const fireUnitNoSerial = { nama_alat: 'Fire Hydrant', kategori: 'Kebakaran', no_seri: '' };
      const resFire = validateStage1({ termin_pembayaran: 'FULL', units: [fireUnitNoSerial] });
      assert.equal(resFire.valid, false);
      assert.match(resFire.error, /no_seri wajib/i);
    });
  });

  // ── Stage 2 Tests (Masking) ──
  describe('Stage 2 — Data Masking & RBAC', () => {
    it('masks nilai and commercial fields when role is Admin', () => {
      const job = {
        id: 'job-1',
        kode: 'DNP/2026/001',
        klien: 'PT XYZ',
        nilai: 50000000,
        total_invoice_amount: 55000000,
      };

      const adminView = maskSensitiveData(job, 'admin');
      assert.equal(adminView.nilai, null);
      assert.equal(adminView.total_invoice_amount, null);

      const marketingView = maskSensitiveData(job, 'marketing');
      assert.equal(marketingView.nilai, 50000000);

      const financeView = maskSensitiveData(job, 'finance');
      assert.equal(financeView.nilai, 50000000);
    });
  });

  // ── Stage 3 Tests (Hard Gate DP & Reschedule Log) ──
  describe('Stage 3 — Scheduling & DP Hard Gate', () => {
    it('blocks Surat Tugas issuance if termin is DP and DP is not paid', () => {
      const jobDpUnpaid = { termin_pembayaran: 'DP', dp_paid: false };
      const result = canIssueSuratTugas(jobDpUnpaid);
      assert.equal(result.canIssue, false);
      assert.match(result.reason, /DP belum lunas/i);

      const jobDpPaid = { termin_pembayaran: 'DP', dp_paid: true };
      assert.equal(canIssueSuratTugas(jobDpPaid).canIssue, true);

      const jobFull = { termin_pembayaran: 'FULL', dp_paid: false };
      assert.equal(canIssueSuratTugas(jobFull).canIssue, true);
    });
  });

  // ── Stage 4 Tests (Unit-level RU & Split Flow) ──
  describe('Stage 4 — Unit-level Inspection & Split Flow', () => {
    it('splits inspected units: Sesuai advances to Stage 5, Tidak Sesuai diverts to 4b', () => {
      const units = [
        { id: 'u1', nama_alat: 'Crane 1', result: 'Sesuai' },
        { id: 'u2', nama_alat: 'Crane 2', result: 'Tidak Sesuai' },
      ];

      const { updatedUnits, inspectionEvent, bap } = recordInspectionRU({
        jobId: 'job-1',
        inspectorId: 'ins-1',
        tanggal: '2026-09-10',
        unitResults: units,
      });

      assert.equal(updatedUnits.find(u => u.id === 'u1').current_stage, 5);
      assert.equal(updatedUnits.find(u => u.id === 'u1').ru_result, 'Sesuai');

      assert.equal(updatedUnits.find(u => u.id === 'u2').current_stage, '4b');
      assert.equal(updatedUnits.find(u => u.id === 'u2').ru_result, 'Tidak Sesuai');

      assert.ok(inspectionEvent);
      assert.ok(bap);
      assert.equal(bap.inspection_id, inspectionEvent.id);
    });
  });

  // ── Stage 4b–4d Escalation Reminders (Infinite Ceiling) ──
  describe('Stage 4b–4d — Escalation Reminders', () => {
    it('calculates escalation level based on days in rework loop', () => {
      assert.equal(calculateEscalationLevel(3).level, 0); // Normal
      
      const level1 = calculateEscalationLevel(8);
      assert.equal(level1.level, 1);
      assert.equal(level1.badge, 'yellow');
      assert.deepEqual(level1.notifyRoles, ['marketing', 'admin']);

      const level2 = calculateEscalationLevel(15);
      assert.equal(level2.level, 2);
      assert.equal(level2.badge, 'red');
      assert.deepEqual(level2.notifyRoles, ['manager']);

      const level3 = calculateEscalationLevel(29);
      assert.equal(level3.level, 3);
      assert.equal(level3.badge, 'red');
      assert.equal(level3.recurring, true);
    });
  });

  // ── Stage 5 Tests (LHPP 3 tracking dates) ──
  describe('Stage 5 — LHPP Tracking Dates & Lead Time', () => {
    it('records three tracking dates and computes drafting lead times', () => {
      const lhpp = recordLHPPTracking({
        unitId: 'u1',
        tanggal_data_teknis_diserahkan: '2026-09-10',
        tanggal_mulai_pengerjaan: '2026-09-12',
        tanggal_selesai: '2026-09-15',
      });

      assert.equal(lhpp.queue_days, 2); // 12 - 10
      assert.equal(lhpp.drafting_days, 3); // 15 - 12
      assert.equal(lhpp.status, 'Selesai');
    });
  });

  // ── Stage 6 Tests (Review Manager & Reject Loop) ──
  describe('Stage 6 — Review Manager Decision', () => {
    it('approves or rejects LHPP to revise, looping back to Stage 5 on reject', () => {
      const approved = evaluateManagerReview({ decision: 'Approve' });
      assert.equal(approved.status, 'Approved');
      assert.equal(approved.next_stage, 7);

      const rejected = evaluateManagerReview({ decision: 'Reject-to-Revise', notes: 'Perbaiki tabel beban' });
      assert.equal(rejected.status, 'Rejected-Revisi');
      assert.equal(rejected.next_stage, 5);
      assert.equal(rejected.notes, 'Perbaiki tabel beban');
    });
  });

  // ── Stage 7–9 Tests (Batching & SUKET Duration) ──
  describe('Stage 7–9 — Batch Formation & SUKET Duration', () => {
    it('groups only Approved LHPP units into a Batch and tracks SUKET duration', () => {
      const units = [
        { id: 'u1', lhpp_status: 'Approved' },
        { id: 'u2', lhpp_status: 'Approved' },
        { id: 'u3', lhpp_status: 'Draft' },
      ];

      const batchResult = createBatchFromApprovedUnits({
        jobId: 'job-1',
        sequence: 1,
        selectedUnitIds: ['u1', 'u2', 'u3'],
        allUnits: units,
      });

      assert.equal(batchResult.valid, false);
      assert.match(batchResult.error, /hanya unit dengan LHPP Approved/i);

      const validBatch = createBatchFromApprovedUnits({
        jobId: 'job-1',
        sequence: 1,
        selectedUnitIds: ['u1', 'u2'],
        allUnits: units,
      });
      assert.equal(validBatch.valid, true);
      assert.equal(validBatch.batch.units.length, 2);

      const duration = calculateSuketDuration('2026-09-16', '2026-09-24');
      assert.equal(duration, 8);
    });
  });

  // ── Stage 11c & Gateway Tests (Repositioned 11c & Retry Loop) ──
  describe('Stage 11c — Payment Verification & Gateway Loopback', () => {
    it('loops Job back to Stage 11 and increments retry_count when payment is Partial or Pending', () => {
      const partialPayment = evaluatePaymentVerification({
        jobId: 'job-1',
        status: 'Partial',
        currentRetryCount: 1,
      });

      assert.equal(partialPayment.next_stage, 11);
      assert.equal(partialPayment.retry_count, 2);
      assert.equal(partialPayment.canDeliverSuket, false);

      const verifiedPayment = evaluatePaymentVerification({
        jobId: 'job-1',
        status: 'Verified',
        currentRetryCount: 2,
      });

      assert.equal(verifiedPayment.next_stage, '11b');
      assert.equal(verifiedPayment.canDeliverSuket, true);
    });
  });

  // ── Stage 12 Tests (Rollup Aggregation) ──
  describe('Stage 12 — Aggregate Job Status Rollup', () => {
    it('computes Partial rollup when some units are delivered and others are in rework', () => {
      const units = [
        { id: 'u1', unit_status: 'Closed' },
        { id: 'u2', unit_status: 'Closed' },
        { id: 'u3', unit_status: 'ReworkLoop' },
      ];

      const status = calculateJobRollupStatus(units, true);
      assert.equal(status.job_status, 'Partial');
      assert.equal(status.closed_unit_count, 2);
      assert.equal(status.total_unit_count, 3);
      assert.equal(status.label, '2/3 Unit Closed');
    });

    it('computes Closed rollup only when 100% of units are Closed and payment is Verified', () => {
      const units = [
        { id: 'u1', unit_status: 'Closed' },
        { id: 'u2', unit_status: 'Closed' },
      ];

      const statusWithUnpaid = calculateJobRollupStatus(units, false);
      assert.notEqual(statusWithUnpaid.job_status, 'Closed');

      const statusWithPaid = calculateJobRollupStatus(units, true);
      assert.equal(statusWithPaid.job_status, 'Closed');
      assert.equal(statusWithPaid.closed_unit_count, 2);
      assert.equal(statusWithPaid.label, 'Closed (2/2 Unit Selesai)');
    });
  });
});
