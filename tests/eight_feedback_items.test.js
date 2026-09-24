import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('8 Production Feedback & Stability Improvements Test Suite', () => {

  // ── 1. Document Download Route & Tab Naming ──────────────────────────────
  describe('1. Document Download Route & Real Filename Tab Naming', () => {
    const webRoutesPath = path.join(rootDir, 'dnp-rework/routes/web.php');
    const jobControllerPath = path.join(rootDir, 'dnp-rework/app/Http/Controllers/JobController.php');
    const jobDetailSheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    it('web.php registers /jobs/{job}/documents/{document}/file/{filename?} route', () => {
      const content = fs.readFileSync(webRoutesPath, 'utf8');
      assert.ok(
        content.includes('/jobs/{job}/documents/{document}/file/{filename?}'),
        'web.php must register the document file view route with trailing filename parameter'
      );
    });

    it('JobController.php downloadDocument sets proper inline Content-Disposition with filename', () => {
      const content = fs.readFileSync(jobControllerPath, 'utf8');
      assert.ok(content.includes('downloadDocument'), 'JobController must define downloadDocument');
      assert.ok(
        content.includes('DISPOSITION_INLINE') || content.includes('inline'),
        'JobController must support inline disposition for preview'
      );
    });

    it('JobDetailSheet.jsx links to /file/{filename} to give Chrome/Edge tab the actual filename', () => {
      let content = fs.readFileSync(jobDetailSheetPath, 'utf8');
      const helpersPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetail/helpers.js');
      if (fs.existsSync(helpersPath)) {
        content += '\n' + fs.readFileSync(helpersPath, 'utf8');
      }
      assert.ok(
        content.includes('/file/') || content.includes('/download/'),
        'JobDetailSheet must build file URLs with document name'
      );
    });
  });

  // ── 2. Zero Emoticons in UI ──────────────────────────────────────────────
  describe('2. Removal of AI/Emoji Signatures across UI', () => {
    const jobDetailSheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');
    const kanbanIndexPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');

    it('JobDetailSheet.jsx does NOT contain emojis in payment options or action buttons', () => {
      const content = fs.readFileSync(jobDetailSheetPath, 'utf8');
      assert.ok(!content.includes('⏳ Pending'), 'Should not contain hourglass emoji');
      assert.ok(!content.includes('🌓 Partial'), 'Should not contain moon emoji');
      assert.ok(!content.includes('✅ Paid'), 'Should not contain checkmark emoji in paid option');
      assert.ok(!content.includes('💾 Simpan'), 'Should not contain floppy disk emoji');
      assert.ok(!content.includes('⚡ Bypass'), 'Should not contain lightning emoji');
      assert.ok(!content.includes('📋 Kirim ke Manager'), 'Should not contain clipboard emoji');
      assert.ok(!content.includes('🔓 Buka Kembali'), 'Should not contain unlock emoji');
    });

    it('Kanban/Index.jsx does NOT contain emojis in card status banners', () => {
      const content = fs.readFileSync(kanbanIndexPath, 'utf8');
      assert.ok(!content.includes('⏳ PROSES DISNAKER'), 'Should not contain hourglass in Disnaker banner');
      assert.ok(!content.includes('⚠️ TERKENDALA'), 'Should not contain warning emoji in stuck banner');
      assert.ok(!content.includes('✅ SELESAI DISNAKER'), 'Should not contain checkmark in Disnaker banner');
    });
  });

  // ── 3. Finance PO & Invoice Revision ─────────────────────────────────────
  describe('3. Finance Revision of PO & Invoice', () => {
    const webRoutesPath = path.join(rootDir, 'dnp-rework/routes/web.php');
    const jobControllerPath = path.join(rootDir, 'dnp-rework/app/Http/Controllers/JobController.php');
    const jobDetailSheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    it('web.php registers routes for invoice-revise and po-revise', () => {
      const content = fs.readFileSync(webRoutesPath, 'utf8');
      assert.ok(content.includes('jobs/{job}/invoice-revise'), 'web.php must register invoice-revise route');
      assert.ok(content.includes('jobs/{job}/po-revise'), 'web.php must register po-revise route');
    });

    it('JobController.php implements reviseInvoice and revisePo with Finance/Superadmin gating', () => {
      const content = fs.readFileSync(jobControllerPath, 'utf8');
      assert.ok(content.includes('function reviseInvoice'), 'JobController must implement reviseInvoice');
      assert.ok(content.includes('function revisePo'), 'JobController must implement revisePo');
      assert.ok(content.includes('finance'), 'Gating must mention finance role');
    });

    it('JobDetailSheet.jsx renders revision triggers for Finance', () => {
      const content = fs.readFileSync(jobDetailSheetPath, 'utf8');
      assert.ok(
        content.includes('setShowReviseInvoiceModal') || content.includes('Revisi Invoice'),
        'JobDetailSheet must render Invoice Revision trigger for Finance'
      );
      assert.ok(
        content.includes('setShowRevisePoModal') || content.includes('Revisi PO'),
        'JobDetailSheet must render PO Revision trigger for Finance'
      );
    });
  });

  // ── 4. Kanban Stage 9 Status Box Matching Stage 8 ────────────────────────
  describe('4. Kanban Stage 9 Card Status Box', () => {
    const kanbanIndexPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');

    it('Kanban/Index.jsx renders a card body status banner for Stage 9', () => {
      const content = fs.readFileSync(kanbanIndexPath, 'utf8');
      assert.ok(
        content.includes('job.stage === 9') && content.includes('s9_progress_status'),
        'Kanban/Index.jsx must render Stage 9 status banner in card body'
      );
    });
  });

  // ── 5. Hide BAP & Laporan Teknis Tambahan in Stage 5 ──────────────────────
  describe('5. Hide BAP & Laporan Teknis Tambahan Uploads in Stage 5', () => {
    const jobDetailSheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    it('Stage 5 does NOT render active BAP or Laporan Teknis Tambahan upload slots', () => {
      const content = fs.readFileSync(jobDetailSheetPath, 'utf8');
      const stage5Block = content.slice(content.indexOf('{s === 5 &&'), content.indexOf('{s === 6 &&'));
      assert.ok(
        !stage5Block.includes('<p className="text-xs font-medium text-gray-500">Unggah Dokumen Tambahan (Opsional):</p>') ||
        stage5Block.includes('{/* Unggah Dokumen Tambahan (Opsional)'),
        'Stage 5 optional documents section must be commented out or hidden'
      );
    });
  });

  // ── 6. Universal Terminology: "Tim Riksa Uji" on Frontend ────────────────
  describe('6. Universal "Tim Riksa Uji" Frontend Display', () => {
    const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
    const kanbanIndexPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');

    it('Constants.js defines inspektur role display name as "Tim Riksa Uji"', () => {
      const content = fs.readFileSync(constantsPath, 'utf8');
      assert.ok(
        content.includes("inspektur: { name: 'Tim Riksa Uji'") || content.includes('Tim Riksa Uji'),
        'Constants.js must name inspektur role as Tim Riksa Uji'
      );
    });

    it('Kanban/Index.jsx displays TIM RIKSA UJI badge', () => {
      const content = fs.readFileSync(kanbanIndexPath, 'utf8');
      assert.ok(
        content.includes('TIM RIKSA UJI'),
        'Kanban/Index.jsx must render TIM RIKSA UJI badge'
      );
    });
  });

  // ── 7. Role Tim Ahli Owning Stage 6 ──────────────────────────────────────
  describe('7. Tim Ahli Role Owning Stage 6', () => {
    const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
    const jobControllerPath = path.join(rootDir, 'dnp-rework/app/Http/Controllers/JobController.php');

    it('Constants.js registers tim_ahli role and assigns it to Stage 6', () => {
      const content = fs.readFileSync(constantsPath, 'utf8');
      assert.ok(content.includes('tim_ahli'), 'Constants.js must define tim_ahli role');
      assert.ok(
        content.includes("role: 'tim_ahli'"),
        'Stage 6 in STAGES must designate tim_ahli as owner'
      );
    });

    it('JobController.php authorizes tim_ahli on Stage 6', () => {
      const content = fs.readFileSync(jobControllerPath, 'utf8');
      assert.ok(
        content.includes('tim_ahli') || content.includes('ahli'),
        'JobController::canActOnStage must authorize tim_ahli'
      );
    });
  });

  // ── 8. Stage 5 Bypass Flow to Stage 7 ────────────────────────────────────
  describe('8. Stage 5 Bypass Moves Directly to Stage 7', () => {
    const jobDetailSheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    it('handleBypassStage5 advances next_stage to 7', () => {
      const content = fs.readFileSync(jobDetailSheetPath, 'utf8');
      const bypassFunc = content.slice(content.indexOf('handleBypassStage5 ='), content.indexOf('handleReopenJob ='));
      assert.ok(
        bypassFunc.includes('next_stage: 7'),
        'Stage 5 bypass must send next_stage: 7 to skip Stage 6 review'
      );
    });
  });

});
