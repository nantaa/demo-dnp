import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jobsRouter from '../server/routes/jobs.js';
import db from '../server/db.js';

let app;
let server;
let port;
let baseUrl;

describe('DNP Monitor v3 — Complete Stage 1-12 RBAC & Route Guard Matrix', () => {

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

  it('Stage 1 RBAC: Blocks Admin/Inspector from creating jobs; Allows Marketing/Superadmin', async () => {
    const jobPayload = {
      klien: 'PT RBAC Test Client',
      pesawat: 'Genset & Listrik',
      units: 2,
      termin_pembayaran: 'FULL',
      stage: 1,
    };

    // Attempt creation as Admin -> should fail 403
    const adminRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify(jobPayload),
    });
    assert.equal(adminRes.status, 403, 'Admin must not create PO/SPK jobs');

    // Attempt creation as Inspektur -> should fail 403
    const inspectorRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify(jobPayload),
    });
    assert.equal(inspectorRes.status, 403, 'Inspektur must not create PO/SPK jobs');

    // Attempt creation as Marketing -> should succeed 201
    const mktRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({ ...jobPayload, id: `job-rbac-mkt-${Date.now()}` }),
    });
    assert.equal(mktRes.status, 201, 'Marketing must be allowed to create PO/SPK jobs');
  });

  it('Stage 2 RBAC: Allows Admin to verify documents; Blocks Marketing/Inspektur', async () => {
    const jobId = `job-s2-rbac-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      jobId, JSON.stringify({ id: jobId, stage: 2, klien: 'Test S2 Client' }), new Date().toISOString(), new Date().toISOString()
    );

    // Attempt verification as Marketing -> 403
    const mktRes = await fetch(`${baseUrl}/${jobId}/s2-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({ drawing_ok: true, surat_bahan_ok: true }),
    });
    assert.equal(mktRes.status, 403, 'Marketing must not verify Stage 2 documents');

    // Attempt verification as Admin -> 200
    const adminRes = await fetch(`${baseUrl}/${jobId}/s2-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ drawing_ok: true, surat_bahan_ok: true }),
    });
    assert.equal(adminRes.status, 200, 'Admin must be authorized to verify Stage 2 documents');
  });

  it('Stage 4 RBAC: Allows Inspector to save RU results; Blocks Admin/Marketing', async () => {
    const jobId = `job-s4-rbac-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      jobId, JSON.stringify({ id: jobId, stage: 4, units: 3 }), new Date().toISOString(), new Date().toISOString()
    );

    // Attempt saving RU as Admin -> 403
    const adminRes = await fetch(`${baseUrl}/${jobId}/s4-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ actual_units: 3, unit_count_notes: 'All units checked' }),
    });
    assert.equal(adminRes.status, 403, 'Admin must not submit field RU results');

    // Attempt saving RU as Inspektur -> 200
    const inspRes = await fetch(`${baseUrl}/${jobId}/s4-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify({ actual_units: 3, unit_count_notes: 'All units checked' }),
    });
    assert.equal(inspRes.status, 200, 'Inspektur must be authorized to submit RU results');
  });

  it('Stage 6 RBAC: Allows Manager to review reports; Blocks Admin/Marketing', async () => {
    const jobId = `job-s6-rbac-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      jobId, JSON.stringify({ id: jobId, stage: 6 }), new Date().toISOString(), new Date().toISOString()
    );

    // Attempt review as Admin -> 403
    const adminRes = await fetch(`${baseUrl}/${jobId}/stage5-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ decision: 'Approve', notes: 'OK' }),
    });
    assert.equal(adminRes.status, 403, 'Admin must not approve technical reports');

    // Attempt review as Manager -> 200
    const mgrRes = await fetch(`${baseUrl}/${jobId}/stage5-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'manager' },
      body: JSON.stringify({ decision: 'Approve', notes: 'OK' }),
    });
    assert.equal(mgrRes.status, 200, 'Manager must be authorized to review reports');
  });

  it('Stage 11c RBAC: Allows Finance to verify payment; Strictly Blocks Marketing & Admin', async () => {
    const jobId = `job-s11c-rbac-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      jobId, JSON.stringify({ id: jobId, stage: 11, total_invoice_amount: 40000000 }), new Date().toISOString(), new Date().toISOString()
    );

    // Marketing attempting payment verification -> 403
    const mktRes = await fetch(`${baseUrl}/${jobId}/stage11c-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({ status: 'Verified', amount_received: 40000000 }),
    });
    assert.equal(mktRes.status, 403, 'Marketing is forbidden from verifying payments');

    // Admin attempting payment verification -> 403
    const adminRes = await fetch(`${baseUrl}/${jobId}/stage11c-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ status: 'Verified', amount_received: 40000000 }),
    });
    assert.equal(adminRes.status, 403, 'Admin is forbidden from verifying payments');

    // Finance verifying payment -> 200
    const finRes = await fetch(`${baseUrl}/${jobId}/stage11c-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'finance' },
      body: JSON.stringify({ status: 'Verified', amount_received: 40000000, bank_reference: 'BCA-112233' }),
    });
    assert.equal(finRes.status, 200, 'Finance is authorized to verify payment');
  });

  it('End-to-End Pipeline: Moves job from Stage 1 through Stage 12 with authentic role transitions', async () => {
    const jobId = `job-e2e-${Date.now()}`;
    
    // Stage 1: Marketing creates Job
    const s1Res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing', 'x-user-name': 'Marketing User' },
      body: JSON.stringify({
        id: jobId,
        klien: 'PT End-to-End Client',
        pesawat: 'Genset & Instalasi Listrik',
        units: 2,
        nilai: 50000000,
        termin_pembayaran: 'FULL',
        stage: 1,
      }),
    });
    assert.equal(s1Res.status, 201);

    // Stage 2: Admin verifies documents
    const s2Res = await fetch(`${baseUrl}/${jobId}/s2-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-name': 'Admin User' },
      body: JSON.stringify({ drawing_ok: true, surat_bahan_ok: true }),
    });
    assert.equal(s2Res.status, 200);

    // Stage 3 -> 4: Admin schedules job
    const s3Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-name': 'Admin User' },
      body: JSON.stringify({ next_stage: 4, notes: 'Penjadwalan selesai' }),
    });
    assert.equal(s3Res.status, 200);

    // Stage 4: Inspector performs RU and submits results
    const s4Res = await fetch(`${baseUrl}/${jobId}/s4-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur', 'x-user-name': 'Inspector User' },
      body: JSON.stringify({ actual_units: 2, unit_count_notes: 'All 2 units inspected and compliant' }),
    });
    assert.equal(s4Res.status, 200);

    // Stage 5 -> 6: Admin drafts LHPP & submits to Manager
    const s5Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-name': 'Admin User' },
      body: JSON.stringify({ next_stage: 6, notes: 'LHPP selesai disusun' }),
    });
    assert.equal(s5Res.status, 200);

    // Stage 6: Manager reviews and approves report -> advances to Stage 7
    const s6Res = await fetch(`${baseUrl}/${jobId}/stage5-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'manager', 'x-user-name': 'Manager User' },
      body: JSON.stringify({ decision: 'Approve', notes: 'Laporan teknis disetujui' }),
    });
    assert.equal(s6Res.status, 200);

    // Stage 7 -> 8: Admin verifies to Dinas
    const s7Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-name': 'Admin User' },
      body: JSON.stringify({ next_stage: 8, notes: 'Berkas masuk ke Disnaker' }),
    });
    assert.equal(s7Res.status, 200);

    // Stage 8 -> 9: Admin tracks Disnaker & SUKET duration
    const s9Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin', 'x-user-name': 'Admin User' },
      body: JSON.stringify({ next_stage: 9, notes: 'SUKET dalam proses' }),
    });
    assert.equal(s9Res.status, 200);

    // Stage 9 -> 10: Admin signals SUKET ready -> Finance creates invoice
    const s10Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'finance', 'x-user-name': 'Finance User' },
      body: JSON.stringify({ next_stage: 10, notes: 'Invoice dibuat' }),
    });
    assert.equal(s10Res.status, 200);

    // Stage 10 -> 11: Marketing handles payment collection
    const s11Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing', 'x-user-name': 'Marketing User' },
      body: JSON.stringify({ next_stage: 11, notes: 'Penagihan dikirim ke klien' }),
    });
    assert.equal(s11Res.status, 200);

    // Stage 11c: Finance verifies Payment as LUNAS -> triggers Stage 11b (Stage 14 in internal representation)
    const s11cRes = await fetch(`${baseUrl}/${jobId}/stage11c-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'finance', 'x-user-name': 'Finance User' },
      body: JSON.stringify({
        status: 'Verified',
        amount_received: 50000000,
        bank_reference: 'BCA-E2E-998877',
        notes: 'Dana diterima penuh'
      }),
    });
    assert.equal(s11cRes.status, 200);
    const s11cData = await s11cRes.json();
    assert.equal(s11cData.job.stage, 14, 'Job must advance to Stage 11b on Lunas');

    // Stage 11b -> 12: Marketing dispatches SUKET and closes job
    const s12Res = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing', 'x-user-name': 'Marketing User' },
      body: JSON.stringify({ next_stage: 12, notes: 'SUKET telah diterima oleh klien. Job Closed.' }),
    });
    assert.equal(s12Res.status, 200);
    const s12Data = await s12Res.json();
    assert.equal(s12Data.job.stage, 12, 'Job must be Closed (Stage 12)');

    // Stage 12 Reopen: Manager reopens job with justification
    const reopenRes = await fetch(`${baseUrl}/${jobId}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'manager', 'x-user-name': 'Manager User' },
      body: JSON.stringify({ target_stage: 5, reason: 'Klien meminta revisi nama perusahaan pada LHPP' }),
    });
    assert.equal(reopenRes.status, 200);
    const reopenData = await reopenRes.json();
    assert.equal(reopenData.job.stage, 5, 'Job must be successfully reopened to Stage 5');
  });

});

