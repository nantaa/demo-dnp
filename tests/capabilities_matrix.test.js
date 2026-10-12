import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Project Capabilities & Boundaries HTML Specification (Bahasa Indonesia)', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html');

  test('HTML file exists in public directory', () => {
    assert.ok(fs.existsSync(htmlPath), 'PROJECT_CAPABILITIES_AND_BOUNDARIES.html must exist');
  });

  test('HTML is in Bahasa Indonesia and documents 16 stages and core features', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('16 Tahap') || content.includes('16-Tahap') || content.includes('16 Stages'), 'Must document 16-stage architecture in Bahasa');
    assert.ok(content.includes('Tim RU'), 'Must document Tim RU role parity');
    assert.ok(content.includes('PPN 11%'), 'Must document PPN 11% calculation');
    assert.ok(content.includes('Daily Digest') || content.includes('Laporan Harian'), 'Must document Daily Digest email');
    assert.ok(content.includes('Preview Dokumen') || content.includes('Modal Preview') || content.includes('Preview'), 'Must document preview popup modal');
    assert.ok(content.includes('Invoice, Kwitansi & Faktur Pajak'), 'Must document Stage 10 unified invoice upload');
  });

  test('HTML explicitly documents system limitations including HRIS and v3', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('v3') || content.includes('Versi 3'), 'Must explain v3 exclusion');
    assert.ok(content.toLowerCase().includes('absensi') || content.toLowerCase().includes('kehadiran'), 'Must document absence of attendance/presensi tracking');
    assert.ok(content.toLowerCase().includes('kinerja') || content.toLowerCase().includes('kpi'), 'Must document absence of performance appraisal/review');
    assert.ok(content.includes('Disnaker'), 'Must document Disnaker manual tracking reality');
  });

  test('HTML completely hides academic module and all its implications', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(!content.toLowerCase().includes('academic thesis'), 'Must not contain academic thesis references');
    assert.ok(!content.toLowerCase().includes('thesis-docket'), 'Must not contain thesis-docket references');
  });

  test('HTML contains interactive search and category filtering in Bahasa', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('filterCapability'), 'Must contain filter script function');
    assert.ok(content.includes('searchInput'), 'Must contain search input element');
  });
});
