// scripts/testLiveLogin.js
import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  console.log('Navigating to live site...');
  await page.goto('https://monitor-dnp.deltaindo.co.id/login', { waitUntil: 'networkidle' });
  
  await page.fill('input[type="email"]', 'superadmin@deltaindo.co.id');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  console.log('Current URL after login attempt:', page.url());
  await page.screenshot({ path: 'docs/screenshots/live_after_login.png' });
  
  await browser.close();
}

testLogin().catch(console.error);
