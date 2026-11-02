// tests/manual/manualCoverage.test.js
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT_DIR = process.cwd();
const MD_PATH = path.join(ROOT_DIR, 'USER_MANUAL_COMPLETE.md');
const PDF_PATH = path.join(ROOT_DIR, 'USER_MANUAL_COMPLETE.pdf');
const ROUTES_PATH = path.join(ROOT_DIR, 'dnp-rework', 'routes', 'web.php');

console.log('--- RUNNING USER MANUAL TDD COVERAGE TESTS ---');

// Test 1: Markdown file existence and minimum length
assert(fs.existsSync(MD_PATH), 'FAIL: USER_MANUAL_COMPLETE.md does not exist');
const mdContent = fs.readFileSync(MD_PATH, 'utf-8');
assert(mdContent.length > 30000, `FAIL: USER_MANUAL_COMPLETE.md too short (${mdContent.length} chars)`);

// Test 2: Essential feature keywords from REVIEW HALF.pdf and active routes
const requiredKeywords = [
  'PPN 12%',
  's8_delay_reason',
  'Faktur Pajak',
  'Bypass Review',
  'Stage 1 (PO / SPK)',
  'Stage 2 (Verifikasi Dokumen)',
  'Stage 3 (Penjadwalan & Surat Tugas)',
  'Stage 4 (Pelaksanaan RU)',
  'Stage 4b',
  'Stage 5 (Penyusunan LHPP)',
  'Stage 6 (Review Laporan Teknis)',
  'Stage 7 (Submit Disnaker)',
  'Stage 8 (Proses Disnaker)',
  'Stage 9 (Pengurusan Suket)',
  'Stage 10 (Penagihan)',
  'Stage 11 (Penyerahan Suket',
  'Stage 11b',
  'Stage 12',
  'Inventaris Alat Uji',
  'Sertifikat PJK3',
  'Template Dokumen',
  'User Management',
  'Reminder Suket',
  'Pelaporan',
  '/reminder-suket',
  '/inventory',
  '/pelaporan'
];

for (const kw of requiredKeywords) {
  assert(
    mdContent.includes(kw),
    `FAIL: USER_MANUAL_COMPLETE.md missing required feature keyword: "${kw}"`
  );
}

// Test 3: PDF file existence and binary validation
assert(fs.existsSync(PDF_PATH), 'FAIL: USER_MANUAL_COMPLETE.pdf does not exist');
const pdfBuffer = fs.readFileSync(PDF_PATH);
assert(pdfBuffer.length > 50000, `FAIL: PDF file too small (${pdfBuffer.length} bytes)`);
const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
assert.strictEqual(pdfHeader, '%PDF-', 'FAIL: Output file is not a valid PDF header');

console.log('PASS: All user manual coverage and PDF integrity checks passed!');
