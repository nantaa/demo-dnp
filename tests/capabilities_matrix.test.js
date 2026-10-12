import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Project Capabilities & Boundaries HTML Specification (User & Manager Visual Focus)', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html');

  test('HTML file exists in public directory', () => {
    assert.ok(fs.existsSync(htmlPath), 'PROJECT_CAPABILITIES_AND_BOUNDARIES.html must exist');
  });

  test('HTML documents core operational capabilities relevant to User & Manager', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('16 Tahap') || content.includes('16-Tahap'), 'Must document 16-stage architecture in Bahasa');
    assert.ok(content.includes('Tim RU'), 'Must document Tim RU role parity and price privacy');
    assert.ok(content.includes('PPN 11%'), 'Must document PPN 11% calculation and Stage 14 lock');
    assert.ok(content.includes('Preview Dokumen') || content.includes('Modal Preview') || content.includes('Tinjau Langsung'), 'Must document preview popup modal');
    assert.ok(content.includes('Invoice, Kwitansi & Faktur Pajak'), 'Must document Stage 10 unified invoice upload');
    assert.ok(content.includes('Multi-Unit') || content.includes('Banyak Unit'), 'Must document multi-unit capability');
  });

  test('HTML hides WhatsApp Wablas and developer infrastructure cards', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(!content.includes('Wablas') && !content.includes('WhatsApp'), 'Must omit WhatsApp Wablas per user instruction');
    assert.ok(!content.includes('Daily Digest'), 'Must hide Daily Digest');
    assert.ok(!content.includes('Mesin Rekomendasi Penugasan Inspektur'), 'Must hide Rekomendasi Inspektur');
    assert.ok(!content.includes('Tidak Terhubung API Langsung ke Server Disnaker'), 'Must hide Disnaker API details');
    assert.ok(!content.includes('Tidak Ada Tarikan Otomatis Mutasi Rekening Bank'), 'Must hide bank mutation details');
    assert.ok(!content.includes('Instalasi Khusus Perusahaan Tunggal'), 'Must hide Multi-Tenant SaaS details');
    assert.ok(!content.includes('Menggunakan Polling Berkala, Bukan Server WebSocket'), 'Must hide WebSocket/Polling details');
    assert.ok(!content.toLowerCase().includes('academic thesis'), 'Must keep academic references hidden');
    assert.ok(!content.toLowerCase().includes('e-sign bersertifikasi'), 'Must omit E-sign boundary per user instruction');
  });

  test('HTML explicitly documents operational limitations: Attendance, SLA Performance, and Delayed v3', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.toLowerCase().includes('absensi') || content.toLowerCase().includes('kehadiran'), 'Must document absence of attendance tracking');
    assert.ok(content.toLowerCase().includes('on-time') || content.toLowerCase().includes('tepat waktu') || content.toLowerCase().includes('sla'), 'Must document absence of on-time job done performance tracking');
    assert.ok(content.toLowerCase().includes('ditunda') || content.toLowerCase().includes('delay'), 'Must document v3 as delayed due to flow complexity');
  });

  test('HTML contains rich visual presentations and comparison charts', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('visual-section') || content.includes('visualPresentation'), 'Must contain visual section container');
    assert.ok(content.includes('Bagan Alur 16 Tahap') || content.includes('Visualisasi Alur'), 'Must include 16-stage visual pipeline');
    assert.ok(content.includes('Matriks Perbandingan') || content.includes('Tabel Perbandingan Visual'), 'Must include visual comparison matrix');
    assert.ok(content.includes('Infografis Peran SLA') || content.includes('Peran SLA'), 'Must include SLA infographic');
  });

  test('HTML contains interactive view toggle between Cards and Visual Presentation', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('switchView') || content.includes('toggleView'), 'Must contain view toggle function');
    assert.ok(content.includes('searchInput'), 'Must contain search input element');
  });
});
