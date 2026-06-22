import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/app/:key  — read a KV entry (e.g. app:user, app:seq)
router.get('/:key', (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(key);
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, value: JSON.parse(row.value) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUT /api/app/:key  — set a KV entry
router.put('/:key', (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const value = req.body;
    db.prepare(
      'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run(key, JSON.stringify(value));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/app/:key  — delete a KV entry
router.delete('/:key', (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    db.prepare('DELETE FROM app_state WHERE key = ?').run(key);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
