import { Router } from 'express';
import db from '../db.js';
import { buildDemoJobs } from '../seed.js';

const router = Router();
const now = () => new Date().toISOString();

// GET /api/jobs — list all, sorted newest first
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT data FROM jobs ORDER BY created_at DESC'
    ).all();
    const jobs = rows.map(r => JSON.parse(r.data));
    res.json({ ok: true, jobs });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/jobs/seq/next — get & increment sequence counter
router.get('/seq/next', (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM app_state WHERE key = 'app:seq'").get();
    const next = (row ? JSON.parse(row.value) : 0) + 1;
    db.prepare(
      "INSERT INTO app_state (key, value) VALUES ('app:seq', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(JSON.stringify(next));
    res.json({ ok: true, seq: next });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/seed — clear all jobs and re-seed demo data
router.post('/seed', (req, res) => {
  try {
    const existing = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get();
    if (existing.cnt > 0 && !req.body?.force) {
      return res.json({ ok: true, seeded: false, message: 'Data already exists. POST with { force: true } to reseed.' });
    }
    db.prepare('DELETE FROM jobs').run();
    db.prepare("DELETE FROM app_state WHERE key != 'app:user'").run();

    const demos = buildDemoJobs();
    const insert = db.prepare(
      'INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
    );
    const seedMany = db.transaction((jobs) => {
      for (const j of jobs) insert.run(j.id, JSON.stringify(j), j.created_at, now());
    });
    seedMany(demos);
    db.prepare(
      "INSERT INTO app_state (key, value) VALUES ('app:seq', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(JSON.stringify(8));

    res.json({ ok: true, seeded: true, count: demos.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/jobs/:id — single job
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, job: JSON.parse(row.data) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs — create new job
router.post('/', (req, res) => {
  try {
    const job = req.body;
    if (!job?.id) return res.status(400).json({ ok: false, error: 'Job must have an id' });
    const ts = now();
    db.prepare(
      'INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(job.id, JSON.stringify(job), job.created_at || ts, ts);
    res.status(201).json({ ok: true, job });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(409).json({ ok: false, error: 'Job with this id already exists' });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUT /api/jobs/:id — upsert (create or update)
router.put('/:id', (req, res) => {
  try {
    const job = req.body;
    const ts = now();
    db.prepare(`
      INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(req.params.id, JSON.stringify(job), job.created_at || ts, ts);
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/jobs/:id — delete a job
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
