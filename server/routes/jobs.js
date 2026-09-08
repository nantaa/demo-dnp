import { Router } from 'express';
import db from '../db.js';
import { buildDemoJobs } from '../seed.js';
import {
  maskSensitiveData,
  STAGE2_REQUIRED_DOCUMENTS,
  canBypassStage2,
  hasDocumentDebt,
  splitJob
} from '../../src/domain/workflowEngine.js';

const router = Router();
const now = () => new Date().toISOString();

// GET /api/jobs — list all, sorted newest first
router.get('/', (req, res) => {
  try {
    const role = req.headers['x-user-role'] || req.query.role;
    const rows = db.prepare(
      'SELECT data FROM jobs ORDER BY created_at DESC'
    ).all();
    let jobs = rows.map(r => JSON.parse(r.data));
    if (role === 'admin') {
      jobs = jobs.map(j => maskSensitiveData(j, 'admin'));
    }
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

// GET /api/jobs/create or /jobs/create — render create form for Inertia
router.get('/create', (req, res) => {
  const payload = {
    component: 'Jobs/Create',
    props: {
      auth: {
        user: {
          id: 1,
          name: 'Terzha R. Perdanawan',
          role: 'marketing',
          email: 'terzha@deltaindo.co.id'
        },
        permissions: 'superadmin'
      }
    },
    url: '/jobs/create',
    version: '1.0'
  };

  if (req.headers['x-inertia']) {
    res.setHeader('X-Inertia', 'true');
    res.setHeader('Vary', 'X-Inertia');
    return res.json(payload);
  }
  res.json(payload);
});

// GET /api/jobs/:id/recommendations — smart inspector recommendations (TDD v3)
router.get('/:id/recommendations', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    const targetJob = row ? JSON.parse(row.data) : { id: req.params.id, pesawat: '', klien: '', lokasi: '' };

    // Load inspectors from app_state or users
    let inspectors = [];
    const inspRow = db.prepare("SELECT value FROM app_state WHERE key = 'app:inspectors'").get();
    if (inspRow) {
      inspectors = JSON.parse(inspRow.value);
    } else {
      const usersRow = db.prepare("SELECT value FROM app_state WHERE key = 'app:users'").get();
      if (usersRow) {
        inspectors = JSON.parse(usersRow.value).filter(u => u.role === 'inspektur' || u.role === 'manager');
      }
    }

    if (!inspectors || inspectors.length === 0) {
      inspectors = [
        { id: 1, name: 'Pranan Jaya, S.T.', role: 'inspektur', inspector_profile: { active: true, skp_expired_at: '2027-12-31', spesialisasi: ['Instalasi Listrik & PP', 'PTP (Compressor/Genset)', 'Proteksi Kebakaran'], domisili: 'Bekasi', senior_level: 3, subrole: 'ahli_k3' } },
        { id: 2, name: 'Adi Octa Pratama, S.T.', role: 'inspektur', inspector_profile: { active: true, skp_expired_at: '2027-08-15', spesialisasi: ['PAPA (Crane/Forklift/dll)', 'Lift / Dumbwaiter', 'Instalasi Listrik & PP'], domisili: 'Jakarta', senior_level: 2, subrole: 'tenaga_ahli' } },
        { id: 3, name: 'Tedy Kurniawan, S.T.', role: 'inspektur', inspector_profile: { active: true, skp_expired_at: '2028-05-20', spesialisasi: ['Pesawat Uap (Boiler)', 'Bejana Tekan', 'PTP (Compressor/Genset)'], domisili: 'Karawang', senior_level: 2, subrole: 'ahli_k3' } },
        { id: 4, name: 'Rangga Prawira, S.T.', role: 'inspektur', inspector_profile: { active: true, skp_expired_at: '2027-10-10', spesialisasi: ['Proteksi Kebakaran', 'Instalasi Listrik & PP'], domisili: 'Tangerang', senior_level: 1, subrole: 'tenaga_ahli' } },
        { id: 5, name: 'Bambang Supriyanto', role: 'inspektur', inspector_profile: { active: false, skp_expired_at: '2024-01-01', spesialisasi: ['PAPA (Crane/Forklift/dll)'], domisili: 'Jakarta', senior_level: 1, subrole: 'tenaga_ahli' } },
      ];
    }

    // Active jobs count per inspector
    const allRows = db.prepare('SELECT data FROM jobs').all();
    const allJobs = allRows.map(r => JSON.parse(r.data));
    const activeStages = [3, 4, 5, 6, 7, 8, 9, 10, 11];

    const activeCounts = {};
    const clientHistoryCounts = {};
    for (const j of allJobs) {
      if (j.id === targetJob.id) continue;
      const assignedIds = new Set();
      if (Array.isArray(j.inspectors)) {
        j.inspectors.forEach(ins => assignedIds.add(String(ins.id || ins.user_id || ins.user?.id)));
      }
      if (Array.isArray(j.schedule_days)) {
        j.schedule_days.forEach(d => {
          if (Array.isArray(d.inspector_ids)) {
            d.inspector_ids.forEach(id => assignedIds.add(String(id)));
          }
        });
      }
      assignedIds.forEach(uid => {
        if (activeStages.includes(Number(j.stage))) {
          activeCounts[uid] = (activeCounts[uid] || 0) + 1;
        }
        if (j.stage === 12 && j.klien && j.klien === targetJob.klien) {
          clientHistoryCounts[uid] = (clientHistoryCounts[uid] || 0) + 1;
        }
      });
    }

    const recommended = [];
    const eliminated = [];
    const targetPesawat = (targetJob.pesawat || '').toLowerCase();
    const targetLokasi = (targetJob.lokasi || '').toLowerCase();

    for (const rawUser of inspectors) {
      const user = rawUser.user || rawUser;
      const profile = rawUser.inspector_profile || rawUser.inspectorProfile || user.inspector_profile || user.inspectorProfile || {
        active: true,
        skp_expired_at: '2027-12-31',
        spesialisasi: [],
        domisili: 'Jakarta',
        senior_level: 1,
        subrole: 'tenaga_ahli'
      };

      const uid = String(user.id);
      const isDiba = (user.name || '').includes('Diba Aini');
      if (isDiba) continue;

      // ── Hard Filters ───────────────────────────────────────
      if (profile.active === false || user.is_active === false) {
        eliminated.push({ user, profile, reason: 'Status Inactive' });
        continue;
      }
      if (profile.skp_expired_at) {
        const expDate = new Date(profile.skp_expired_at);
        if (!isNaN(expDate.getTime()) && expDate < new Date()) {
          eliminated.push({ user, profile, reason: 'SKP Expired' });
          continue;
        }
      }

      // ── Scoring ───────────────────────────────────────────
      let score = 50;
      const statuses = [];
      const reasons = [];

      // Specialization match (+40)
      const specs = Array.isArray(profile.spesialisasi)
        ? profile.spesialisasi
        : (typeof profile.spesialisasi === 'string' ? JSON.parse(profile.spesialisasi || '[]') : []);
      
      let hasSpecMatch = false;
      for (const sp of specs) {
        const sLower = String(sp).toLowerCase();
        if (targetPesawat && (targetPesawat.includes(sLower) || sLower.includes(targetPesawat.slice(0, 5)))) {
          hasSpecMatch = true;
          break;
        }
      }
      if (hasSpecMatch || specs.length === 0) {
        score += 40;
        reasons.push('Spesialisasi Cocok');
      }

      // Domicile / location proximity (+20)
      const dom = (profile.domisili || '').toLowerCase();
      if (dom && targetLokasi && (targetLokasi.includes(dom) || dom.includes(targetLokasi))) {
        score += 20;
        reasons.push(`Domisili Dekat (${profile.domisili})`);
      }

      // Client experience (+10)
      const prevJobs = clientHistoryCounts[uid] || 0;
      if (prevJobs > 0) {
        score += Math.min(20, prevJobs * 10);
        reasons.push(`Pernah Riksa Klien Ini (${prevJobs}x)`);
      }

      // Active workload count
      const activeCount = activeCounts[uid] || 0;
      if (activeCount >= 4) {
        score -= 20;
        statuses.push('Overload');
        reasons.push(`Beban Kerja Tinggi (${activeCount} Job Aktif)`);
      }

      score += (profile.senior_level || 1) * 2;

      recommended.push({
        user,
        profile,
        score,
        active_jobs: activeCount,
        statuses,
        reasons,
        bonuses: reasons,
        klien_exp: prevJobs,
        pesawat_exp: hasSpecMatch ? 1 : 0,
        details: {
          'Spesialisasi': hasSpecMatch ? '40/40' : '0/40',
          'Domisili': dom && targetLokasi && targetLokasi.includes(dom) ? '20/20' : '10/20',
          'Pengalaman': prevJobs > 0 ? `${Math.min(20, prevJobs * 10)}/20` : '5/20',
          'Beban Kerja': activeCount >= 4 ? '0/20' : '20/20',
        }
      });
    }

    recommended.sort((a, b) => b.score - a.score);

    res.json({
      job_id: targetJob.id,
      pesawat: targetJob.pesawat,
      klien: targetJob.klien,
      recommended,
      eliminated,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/jobs/:id — single job
router.get('/:id', (req, res) => {
  try {
    const role = req.headers['x-user-role'] || req.query.role;
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    let job = JSON.parse(row.data);
    if (role === 'admin') {
      job = maskSensitiveData(job, 'admin');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs & /jobs — create new job
router.post('/', (req, res) => {
  try {
    const data = req.body || {};
    const ts = now();
    const id = data.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Generate sequential kode if not present
    let kode = data.kode;
    if (!kode) {
      const row = db.prepare("SELECT value FROM app_state WHERE key = 'app:seq'").get();
      const next = (row ? JSON.parse(row.value) : 0) + 1;
      db.prepare(
        "INSERT INTO app_state (key, value) VALUES ('app:seq', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run(JSON.stringify(next));
      kode = `DNP/2026/${String(next).padStart(4, '0')}`;
    }

    const newJob = {
      ...data,
      id,
      kode,
      stage: data.stage || 1,
      klien: data.klien || '',
      lokasi: data.lokasi || '',
      pesawat: Array.isArray(data.pesawat) ? data.pesawat.join(', ') : (data.pesawat || ''),
      units: parseInt(data.units) || 1,
      nilai: parseFloat(data.nilai) || 0,
      no_po: data.no_po || '',
      tgl_po: data.tgl_po || ts.slice(0, 10),
      owner_marketing: data.owner_marketing || 'Terzha R. Perdanawan',
      pic_klien: data.pic_klien || '',
      pic_klien_phone: data.pic_klien_phone || '',
      created_at: ts,
      updated_at: ts,
      documents: data.documents || [],
      history: data.history || [
        { stage: 1, ts, by: data.owner_marketing || 'Marketing', action: 'Job dibuat dari PO/SPK' }
      ]
    };

    db.prepare(
      'INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(id, JSON.stringify(newJob), ts, ts);

    if (req.headers['x-inertia']) {
      res.setHeader('X-Inertia-Location', '/kanban');
      return res.redirect(303, '/kanban');
    }
    res.status(201).json({ ok: true, job: newJob });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/s4-save — save actual_units and unit_count_notes (S4 & S4d)
router.post('/:id/s4-save', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    if (req.body.actual_units != null) job.actual_units = parseInt(req.body.actual_units);
    if (req.body.unit_count_notes !== undefined) job.unit_count_notes = req.body.unit_count_notes;
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
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

// DELETE /api/jobs/clear-all — clear all jobs
router.delete('/clear-all', (req, res) => {
  try {
    db.prepare('DELETE FROM jobs').run();
    res.json({ ok: true, message: 'All jobs cleared' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/move — transition job stage
router.post('/:id/move', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const body = req.body || {};
    const nested = body.data || {};
    const oldStage = job.stage;

    // Merge attributes
    const merged = { ...job, ...nested, ...body };
    const next_stage = body.next_stage !== undefined ? body.next_stage : nested.next_stage;
    if (next_stage !== undefined) {
      merged.stage = Number(next_stage);
      merged.stage_started_at = now();
    }

    if (!merged.history) merged.history = [];
    merged.history.push({
      stage: merged.stage,
      ts: now(),
      by: body.actor || req.headers['x-user-name'] || 'User',
      action: `Pindah dari Stage ${oldStage} ke Stage ${merged.stage}. ${body.notes || nested.notes || ''}`.trim()
    });

    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(merged), ts, req.params.id
    );

    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job: merged });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/s2-verify — update stage 2 verification checklist
router.post('/:id/s2-verify', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    job.s2_verify_data = req.body.s2_verify_data || req.body;
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/payment-verification — update stage 11c payment verification (v5-2-2)
router.post('/:id/payment-verification', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const { payment_type, verification_status, status, amount, amount_received, bank_reference, verified_by, notes, bukti_url } = req.body;
    
    const finalStatus = status || verification_status || 'Pending';
    const isLunas = finalStatus.toLowerCase() === 'verified' || finalStatus.toLowerCase() === 'lunas';

    job.payment_verification = {
      payment_type: payment_type || 'Pelunasan',
      status: isLunas ? 'Verified' : finalStatus,
      amount: amount || amount_received,
      amount_received: amount_received || amount,
      bank_reference,
      verified_by: verified_by || 'Finance',
      verified_at: now(),
      notes: notes || '',
      bukti_url
    };

    if (isLunas) {
      if (payment_type === 'DP') {
        job.dp_paid = true;
      } else {
        job.pelunasan_paid = true;
      }
      job.stage = 14; // Stage 11b: Kirim SUKET ke Klien
      job.history = job.history || [];
      job.history.push({
        stage: 14,
        ts: now(),
        by: verified_by || 'Finance',
        action: 'Verifikasi Pembayaran: LUNAS — SUKET siap dikirim ke klien (Stage 11b)',
        notes
      });
    } else {
      // Partial / Pending -> Loop back to Stage 11 (Penagihan Pembayaran - Marketing)
      job.payment_retry_count = (job.payment_retry_count || 0) + 1;
      job.stage = 11;
      job.history = job.history || [];
      job.history.push({
        stage: 11,
        ts: now(),
        by: verified_by || 'Finance',
        action: `Verifikasi Pembayaran: ${finalStatus.toUpperCase()} — Job dikembalikan ke Stage 11 untuk penagihan ulang (Retry #${job.payment_retry_count})`,
        notes
      });
    }

    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/stage4-data — save stage 4 execution & photos
router.post('/:id/stage4-data', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    job.stage4_data = { ...(job.stage4_data || {}), ...req.body };
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/stage4c-data — save stage 4c reschedule data
router.post('/:id/stage4c-data', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    job.stage4c_data = { ...(job.stage4c_data || {}), ...req.body };
    if (req.body.reschedule_reason) job.reschedule_reason = req.body.reschedule_reason;
    if (req.body.tgl_reschedule) job.tgl_reschedule = req.body.tgl_reschedule;
    if (req.body.reschedule_notes) job.reschedule_notes = req.body.reschedule_notes;
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/stage4d-data — save stage 4d RU Ulang data
router.post('/:id/stage4d-data', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    job.stage4d_data = { ...(job.stage4d_data || {}), ...req.body };
    if (req.body.actual_units != null) job.actual_units = parseInt(req.body.actual_units);
    if (req.body.unit_count_notes !== undefined) job.unit_count_notes = req.body.unit_count_notes;
    if (req.body.ru_ulang_status) job.ru_ulang_status = req.body.ru_ulang_status;
    if (req.body.ru_ulang_notes) job.ru_ulang_notes = req.body.ru_ulang_notes;
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/stage5-dates — save stage 5 milestone dates
router.post('/:id/stage5-dates', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    job.stage5_dates = { ...(job.stage5_dates || {}), ...req.body };
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/stage9-suket — save stage 9 suket duration tracking
router.post('/:id/stage9-suket', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    job.stage9_suket = { ...(job.stage9_suket || {}), ...req.body };
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/bypass-stage2 — approve Stage 2 bypass with justification & document debt logging
router.post('/:id/bypass-stage2', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const { justification } = req.body;
    const actorRole = req.headers['x-user-role'] || 'manager';
    const actorName = req.headers['x-user-name'] || 'Kadiv Teknis';

    const check = canBypassStage2({ role: actorRole, name: actorName }, justification);
    if (!check.allowed) {
      return res.status(403).json({ ok: false, error: check.reason });
    }

    const uploadedTypes = (job.documents || []).map(d => d.type);
    const missingDocs = STAGE2_REQUIRED_DOCUMENTS.filter(docType => !uploadedTypes.includes(docType));

    job.peer_review_status = 'approved';
    job.bypass_justification = justification;
    job.bypassed_by = actorName;
    job.bypassed_at = now();
    job.document_debt = missingDocs;
    job.document_debt_flag = missingDocs.length > 0;

    job.history = job.history || [];
    job.history.push({
      stage: 2,
      ts: now(),
      by: actorName,
      action: `Approval Bypass Dokumen Stage 2 disetujui. Justifikasi: "${justification}". Hutang dokumen: ${missingDocs.length} berkas.`
    });

    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/split — split failing units into child job
router.post('/:id/split', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const { child_unit_ids = [] } = req.body;

    const { parentJob, childJob } = splitJob(job, child_unit_ids);
    const ts = now();

    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(parentJob), ts, req.params.id
    );

    db.prepare(
      'INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(childJob.id, JSON.stringify(childJob), ts, ts);

    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, parentJob, childJob });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/reopen — reopen closed Stage 12 job
router.post('/:id/reopen', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const { reason, target_stage = 5 } = req.body;
    const actorRole = (req.headers['x-user-role'] || 'manager').toLowerCase();
    const actorName = req.headers['x-user-name'] || 'Kadiv Teknis';

    const authorized = ['manager', 'kadiv', 'superadmin'];
    if (!authorized.includes(actorRole)) {
      return res.status(403).json({ ok: false, error: 'Hanya Kadiv, Manager Teknis, atau Superadmin yang dapat membuka kembali Job yang sudah selesai.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Alasan pembukaan kembali (Reopen Reason) wajib diisi.' });
    }

    job.reopen_logs = job.reopen_logs || [];
    job.reopen_logs.push({
      reopened_by: actorName,
      role: actorRole,
      timestamp: now(),
      reason: reason.trim(),
      previous_stage: job.stage,
      target_stage: Number(target_stage)
    });

    job.stage = Number(target_stage);
    job.stage_started_at = now();
    job.history = job.history || [];
    job.history.push({
      stage: job.stage,
      ts: now(),
      by: actorName,
      action: `Job dibuka kembali (Reopen) ke Stage ${job.stage}. Alasan: "${reason.trim()}"`
    });

    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/stage5-review — save stage 5 review decision
router.post('/:id/stage5-review', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const { decision, laik_status, notes } = req.body;
    job.peer_review_status = req.body.peer_review_status || decision;
    job.laik_status = laik_status || job.laik_status;
    job.stage5_data = { ...(job.stage5_data || {}), ...req.body };

    if (decision === 'Revisi' || decision === 'Reject-Revisi') {
      job.revision_count = (job.revision_count || 0) + 1;
      job.stage = 5;
    } else if (decision === 'Tidak Laik' || laik_status === 'Tidak Laik') {
      job.stage = 16; // Stage 4c for retest after client repair
    } else if (decision === 'Approve' || decision === 'Approved' || laik_status === 'Laik') {
      job.stage = 7; // Stage 7 Dinas / Batch
    }

    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(job), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id — partial update fields
router.post('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Job not found' });
    const job = JSON.parse(row.data);
    const updated = { ...job, ...req.body };
    const ts = now();
    db.prepare('UPDATE jobs SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(updated), ts, req.params.id
    );
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true, job: updated });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/jobs/:id — delete a job
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/kanban');
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;

