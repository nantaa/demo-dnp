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

  test('HTML explicitly documents operational limitations: Attendance, SLA, Delayed v3, DP, Split Unit, Suket Tempo, and SOP Edge Cases', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.toLowerCase().includes('absensi') || content.toLowerCase().includes('kehadiran'), 'Must document absence of attendance tracking');
    assert.ok(content.toLowerCase().includes('on-time') || content.toLowerCase().includes('tepat waktu') || content.toLowerCase().includes('sla'), 'Must document absence of on-time job done performance tracking');
    assert.ok(content.toLowerCase().includes('ditunda') || content.toLowerCase().includes('delay'), 'Must document v3 as delayed due to flow complexity');
    assert.ok(content.includes('Uang Muka') || content.includes('DP') || content.includes('Termin'), 'Must document lack of DP/partial payment handling');
    assert.ok(content.includes('Split') || content.includes('Pecah') || content.includes('Parent-Child'), 'Must document lack of split unit / parent-child job handling');
    assert.ok(content.includes('Tempo') || content.includes('Suket Duluan') || content.includes('Term of Payment'), 'Must document lack of suket-first-pay-later exception handling');
    assert.ok(content.includes('Deviasi') || content.includes('Anomali') || content.includes('di Luar Alur') || content.includes('di Luar SOP'), 'Must document inability to handle non-standard edge cases outside 16-stage flow');
  });

  test('HTML contains focused visual presentation pipeline and excludes comparison matrix & Infografis SLA', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('visual-section') || content.includes('visualSection'), 'Must contain visual section container');
    assert.ok(content.includes('Bagan Alur 16 Tahap') || content.includes('Visualisasi Alur'), 'Must include 16-stage visual pipeline');
    assert.ok(!content.includes('Infografis Peran SLA') && !content.includes('Infografis SLA'), 'Must exclude Infografis SLA per user instruction');
    assert.ok(!content.includes('Matriks Perbandingan Sistem') && !content.includes('Tabel Perbandingan Visual'), 'Must exclude side-by-side comparison matrix per user instruction');
  });

  test('HTML contains interactive view toggle between Cards and Visual Presentation', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('switchView') || content.includes('toggleView'), 'Must contain view toggle function');
    assert.ok(content.includes('searchInput'), 'Must contain search input element');
  });

  test('HTML provides balanced 6 capabilities and 6 operational limitations cards', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const canDoMatches = (content.match(/class="card-item[^"]*"[^>]*data-category="can_do"/g) || []).length;
    const cannotDoMatches = (content.match(/class="card-item[^"]*"[^>]*data-category="cannot_do"/g) || []).length;
    assert.equal(canDoMatches, 6, 'Must have exactly 6 can_do cards');
    assert.equal(cannotDoMatches, 6, 'Must have exactly 6 cannot_do cards');
  });

  test('HTML contains high-contrast print stylesheet for Cetak PDF with proportional 2-column grid', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('@media print'), 'Must include @media print stylesheet');
    assert.ok(content.includes('print-color-adjust'), 'Must enable print color adjustment');
    assert.ok(content.includes('#cardsGrid'), 'Must style #cardsGrid in print');
    assert.ok(content.includes('#0f172a !important'), 'Must override dark text for high contrast on white paper');
    assert.ok(content.includes('page-break-inside: avoid') || content.includes('break-inside: avoid'), 'Must prevent card break across pages');
  });

  test('HTML text content contains no raw markdown asterisks', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(!content.includes('(*Rejection Cascade*)'), 'Must not have asterisks on Rejection Cascade');
    assert.ok(!content.includes('(*Tim Riksa Uji / Inspektur*)'), 'Must not have asterisks on Tim RU');
    assert.ok(!content.includes('(*Verifikasi Bayar*)'), 'Must not have asterisks on Verifikasi Bayar');
    assert.ok(!content.includes('*clock-in/out*'), 'Must not have asterisks on clock-in/out');
    assert.ok(!content.includes('(*on-time completion rate*)'), 'Must not have asterisks on on-time completion rate');
    assert.ok(!content.includes('(*accounts receivable ledger*)'), 'Must not have asterisks on accounts receivable');
    assert.ok(!content.includes('(*split job*)'), 'Must not have asterisks on split job');
    assert.ok(!content.includes('(*Term of Payment / TOP*)'), 'Must not have asterisks on TOP');
  });
});
