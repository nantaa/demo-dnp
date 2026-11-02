// scripts/captureLiveScreenshots.js
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'https://monitor-dnp.deltaindo.co.id';
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('[PLAYWRIGHT] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5, // Crisp retina-like rendering
  });
  const page = await context.newPage();

  // 1. Login Page
  console.log('[1/18] Capturing Login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig01_login.png') });

  // Authenticate
  console.log('Logging in as superadmin@deltaindo.co.id...');
  await page.fill('input[type="email"]', 'superadmin@deltaindo.co.id');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // 2. Dashboard Superadmin
  console.log('[2/18] Capturing Dashboard...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig02_dashboard_kpi.png') });

  // 3. Kanban Board
  console.log('[3/18] Capturing Kanban Board...');
  await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig03_kanban_board.png') });

  // 4. Daftar Job
  console.log('[4/18] Capturing Daftar Job...');
  await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig04_daftar_job.png') });

  // 5. Create Job Form
  console.log('[5/18] Capturing Create Job form...');
  await page.goto(`${BASE_URL}/jobs/create`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig05_create_job.png') });

  // 6. Job Detail Overview (Drawer)
  console.log('[6/18] Capturing Job Detail Sheet Drawer on Kanban...');
  await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Click on the first card on kanban to open detail drawer
  const cardSelector = 'div[class*="cursor-pointer"], div[class*="rounded-xl"][class*="border"]';
  const card = await page.$(cardSelector);
  if (card) {
    await card.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig06_job_detail_overview.png') });

    // Step through stage tabs/buttons in detail sheet
    async function clickStageTab(stageNum, figName, logMsg) {
      console.log(logMsg);
      // Try finding button containing stage number or stage name
      const tabButton = await page.$(`button:has-text("Stage ${stageNum}"), button:has-text("S0${stageNum}"), button:has-text("S${stageNum}")`);
      if (tabButton) {
        await tabButton.click();
        await page.waitForTimeout(1000);
      }
      await page.screenshot({ path: path.join(OUTPUT_DIR, figName) });
    }

    // 7. Stage 1 Form
    await clickStageTab(1, 'fig07_stage1_po_form.png', '[7/18] Capturing Stage 1 Detail Form...');
    // 8. Stage 2 Form
    await clickStageTab(2, 'fig08_stage2_verify_form.png', '[8/18] Capturing Stage 2 Detail Form...');
    // 9. Stage 3 Form
    await clickStageTab(3, 'fig09_stage3_schedule_form.png', '[9/18] Capturing Stage 3 Detail Form...');
    // 10. Stage 4 Form
    await clickStageTab(4, 'fig10_stage4_inspection_form.png', '[10/18] Capturing Stage 4 Detail Form...');
    // 11. Stage 5 Form
    await clickStageTab(5, 'fig11_stage5_lhpp_form.png', '[11/18] Capturing Stage 5 Detail Form...');
    // 12. Stage 6 Form
    await clickStageTab(6, 'fig12_stage6_review_form.png', '[12/18] Capturing Stage 6 Detail Form...');
    // 13. Stage 8 Form
    await clickStageTab(8, 'fig13_stage8_disnaker_form.png', '[13/18] Capturing Stage 8 Detail Form...');
    // 14. Stage 10 Form
    await clickStageTab(10, 'fig14_stage10_invoice_form.png', '[14/18] Capturing Stage 10 Detail Form...');
  } else {
    console.warn('Could not find kanban card, creating fallback captures...');
    for (const [s, fig] of [
      [1, 'fig07_stage1_po_form.png'],
      [2, 'fig08_stage2_verify_form.png'],
      [3, 'fig09_stage3_schedule_form.png'],
      [4, 'fig10_stage4_inspection_form.png'],
      [5, 'fig11_stage5_lhpp_form.png'],
      [6, 'fig12_stage6_review_form.png'],
      [8, 'fig13_stage8_disnaker_form.png'],
      [10, 'fig14_stage10_invoice_form.png'],
    ]) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, fig) });
    }
  }

  // 15. Pelaporan
  console.log('[15/18] Capturing Pelaporan...');
  await page.goto(`${BASE_URL}/pelaporan`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig15_pelaporan.png') });

  // 16. Reminder Suket
  console.log('[16/18] Capturing Reminder Suket...');
  await page.goto(`${BASE_URL}/reminder-suket`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig16_reminder_suket.png') });

  // 17. Master Inventaris (Alat & SKP)
  console.log('[17/18] Capturing Inventaris Alat & SKP...');
  await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig17_alat_skp_inventory.png') });

  // 18. User Management
  console.log('[18/18] Capturing User Management...');
  await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig18_users_management.png') });

  console.log('[SUCCESS] All 18 screenshots captured successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('[ERROR] Capture failed:', err);
  process.exit(1);
});
