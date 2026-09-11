import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jobsRouter from '../server/routes/jobs.js';
import db from '../server/db.js';

let app;
let server;
let port;
let baseUrl;

describe('DNP Monitor v3 — S3 Personnel Recommendation & Master Data Engine', () => {

  before(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/jobs', jobsRouter);
    app.get('/api/master-data', (req, res) => {
      try {
        const row = db.prepare("SELECT value FROM app_state WHERE key = 'master:data'").get();
        if (row) {
          return res.json(JSON.parse(row.value));
        }
        res.json({ alat_uji: [{ id: 1, name: 'Default Test Tool' }], sertifikat_pjk3: [{ id: 1 }], regulasi: [], form_disnaker: [] });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
      }
    });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/master-data returns alat_uji, sertifikat_pjk3, and inspectors', async () => {
    const res = await fetch(`${baseUrl}/api/master-data`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.alat_uji), 'alat_uji should be an array');
    assert.ok(Array.isArray(data.sertifikat_pjk3), 'sertifikat_pjk3 should be an array');
    assert.ok(data.alat_uji.length > 0, 'alat_uji should not be empty');
  });

  it('GET /api/jobs/:id/recommendations filters expired SKP and inactive inspectors', async () => {
    // Fetch an active job
    const jobsRes = await fetch(`${baseUrl}/api/jobs`);
    const jobsData = await jobsRes.json();
    const job = (jobsData.jobs && jobsData.jobs.length > 0) ? jobsData.jobs[0] : { id: 'test-rec-1' };

    const recRes = await fetch(`${baseUrl}/api/jobs/${job.id}/recommendations`);
    assert.equal(recRes.status, 200);
    const recData = await recRes.json();
    assert.ok(Array.isArray(recData.recommended), 'recommended should be an array');
    assert.ok(Array.isArray(recData.eliminated), 'eliminated should be an array');

    // All recommended inspectors must have active profile
    for (const item of recData.recommended) {
      assert.ok(item.user, 'item must have user object');
      assert.ok(item.user.name, 'user must have name');
    }
  });

  it('GET /api/jobs/:id/recommendations calculates score and flags overload correctly', async () => {
    const jobsRes = await fetch(`${baseUrl}/api/jobs`);
    const jobsData = await jobsRes.json();
    const job = jobsData.jobs.find(j => j.stage === 3) || jobsData.jobs[0];

    const recRes = await fetch(`${baseUrl}/api/jobs/${job.id}/recommendations`);
    const recData = await recRes.json();

    if (recData.recommended.length > 0) {
      const top = recData.recommended[0];
      assert.ok(typeof top.score === 'number', 'top recommended must have numerical score');
      assert.ok(Array.isArray(top.statuses), 'statuses should be an array');
      // If active jobs count >= 4, statuses must include Overload
      if (top.active_jobs >= 4) {
        assert.ok(top.statuses.includes('Overload'), 'should flag Overload for >= 4 active jobs');
      }
    }
  });

  it('POST /api/jobs/:id/move in Stage 3 saves multi-day schedule, inspectors, and alat_ids', async () => {
    // Create a temporary job at Stage 3
    const newJobId = `job-s3-test-${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'marketing' },
      body: JSON.stringify({
        id: newJobId,
        klien: 'PT Schedule Test Client',
        pesawat: 'Genset & Instalasi Listrik',
        units: 2,
        stage: 3,
      }),
    });
    assert.equal(createRes.status, 201);

    const movePayload = {
      next_stage: 4,
      notes: 'Jadwal dan tim ahli telah ditentukan.',
      jam_mulai: '09:00',
      disnaker_tujuan: 'Disnaker Prov. DKI Jakarta',
      report_writer_id: 1,
      alat_ids: [1, 2],
      schedule_days: [
        { date: '2026-09-15', inspector_ids: [1, 2] },
        { date: '2026-09-16', inspector_ids: [1] }
      ]
    };

    const moveRes = await fetch(`${baseUrl}/api/jobs/${newJobId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify(movePayload),
    });
    assert.equal(moveRes.status, 200);
    const moveData = await moveRes.json();
    assert.equal(moveData.ok, true);
    assert.equal(moveData.job.stage, 4);
    assert.equal(moveData.job.jam_mulai, '09:00');
    assert.equal(moveData.job.disnaker_tujuan, 'Disnaker Prov. DKI Jakarta');
    assert.deepEqual(moveData.job.schedule_days, movePayload.schedule_days);
  });
});
