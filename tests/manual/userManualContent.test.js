// tests/manual/userManualContent.test.js
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const MD_PATH = path.join(process.cwd(), 'USER_MANUAL_END_USER.md');

console.log('--- TESTING END-USER MANUAL CONTENT ---');
assert(fs.existsSync(MD_PATH), 'FAIL: USER_MANUAL_END_USER.md does not exist');

const content = fs.readFileSync(MD_PATH, 'utf-8');
assert(content.length > 30000, `FAIL: Manual too short (${content.length} characters)`);

// 1. Must contain production URL
assert(
  content.includes('https://monitor-dnp.deltaindo.co.id/'),
  'FAIL: Must contain live production access URL https://monitor-dnp.deltaindo.co.id/'
);

// 2. Must contain formal structure like BigBuilder
assert(content.toLowerCase().includes('daftar isi'), 'FAIL: Missing Daftar Isi');
assert(content.toLowerCase().includes('daftar gambar'), 'FAIL: Missing Daftar Gambar');

// 3. Must reference all 18 figures
for (let i = 1; i <= 18; i++) {
  assert(
    content.includes(`Gambar ${i}:`),
    `FAIL: Missing reference for Gambar ${i}:`
  );
}

// 4. Zero Developer Jargon (Strict Banned Words)
const bannedWords = [
  'Laravel',
  'React',
  'Eloquent',
  'Bcrypt',
  'CSRF',
  'middleware',
  'sanitizeAndDeduplicateFilename',
  'BlockAiAndScraperBots'
];

for (const word of bannedWords) {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  assert(
    !regex.test(content),
    `FAIL: Developer jargon detected: "${word}". End-user manual must not contain internal developer terms.`
  );
}

console.log('PASS: End-user manual adheres 100% to non-technical, visual guidelines!');
