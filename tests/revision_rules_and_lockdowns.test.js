import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskSensitiveData,
  getRejectTargetStage,
  calculateGrossPrice,
  isEligibleForSameMonthRevision,
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor — Business Rules & Workflow Revisions', () => {
  describe('Rule 1: Price calculation (112% / PPN 12%)', () => {
    it('calculates gross price as user input * 112%', () => {
      assert.equal(calculateGrossPrice(10000000), 11200000);
      assert.equal(calculateGrossPrice(50000000), 56000000);
      assert.equal(calculateGrossPrice(0), 0);
      assert.equal(calculateGrossPrice(null), 0);
    });
  });

  describe('Rule 2: Lock PO document ONLY for INS role', () => {
    const sampleJob = {
      id: 'job-po-1',
      klien: 'PT Industri Sejahtera',
      nilai: 75000000,
      documents: [
        { id: 'doc-1', type: 'PO/SPK', name: 'PO_Klien_Signed.pdf', url: '/files/po.pdf' },
        { id: 'doc-2', type: 'Surat Permohonan', name: 'Permohonan.pdf', url: '/files/permohonan.pdf' },
        { id: 'doc-3', type: 'Invoice', name: 'Invoice_001.pdf', url: '/files/inv.pdf' },
      ],
    };

    it('locks and masks PO document and commercial price for INS role (inspektur)', () => {
      const insView = maskSensitiveData(sampleJob, 'inspektur');
      assert.equal(insView.nilai, null, 'INS must not see nilai');
      
      const poDoc = insView.documents.find(d => d.type === 'PO/SPK');
      assert.ok(poDoc, 'PO document entry exists');
      assert.equal(poDoc.url, null, 'PO document URL must be stripped for INS');
      assert.equal(poDoc.masked, true, 'PO document must be flagged as masked for INS');

      const nonPoDoc = insView.documents.find(d => d.type === 'Surat Permohonan');
      assert.equal(nonPoDoc.masked, undefined, 'Technical docs must remain accessible to INS');
      assert.equal(nonPoDoc.url, '/files/permohonan.pdf');
    });

    it('allows Admin, Finance, Marketing, and Manager to see PO document and price', () => {
      const adminView = maskSensitiveData(sampleJob, 'admin');
      assert.equal(adminView.nilai, 75000000, 'Admin can see nilai');
      const adminPoDoc = adminView.documents.find(d => d.type === 'PO/SPK');
      assert.equal(adminPoDoc.url, '/files/po.pdf', 'Admin can access PO document');
      assert.equal(adminPoDoc.masked, undefined);

      const mktView = maskSensitiveData(sampleJob, 'marketing');
      assert.equal(mktView.documents.find(d => d.type === 'PO/SPK').url, '/files/po.pdf');

      const finView = maskSensitiveData(sampleJob, 'finance');
      assert.equal(finView.documents.find(d => d.type === 'PO/SPK').url, '/files/po.pdf');
    });
  });

  describe('Rule 3: Kembalikan Job in S7 moves job from S7 to S5', () => {
    it('returns target stage 5 when rejecting from Stage 7 (Verifikasi ke Dinas)', () => {
      const target = getRejectTargetStage(7);
      assert.equal(target, 5, 'Stage 7 reject must route directly back to Stage 5 (Penyusunan LHPP)');
    });

    it('retains standard previous stage targets for other stages', () => {
      assert.equal(getRejectTargetStage(8), 6);
      assert.equal(getRejectTargetStage(5), 4);
      assert.equal(getRejectTargetStage(13), 4);
      assert.equal(getRejectTargetStage(14), 11);
      assert.equal(getRejectTargetStage(6), 5);
      assert.equal(getRejectTargetStage(2), 1);
    });
  });

  describe('Rule 5: Revisi PO and Invoice accessible only in the same month', () => {
    it('allows revision if reference date is in the same calendar month and year', () => {
      const now = new Date('2026-09-23T10:00:00Z');
      const sameMonthDate = '2026-09-02T08:30:00Z';
      assert.equal(isEligibleForSameMonthRevision(sameMonthDate, now), true);
    });

    it('blocks revision if reference date is in a previous month', () => {
      const now = new Date('2026-10-01T00:01:00Z');
      const prevMonthDate = '2026-09-25T14:00:00Z';
      assert.equal(isEligibleForSameMonthRevision(prevMonthDate, now), false);
    });

    it('blocks revision if reference date is in a different year', () => {
      const now = new Date('2027-09-10T10:00:00Z');
      const lastYearDate = '2026-09-10T10:00:00Z';
      assert.equal(isEligibleForSameMonthRevision(lastYearDate, now), false);
    });

    it('handles null or missing dates safely by disallowing revision', () => {
      assert.equal(isEligibleForSameMonthRevision(null), false);
      assert.equal(isEligibleForSameMonthRevision(''), false);
    });
  });

  describe('HTTP Integration: Reject Endpoint & Cutoff Guards', () => {
    let app, server, baseUrl;

    before(async () => {
      const express = (await import('express')).default;
      const jobsRouter = (await import('../server/routes/jobs.js')).default;
      app = express();
      app.use(express.json());
      app.use('/api/jobs', jobsRouter);

      await new Promise((resolve) => {
        server = app.listen(0, () => {
          baseUrl = `http://localhost:${server.address().port}/api/jobs`;
          resolve();
        });
      });
    });

    after(async () => {
      if (server) await new Promise((resolve) => server.close(resolve));
    });

    it('POST /api/jobs/:id/reject from Stage 7 moves job directly to Stage 5', async () => {
      // Create job at Stage 7
      const createRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
        body: JSON.stringify({
          id: 'job-test-reject-s7',
          klien: 'PT Dinas Test',
          stage: 7,
          nilai: 20000000,
        }),
      });
      assert.equal(createRes.status, 201);

      // Perform reject
      const rejectRes = await fetch(`${baseUrl}/job-test-reject-s7/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ notes: 'Dokumen teknis dari Disnaker butuh perbaikan draf LHPP' }),
      });
      assert.equal(rejectRes.status, 200);
      const rejectBody = await rejectRes.json();
      assert.equal(rejectBody.ok, true);
      assert.equal(rejectBody.job.stage, 5, 'Stage must be 5');
    });

    it('POST /api/jobs/:id/invoice-revise blocks revision if invoice date was in a past month', async () => {
      // Create job with invoice date in 2024
      const createRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
        body: JSON.stringify({
          id: 'job-test-inv-lock',
          klien: 'PT Old Invoice',
          stage: 10,
          tgl_invoice_issued: '2024-01-15',
          created_at: '2024-01-10T00:00:00Z',
          total_invoice_amount: 10000000,
        }),
      });
      assert.equal(createRes.status, 201);

      // Attempt revise invoice
      const reviseRes = await fetch(`${baseUrl}/job-test-inv-lock/invoice-revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'finance' },
        body: JSON.stringify({
          total_invoice_amount: 12000000,
          invoice_no: 'INV-NEW-999',
        }),
      });
      assert.equal(reviseRes.status, 403, 'Must be rejected 403 because it is past month');
      const reviseBody = await reviseRes.json();
      assert.ok(reviseBody.error.includes('melewati bulan'));
    });
  });
});

