import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Interactive Kanban Flow Simulator Specification', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/KANBAN_FLOW_SIMULATOR.html');

  test('Simulator HTML file exists in public directory', () => {
    assert.ok(fs.existsSync(htmlPath), 'public/KANBAN_FLOW_SIMULATOR.html must exist');
  });

  test('Simulator defines the complete 16-stage Kanban architecture', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    // Ensure all 16 stages are present
    assert.ok(content.includes('PO / SPK / Proposal') || content.includes('Tahap 1'), 'Must include Stage 1');
    assert.ok(content.includes('Verifikasi Dokumen') || content.includes('Tahap 2'), 'Must include Stage 2');
    assert.ok(content.includes('Penjadwalan') || content.includes('Tahap 3'), 'Must include Stage 3');
    assert.ok(content.includes('Pelaksanaan RU') || content.includes('Tahap 4'), 'Must include Stage 4');
    assert.ok(content.includes('Aktualisasi Unit') || content.includes('4b'), 'Must include Stage 13 (4b)');
    assert.ok(content.includes('Penyusunan LHPP') || content.includes('Tahap 5'), 'Must include Stage 5');
    assert.ok(content.includes('Review Laporan Teknis') || content.includes('Tahap 6'), 'Must include Stage 6');
    assert.ok(content.includes('Verifikasi ke Dinas') || content.includes('Tahap 7'), 'Must include Stage 7');
    assert.ok(content.includes('Proses Disnaker') || content.includes('Tahap 8'), 'Must include Stage 8');
    assert.ok(content.includes('Pengurusan Suket') || content.includes('Tahap 9'), 'Must include Stage 9');
    assert.ok(content.includes('Invoice & Kwitansi') || content.includes('Tahap 10'), 'Must include Stage 10');
    assert.ok(content.includes('Penagihan / Follow-up') || content.includes('Tahap 11'), 'Must include Stage 11');
    assert.ok(content.includes('Verifikasi Bayar') || content.includes('11b'), 'Must include Stage 14 (11b)');
    assert.ok(content.includes('Kirim SUKET') || content.includes('11c'), 'Must include Stage 15 (11c)');
    assert.ok(content.includes('Closing') || content.includes('Tahap 12'), 'Must include Stage 12');
    assert.ok(content.includes('Selesai') || content.includes('Tahap 16'), 'Must include Stage 16');
  });

  test('Simulator implements interactive movement controls and HTML5 drag-and-drop', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('moveJob') || content.includes('moveJobForward'), 'Must contain moveJob function');
    assert.ok(content.includes('dragstart') || content.includes('handleDragStart') || content.includes('ondragstart'), 'Must contain dragstart handling');
    assert.ok(content.includes('drop') || content.includes('handleDrop') || content.includes('ondrop'), 'Must contain drop handling');
    assert.ok(content.includes('addNewJob') || content.includes('createJob'), 'Must allow adding new jobs dynamically');
  });

  test('Simulator runs client-side with zero backend logic gates and includes audit trail log', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(!content.includes('fetch(') && !content.includes('axios.'), 'Must run standalone without server API dependencies');
    assert.ok(content.includes('logActivity') || content.includes('movementLog') || content.includes('activityLog'), 'Must log card movement history');
    assert.ok(content.includes('Phase') || content.includes('Fase') || content.includes('filterPhase'), 'Must support phase navigation or grouping');
  });
});
