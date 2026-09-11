import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jobsRouter from '../server/routes/jobs.js';
import db from '../server/db.js';

let app;
let server;
let port;
let baseUrl;

describe('DNP Monitor v3 — Comprehensive RBAC & Route Guard Hardening Suite', () => {

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

  it('POST /api/jobs/:id/move — Stage Transition Guard enforces actor role by target stage', async () => {
    const jobId = `job-move-rbac-${Date.now()}`;
    const initialJob = {
      id: jobId,
      stage: 5,
      klien: 'PT Hardened RBAC Test',
      units: 1,
    };
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      jobId, JSON.stringify(initialJob), new Date().toISOString(), new Date().toISOString()
    );

    // Inspector attempts to advance Stage 5 -> Stage 6 (Review QC): MUST FAIL 403 (Only Admin/Superadmin advances to QC or Manager reviews)
    const inspMoveRes = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify({ next_stage: 6 }),
    });
    assert.equal(inspMoveRes.status, 403, 'Inspector must not advance job to Stage 6 (QC)');

    // Marketing attempts to advance Stage 5 -> Stage 6: MUST FAIL 403
    const mktMoveRes = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({ next_stage: 6 }),
    });
    assert.equal(mktMoveRes.status, 403, 'Marketing must not advance job to Stage 6 (QC)');

    // Admin advances Stage 5 -> Stage 6: MUST SUCCEED 200
    const adminMoveRes = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ next_stage: 6 }),
    });
    assert.equal(adminMoveRes.status, 200, 'Admin must be authorized to submit LHPP to Stage 6 (QC)');

    // Stage 6 -> Stage 7 (Verifikasi ke Dinas): Admin attempts -> MUST FAIL 403 (Only Manager/Kadiv/Superadmin approves Stage 6 QC)
    const adminApproveRes = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ next_stage: 7 }),
    });
    assert.equal(adminApproveRes.status, 403, 'Admin must not approve Stage 6 QC into Stage 7');

    // Manager approves Stage 6 -> Stage 7: MUST SUCCEED 200
    const mgrApproveRes = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'manager' },
      body: JSON.stringify({ next_stage: 7 }),
    });
    assert.equal(mgrApproveRes.status, 200, 'Manager must be authorized to approve Stage 6 QC to Stage 7');

    // Finance attempts to move Stage 7 -> Stage 8: MUST FAIL 403 (Stage 8 Disnaker is Admin only)
    const finMoveRes = await fetch(`${baseUrl}/${jobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'finance' },
      body: JSON.stringify({ next_stage: 8 }),
    });
    assert.equal(finMoveRes.status, 403, 'Finance must not move job to Stage 8 (Disnaker)');
  });

  it('Stage-specific endpoint guards: Blocks unauthorized roles on execution endpoints', async () => {
    const s4JobId = `job-s4-guards-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      s4JobId, JSON.stringify({ id: s4JobId, stage: 4, units: 2 }), new Date().toISOString(), new Date().toISOString()
    );

    // POST /api/jobs/:id/stage4-data -> Admin MUST FAIL 403
    const s4AdminRes = await fetch(`${baseUrl}/${s4JobId}/stage4-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ catatan_lapangan: 'Admin note' }),
    });
    assert.equal(s4AdminRes.status, 403, 'Admin must not submit stage4-data');

    // POST /api/jobs/:id/stage4-data -> Inspektur MUST SUCCEED 200
    const s4InspRes = await fetch(`${baseUrl}/${s4JobId}/stage4-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify({ catatan_lapangan: 'Inspector inspection note' }),
    });
    assert.equal(s4InspRes.status, 200, 'Inspektur must be permitted to submit stage4-data');

    // POST /api/jobs/:id/stage4c-data -> Marketing MUST FAIL 403 (Admin/Superadmin only)
    const s4cMktRes = await fetch(`${baseUrl}/${s4JobId}/stage4c-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({ reschedule_reason: 'Client requested' }),
    });
    assert.equal(s4cMktRes.status, 403, 'Marketing must not submit stage4c-data');

    // POST /api/jobs/:id/stage4c-data -> Admin MUST SUCCEED 200
    const s4cAdminRes = await fetch(`${baseUrl}/${s4JobId}/stage4c-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ reschedule_reason: 'Client requested' }),
    });
    assert.equal(s4cAdminRes.status, 200, 'Admin must be permitted to submit stage4c-data');

    // POST /api/jobs/:id/stage4d-data -> Admin MUST FAIL 403 (Inspektur only)
    const s4dAdminRes = await fetch(`${baseUrl}/${s4JobId}/stage4d-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ ru_ulang_status: 'Lolos' }),
    });
    assert.equal(s4dAdminRes.status, 403, 'Admin must not submit stage4d-data');

    // POST /api/jobs/:id/stage4d-data -> Inspektur MUST SUCCEED 200
    const s4dInspRes = await fetch(`${baseUrl}/${s4JobId}/stage4d-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify({ ru_ulang_status: 'Lolos' }),
    });
    assert.equal(s4dInspRes.status, 200, 'Inspektur must be permitted to submit stage4d-data');

    // POST /api/jobs/:id/stage5-dates -> Marketing MUST FAIL 403 (Admin only)
    const s5MktRes = await fetch(`${baseUrl}/${s4JobId}/stage5-dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({ tgl_draft_lhpp: '2026-09-12' }),
    });
    assert.equal(s5MktRes.status, 403, 'Marketing must not submit stage5-dates');

    // POST /api/jobs/:id/stage9-suket -> Inspector MUST FAIL 403 (Admin only)
    const s9InspRes = await fetch(`${baseUrl}/${s4JobId}/stage9-suket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify({ no_suket: 'SK-1234' }),
    });
    assert.equal(s9InspRes.status, 403, 'Inspector must not submit stage9-suket');
  });

  it('Fail-closed check: Mutating actions without x-user-role must be rejected 403', async () => {
    const unauthJobId = `job-unauth-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      unauthJobId, JSON.stringify({ id: unauthJobId, stage: 1 }), new Date().toISOString(), new Date().toISOString()
    );

    // Attempting move without role header -> 403
    const moveRes = await fetch(`${baseUrl}/${unauthJobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_stage: 2 }),
    });
    assert.equal(moveRes.status, 403, 'Unauthenticated/role-less move must fail with 403');

    // Attempting job creation without role header -> 403
    const createRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klien: 'No Role Co', stage: 1, termin_pembayaran: 'FULL' }),
    });
    assert.equal(createRes.status, 403, 'Unauthenticated/role-less creation must fail with 403');
  });

  it('PUT /api/jobs/:id — Stage state manipulation via PUT is guarded by role', async () => {
    const putJobId = `job-put-rbac-${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      putJobId, JSON.stringify({ id: putJobId, stage: 2 }), new Date().toISOString(), new Date().toISOString()
    );

    // Inspector attempts to PUT job with stage changed to 12 -> 403
    const inspPutRes = await fetch(`${baseUrl}/${putJobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'inspektur' },
      body: JSON.stringify({ id: putJobId, stage: 12, klien: 'Hacked Stage' }),
    });
    assert.equal(inspPutRes.status, 403, 'Inspector must not arbitrarily change job stage via PUT');
  });

});
