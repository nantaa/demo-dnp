// tests/manual/screenshotSuite.test.js
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots');

const EXPECTED_FIGURES = [
  'fig01_login.png',
  'fig02_dashboard_kpi.png',
  'fig03_kanban_board.png',
  'fig04_daftar_job.png',
  'fig05_create_job.png',
  'fig06_job_detail_overview.png',
  'fig07_stage1_po_form.png',
  'fig08_stage2_verify_form.png',
  'fig09_stage3_schedule_form.png',
  'fig10_stage4_inspection_form.png',
  'fig11_stage5_lhpp_form.png',
  'fig12_stage6_review_form.png',
  'fig13_stage8_disnaker_form.png',
  'fig14_stage10_invoice_form.png',
  'fig15_pelaporan.png',
  'fig16_reminder_suket.png',
  'fig17_alat_skp_inventory.png',
  'fig18_users_management.png'
];

console.log('--- TESTING SCREENSHOT AVAILABILITY ---');
assert(fs.existsSync(SCREENSHOT_DIR), 'FAIL: Screenshot directory does not exist');

for (const fig of EXPECTED_FIGURES) {
  const figPath = path.join(SCREENSHOT_DIR, fig);
  assert(fs.existsSync(figPath), `FAIL: Missing screenshot ${fig}`);
  const stat = fs.statSync(figPath);
  assert(stat.size > 20000, `FAIL: Screenshot ${fig} too small (${stat.size} bytes)`);
}

console.log('PASS: All 18 live UI screenshots are present and valid!');
