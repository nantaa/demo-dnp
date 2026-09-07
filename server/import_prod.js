import fs from 'fs';
import db from './db.js';

const raw = fs.readFileSync('C:/Users/rifai/.gemini/antigravity-ide/brain/af964cb2-0389-4e8a-9f04-42a69e7f807e/.system_generated/steps/1010/output.txt', 'utf8');
const firstBrace = raw.indexOf('{"jobs"');
const lastBrace = raw.lastIndexOf('}}');
const jsonText = raw.substring(firstBrace, lastBrace + 2).replace(/\\"/g, '"').replace(/\\\\/g, '\\');

// Try direct parse
let jobs = [];
try {
  const parsed = JSON.parse(jsonText);
  jobs = parsed.jobs || [];
} catch (e) {
  // Try finding stringified JSON
  const matches = raw.match(/"\{.*?\}"/s);
  if (matches) {
    const inner = JSON.parse(matches[0]);
    jobs = JSON.parse(inner).jobs;
  }
}

console.log(`Extracted ${jobs.length} jobs from production.`);
if (jobs.length > 0) {
  db.prepare('DELETE FROM jobs').run();
  const insert = db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)');
  const ts = new Date().toISOString();
  const insertMany = db.transaction((list) => {
    for (const j of list) {
      insert.run(j.id, JSON.stringify(j), j.created_at || ts, j.updated_at || ts);
    }
  });
  insertMany(jobs);
  console.log('Database successfully populated with exact production jobs!');
  console.log('Jobs:');
  jobs.forEach(j => console.log(` - [${j.kode}] ${j.nama_perusahaan} (Stage ${j.stage})`));
}
