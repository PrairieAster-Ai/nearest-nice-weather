/**
 * DEBUG FILTER RESPONSIVENESS - Investigate P0-3 Filter Issue
 */

import { chromium } from 'playwright';

async function debugFilterResponsiveness() {
  console.log('🔍 Debugging filter responsiveness issue...');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', (msg) => {
    console.log(`🖥️  CONSOLE: ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:3001');

    // Wait for page to fully load
    console.log('⏱️  Waiting for FAB elements to load...');
    await page.waitForSelector('.MuiFab-root', { timeout: 10000 });

    // Count available FAB elements
    const fabCount = await page.locator('.MuiFab-root').count();
    console.log(`📊 Found ${fabCount} FAB elements`);

    // Get all FAB elements and their properties
    const fabs = await page.locator('.MuiFab-root').all();
    for (let i = 0; i < fabs.length; i++) {
      const isVisible = await fabs[i].isVisible();
      const isEnabled = await fabs[i].isEnabled();
      const text = await fabs[i].textContent();
      console.log(`   FAB ${i}: visible=${isVisible}, enabled=${isEnabled}, text="${text}"`);
    }

    // Test clicking the first FAB
    console.log('🖱️  Testing filter click responsiveness...');
    const startTime = performance.now();

    // Click the first FAB
    await page.click('.MuiFab-root');

    // Check for immediate visual changes
    console.log('🔍 Checking for immediate visual changes...');

    // Wait for any transform, style changes, or aria changes
    try {
      await page.waitForFunction(() => {
        const fabs = document.querySelectorAll('.MuiFab-root');
        for (let fab of fabs) {
          if (fab.style.transform ||
              fab.getAttribute('aria-expanded') ||
              fab.style.backgroundColor !== '' ||
              fab.classList.contains('Mui-expanded')) {
            return true;
          }
        }
        return false;
      }, { timeout: 200 });

      const responseTime = performance.now() - startTime;
      console.log(`✅ Filter responded in ${Math.round(responseTime)}ms`);

    } catch (timeoutError) {
      console.log('❌ No visual changes detected within 200ms');

      // Try looking for slide-out options
      const slideElements = await page.locator('[class*="slide"], [class*="Slide"]').count();
      console.log(`📊 Slide elements found: ${slideElements}`);

      // Check for any new elements that appeared
      const newFabCount = await page.locator('.MuiFab-root').count();
      console.log(`📊 FAB count after click: ${newFabCount} (was ${fabCount})`);
    }

    // Take screenshot for inspection
    await page.screenshot({
      path: './debug-filter-after-click.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: ./debug-filter-after-click.png');

    // Wait for manual inspection
    console.log('⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await browser.close();
  }
}

debugFilterResponsiveness();
