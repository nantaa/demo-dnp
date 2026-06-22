import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'dnp.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema migrations ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id          TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export default db;
