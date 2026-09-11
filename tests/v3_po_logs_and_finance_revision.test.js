import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jobsRouter from '../server/routes/jobs.js';
import db from '../server/db.js';
import { deduplicateHistoryLogs } from '../src/domain/workflowEngine.js';

let app;
let server;
let port;
let baseUrl;

describe('DNP Monitor v3 — PO Display/Edit, Log Deduplication & Finance Invoice Revision', () => {

  before(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/jobs', jobsRouter);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://localhost:${port}/api/jobs`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('1. PO & Client Info: Saves and returns no_po, tgl_po, termin_pembayaran, and pic_klien', async () => {
    const jobId = `job-po-test-${Date.now()}`;
    const initialPayload = {
      id: jobId,
      klien: 'PT Nestle Indonesia',
      no_po: 'PO/NES/2026/0889',
      tgl_po: '2026-09-01',
      termin_pembayaran: 'DP',
      dp_amount: 30000000,
      pic_klien: 'Ibu Maya (Finance Dept)',
      pic_klien_phone: '0811-9988-2233',
      pesawat: 'Proteksi Kebakaran (Form 65 K)',
      units: 5,
      nilai: 60000000,
      stage: 1,
    };

    // Create job as Marketing
    const createRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify(initialPayload),
    });
    assert.equal(createRes.status, 201);

    // Edit PO details as Marketing
    const editPayload = {
      ...initialPayload,
      no_po: 'PO/NES/2026/0889-REV1',
      tgl_po: '2026-09-05',
      pic_klien: 'Ibu Maya & Pak Budi',
      pic_klien_phone: '0811-9988-5555',
    };

    const updateRes = await fetch(`${baseUrl}/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify(editPayload),
    });
    assert.equal(updateRes.status, 200);

    // Fetch single job and verify fields are intact
    const getRes = await fetch(`${baseUrl}/${jobId}`, {
      headers: { 'x-user-role': 'marketing' }
    });
    assert.equal(getRes.status, 200);
    const body = await getRes.json();
    assert.equal(body.job.no_po, 'PO/NES/2026/0889-REV1');
    assert.equal(body.job.tgl_po, '2026-09-05');
    assert.equal(body.job.termin_pembayaran, 'DP');
    assert.equal(body.job.pic_klien, 'Ibu Maya & Pak Budi');
    assert.equal(body.job.pic_klien_phone, '0811-9988-5555');
  });

  it('2. Log Deduplication: Strips repeated/double entries within short time windows', () => {
    const rawLogs = [
      { stage: 1, ts: '2026-09-10T08:00:00.000Z', by: 'Marketing', action: 'Job dibuat dari PO/SPK' },
      { stage: 1, ts: '2026-09-10T08:00:00.500Z', by: 'Marketing', action: 'Job dibuat dari PO/SPK' }, // Duplicate within 500ms
      { stage: 2, ts: '2026-09-10T08:05:00.000Z', by: 'Admin', action: 'Verifikasi dokumen' },
      { stage: 2, ts: '2026-09-10T08:05:01.000Z', by: 'Admin', action: 'Verifikasi dokumen' }, // Duplicate within 1s
      { stage: 3, ts: '2026-09-10T08:10:00.000Z', by: 'Admin', action: 'Penjadwalan selesai' },
    ];

    const deduplicated = deduplicateHistoryLogs(rawLogs);
    assert.equal(deduplicated.length, 3, 'Should remove the 2 duplicate entries');
    assert.equal(deduplicated[0].stage, 1);
    assert.equal(deduplicated[1].stage, 2);
    assert.equal(deduplicated[2].stage, 3);
  });

  it('3. Universal Finance Invoice Revision: Allows Finance to revise invoice at Stage 11 without rollback', async () => {
    const jobId = `job-inv-rev-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      jobId, JSON.stringify({
        id: jobId,
        stage: 11, // Marketing collection stage
        invoice_no: 'INV/2026/0045',
        total_invoice_amount: 50000000,
        tgl_invoice_issued: '2026-09-01',
        history: [
          { stage: 10, ts: '2026-09-01T10:00:00.000Z', by: 'Finance', action: 'Invoice dibuat' }
        ]
      }),
      new Date().toISOString(),
      new Date().toISOString()
    );

    const revisionPayload = {
      invoice_no: 'INV/2026/0045-REV',
      total_invoice_amount: 55000000,
      tgl_invoice_issued: '2026-09-08',
      catatan_revisi: 'Penyesuaian penambahan biaya akomodasi inspektur sesuai persetujuan klien',
    };

    // Attempt revision as Admin -> 403
    const adminRevRes = await fetch(`${baseUrl}/${jobId}/invoice-revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify(revisionPayload),
    });
    assert.equal(adminRevRes.status, 403, 'Admin must not revise invoices');

    // Revise invoice as Finance -> 200
    const finRevRes = await fetch(`${baseUrl}/${jobId}/invoice-revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'finance', 'x-user-name': 'Dewi (Finance)' },
      body: JSON.stringify(revisionPayload),
    });
    assert.equal(finRevRes.status, 200, 'Finance must be authorized to revise invoices');

    const result = await finRevRes.json();
    assert.equal(result.ok, true);
    assert.equal(result.job.stage, 11, 'Job stage must remain at Stage 11 (no unwanted rollback)');
    assert.equal(result.job.invoice_no, 'INV/2026/0045-REV');
    assert.equal(result.job.total_invoice_amount, 55000000);
    assert.ok(Array.isArray(result.job.invoice_revisions));
    assert.equal(result.job.invoice_revisions.length, 1);
    assert.equal(result.job.invoice_revisions[0].invoice_no, 'INV/2026/0045-REV');
    
    // Check audit trail
    const lastHistory = result.job.history[result.job.history.length - 1];
    assert.ok(lastHistory.action.includes('Revisi Invoice oleh Finance'));
    assert.ok(lastHistory.action.includes('INV/2026/0045-REV'));
  });

});
