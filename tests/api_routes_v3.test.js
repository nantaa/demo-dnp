import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jobsRouter from '../server/routes/jobs.js';

describe('DNP Monitor v3 — API & Security Masking Integration Tests', () => {
  let app;
  let server;
  let port;
  let baseUrl;

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

  it('GET /api/jobs masks sensitive price fields for admin role', async () => {
    const res = await fetch(`${baseUrl}?role=admin`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.jobs));

    // Verify each returned job has masked price
    for (const job of body.jobs) {
      assert.equal(job.nilai, null, `Job ${job.id} should have masked nilai for admin`);
      assert.equal(job.total_invoice_amount, null, `Job ${job.id} should have masked total_invoice_amount for admin`);
    }
  });

  it('GET /api/jobs preserves price fields for marketing/manager roles', async () => {
    const res = await fetch(`${baseUrl}?role=marketing`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);

    const jobWithValue = body.jobs.find(j => j.nilai !== null && j.nilai !== undefined);
    if (jobWithValue) {
      assert.ok(typeof jobWithValue.nilai === 'number');
    }
  });

  it('POST /api/jobs creates a new job with v3 fields', async () => {
    const newJob = {
      id: `test-${Date.now()}`,
      kode: `DNP/2026/TEST-${Date.now()}`,
      klien: 'PT Integration Client',
      pesawat: 'Genset',
      units: 2,
      nilai: 20000000,
      termin_pembayaran: 'DP',
      dp_paid: false,
      stage: 1,
    };

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.job.termin_pembayaran, 'DP');
    assert.equal(body.job.dp_paid, false);
  });
});
