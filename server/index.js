import express from 'express';
import cors from 'cors';
import db from './db.js';
import { buildDemoJobs } from './seed.js';
import jobsRouter from './routes/jobs.js';
import appRouter from './routes/app.js';

const app = express();
const PORT = 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));

// ── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.path} ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/jobs', jobsRouter);
app.use('/jobs', jobsRouter);
app.use('/api/app', appRouter);

// Master data endpoint
app.get('/api/master-data', (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM app_state WHERE key = 'master:data'").get();
    if (row) {
      return res.json(JSON.parse(row.value));
    }
    res.json({ alat_uji: [], sertifikat_pjk3: [], regulasi: [], form_disnaker: [] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Notification endpoints
app.get('/api/notifications', (req, res) => {
  res.json({ ok: true, notifications: [] });
});
app.post('/api/notifications/:id/read', (req, res) => {
  res.json({ ok: true });
});
app.post('/api/notifications/read-all', (req, res) => {
  res.json({ ok: true });
});

// Kanban endpoint (handles Inertia background polling & requests)
app.get('/kanban', (req, res) => {
  const rows = db.prepare('SELECT data FROM jobs ORDER BY created_at DESC').all();
  const jobs = rows.map(r => JSON.parse(r.data));
  const payload = {
    component: 'Kanban/Index',
    props: {
      jobs,
      auth: {
        user: {
          id: 1,
          name: 'Super Administrator',
          role: 'superadmin',
          email: 'superadmin@deltaindo.co.id'
        },
        permissions: 'superadmin'
      }
    },
    url: '/kanban',
    version: '1.0'
  };

  if (req.headers['x-inertia']) {
    res.setHeader('X-Inertia', 'true');
    res.setHeader('Vary', 'X-Inertia');
    return res.json(payload);
  }
  res.json(payload);
});

// Health check
app.get('/api/health', (req, res) => {
  const jobCount = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get().cnt;
  res.json({ ok: true, jobs: jobCount, timestamp: new Date().toISOString() });
});

// ── Auto-seed on first run ───────────────────────────────────────────────────
function seedIfEmpty() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get();
  if (existing.cnt > 0) {
    console.log(`\x1b[36m[DB]\x1b[0m Found ${existing.cnt} existing jobs, skipping seed.`);
    return;
  }
  const demos = buildDemoJobs();
  const insert = db.prepare(
    'INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
  );
  const seedMany = db.transaction((jobs) => {
    const ts = new Date().toISOString();
    for (const j of jobs) insert.run(j.id, JSON.stringify(j), j.created_at, ts);
  });
  seedMany(demos);
  db.prepare(
    "INSERT INTO app_state (key, value) VALUES ('app:seq', '8') ON CONFLICT(key) DO UPDATE SET value = '8'"
  ).run();
  console.log(`\x1b[36m[DB]\x1b[0m Seeded ${demos.length} demo jobs.`);
}

// ── Start ─────────────────────────────────────────────────────────────────────
seedIfEmpty();
app.listen(PORT, () => {
  console.log(`\x1b[35m[DNP Server]\x1b[0m Running at http://localhost:${PORT}`);
  console.log(`\x1b[35m[DNP Server]\x1b[0m Health: http://localhost:${PORT}/api/health`);
});
