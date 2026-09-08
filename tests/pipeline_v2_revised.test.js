import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStage1,
  evaluateStage4Branch,
  canBypassStage2,
  hasDocumentDebt,
  checkRescheduleLimit,
  checkRevisionLimit,
  checkPaymentRetryLimit,
  canDeliverSuket,
  splitJob
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor v2.0 Revised — Workflow Engine & Audit Rules', () => {

  describe('1. Stage 1 — DP Input Validation', () => {
    test('requires dp_amount or dp_percentage when termin_pembayaran is DP', () => {
      const invalidJob = { termin_pembayaran: 'DP', no_po: 'PO-01' };
      const resInvalid = validateStage1(invalidJob);
      assert.equal(resInvalid.valid, false);
      assert.match(resInvalid.error, /DP/i);

      const validJob = { termin_pembayaran: 'DP', dp_amount: 15000000, no_po: 'PO-01' };
      const resValid = validateStage1(validJob);
      assert.equal(resValid.valid, true);
    });

    test('passes when termin_pembayaran is FULL without DP amount', () => {
      const fullJob = { termin_pembayaran: 'FULL', no_po: 'PO-02' };
      const res = validateStage1(fullJob);
      assert.equal(res.valid, true);
    });
  });

  describe('2. Stage 2 — Bypass Justification & Document Debt', () => {
    test('blocks Stage 2 bypass if justification is missing or user is not authorized', () => {
      const adminUser = { role: 'admin', name: 'Staff Admin' };
      const kadivUser = { role: 'manager', name: 'Kadiv Teknis' };

      const resUnauthorized = canBypassStage2(adminUser, 'Alasan urgent');
      assert.equal(resUnauthorized.allowed, false, 'Admin cannot bypass Stage 2');

      const resNoJustification = canBypassStage2(kadivUser, '   ');
      assert.equal(resNoJustification.allowed, false, 'Must provide non-empty justification');

      const resOk = canBypassStage2(kadivUser, 'Drawing menyusul 7 hari kerja');
      assert.equal(resOk.allowed, true);
    });

    test('tracks document debt when documents are bypassed', () => {
      const jobWithDebt = {
        peer_review_status: 'approved',
        bypass_justification: 'Drawing menyusul',
        documents: [
          { type: 'PO / SPK / Proposal dari Klien', stage: 1 }
        ]
      };
      const debtCheck = hasDocumentDebt(jobWithDebt);
      assert.equal(debtCheck.hasDebt, true);
      assert.ok(debtCheck.missingDocs.length > 0);
      assert.ok(debtCheck.missingDocs.includes('Drawing / Gambar Teknis (as-built)'));
    });
  });

  describe('3. Stage 4 — Three-Path Branching (Happy, Logistics, Technical Finding)', () => {
    test('Path A (Happy Path): all units inspected and Sesuai -> Stage 5', () => {
      const jobHappy = {
        total_units: 3,
        inspected_count: 3,
        unit_results: [
          { no_seri: 'U1', status: 'Sesuai' },
          { no_seri: 'U2', status: 'Sesuai' },
          { no_seri: 'U3', status: 'Sesuai' }
        ]
      };
      const target = evaluateStage4Branch(jobHappy);
      assert.equal(target.path, 'happy');
      assert.equal(target.nextStage, 5);
    });

    test('Path B (Logistics Mismatch): units not available in field -> Stage 4b (Aktualisasi)', () => {
      const jobLogistics = {
        total_units: 5,
        inspected_count: 3,
        mismatch_reason_type: 'logistics',
        unit_results: [
          { no_seri: 'U1', status: 'Sesuai' },
          { no_seri: 'U2', status: 'Sesuai' },
          { no_seri: 'U3', status: 'Sesuai' }
        ]
      };
      const target = evaluateStage4Branch(jobLogistics);
      assert.equal(target.path, 'logistics_mismatch');
      assert.equal(target.nextStage, 13); // Stage 4b
    });

    test('Path C (Technical Finding): defective unit -> Stage 6 (Review Laporan / Tidak Laik)', () => {
      const jobTechnical = {
        total_units: 4,
        inspected_count: 4,
        unit_results: [
          { no_seri: 'U1', status: 'Sesuai' },
          { no_seri: 'U2', status: 'Temuan', catatan: 'Kompresor overheat' }
        ]
      };
      const target = evaluateStage4Branch(jobTechnical);
      assert.equal(target.path, 'technical_finding');
      assert.equal(target.nextStage, 6); // Stage 6
    });
  });

  describe('4. Loop Controls & Counters (Reschedule, Revision, Payment Retry)', () => {
    test('enforces max_reschedule_count = 3 on Stage 4c/4d loop', () => {
      assert.equal(checkRescheduleLimit({ reschedule_count: 2 }).exceeded, false);
      assert.equal(checkRescheduleLimit({ reschedule_count: 3 }).exceeded, true);
    });

    test('enforces max_revision_count = 2 on Stage 6 -> 5 review loop', () => {
      assert.equal(checkRevisionLimit({ revision_count: 1 }).exceeded, false);
      assert.equal(checkRevisionLimit({ revision_count: 2 }).exceeded, true);
    });

    test('enforces max_payment_retry = 5 on Stage 11c -> 11 gateway loop', () => {
      assert.equal(checkPaymentRetryLimit({ payment_retry_count: 4 }).exceeded, false);
      assert.equal(checkPaymentRetryLimit({ payment_retry_count: 5 }).exceeded, true);
    });
  });

  describe('5. Job Split Support', () => {
    test('splits parent job into passing parent and failing child linked by parent_job_id', () => {
      const parentJob = {
        id: 'job-100',
        kode: 'DNP/2026/0100',
        klien: 'PT Pabrik Baja',
        no_po: 'PO/2026/888',
        units: 5,
        unit_items: [
          { id: 1, name: 'Crane 01', status: 'Laik' },
          { id: 2, name: 'Crane 02', status: 'Laik' },
          { id: 3, name: 'Crane 03', status: 'Laik' },
          { id: 4, name: 'Crane 04', status: 'Tidak Laik' },
          { id: 5, name: 'Crane 05', status: 'Tidak Laik' }
        ]
      };

      const splitResult = splitJob(parentJob, [4, 5]);
      assert.equal(splitResult.parentJob.units, 3);
      assert.equal(splitResult.childJob.units, 2);
      assert.equal(splitResult.childJob.parent_job_id, 'job-100');
      assert.equal(splitResult.childJob.no_po, 'PO/2026/888');
      assert.equal(splitResult.childJob.stage, 16); // Stage 4c Reschedule
    });
  });

  describe('6. Stage 11b Triple Hard-Gate Delivery', () => {
    test('blocks SUKET delivery if payment not verified, bank statement missing, or document debt exists', () => {
      const job1 = {
        payment_verification: { status: 'Pending', bank_statement_attached: false },
        documents: []
      };
      assert.equal(canDeliverSuket(job1).allowed, false);

      const job2 = {
        payment_verification: { status: 'Verified', bank_statement_attached: false },
        documents: []
      };
      assert.equal(canDeliverSuket(job2).allowed, false, 'Requires bank statement attachment');

      const job3 = {
        payment_verification: { status: 'Verified', bank_statement_attached: true },
        peer_review_status: 'approved', // had bypass
        bypass_justification: 'Drawing menyusul',
        documents: [] // missing drawing
      };
      assert.equal(canDeliverSuket(job3).allowed, false, 'Blocked by document debt');

      const jobOk = {
        payment_verification: { status: 'Verified', bank_statement_attached: true },
        peer_review_status: 'approved',
        bypass_justification: 'Drawing menyusul',
        documents: [
          { type: 'PO / SPK / Proposal dari Klien', stage: 1 },
          { type: 'Surat Permohonan Riksa Uji (bermeterai)', stage: 2 },
          { type: 'Surat Kuasa dari Pemilik (bermeterai)', stage: 2 },
          { type: 'Surat Pernyataan Keabsahan Data', stage: 2 },
          { type: 'Form Checklist Disnaker (diisi klien)', stage: 2 },
          { type: 'Drawing / Gambar Teknis (as-built)', stage: 2 },
          { type: 'Manual Book / Spesifikasi Teknis', stage: 2 },
          { type: 'Pengesahan Gambar dari Kemnaker', stage: 2 },
          { type: 'Copy Suket Lama (jika perpanjangan)', stage: 2 },
          { type: 'Verifikasi Drawing SESUAI dengan Nameplate (cek visual foto)', stage: 2 }
        ]
      };
      assert.equal(canDeliverSuket(jobOk).allowed, true);
    });
  });

});
