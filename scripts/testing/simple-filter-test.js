/**
 * SIMPLE FILTER TEST - Verify FAB slide-out behavior
 */

import { chromium } from 'playwright';

async function testFabSlideOut() {
  console.log('🔍 Testing FAB slide-out behavior...');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3001');

    // Wait for page to load
    await page.waitForSelector('.MuiFab-root', { timeout: 10000 });
    console.log('✅ FAB elements loaded');

    // Wait for POI data to load to ensure complete page state
    await page.waitForFunction(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      return markers.length > 0;
    }, { timeout: 15000 });
    console.log('✅ POI markers loaded');

    // Count initial FABs
    const initialFabCount = await page.locator('.MuiFab-root').count();
    console.log(`📊 Initial FAB count: ${initialFabCount}`);

    // Test clicking temperature FAB (first one)
    console.log('🖱️  Clicking temperature FAB...');
    const startTime = performance.now();

    await page.click('.MuiFab-root:first-child');

    // Wait a short time for slide animation
    await page.waitForTimeout(200);

    // Check for slide-out container
    const slideOutExists = await page.locator('[class*="absolute"][class*="right-full"]').count() > 0;
    const newFabCount = await page.locator('.MuiFab-root').count();

    const responseTime = performance.now() - startTime;

    console.log(`📊 Response time: ${Math.round(responseTime)}ms`);
    console.log(`📊 Slide-out container exists: ${slideOutExists}`);
    console.log(`📊 FAB count: ${initialFabCount} → ${newFabCount}`);

    // Take screenshot
    await page.screenshot({
      path: './simple-filter-test-after-click.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: ./simple-filter-test-after-click.png');

    // Test if slide-out options appeared
    if (slideOutExists || newFabCount > initialFabCount) {
      console.log('✅ Filter UI responded successfully');
      const performance = responseTime <= 100 ? '✅ EXCELLENT' :
                         responseTime <= 200 ? '⚠️ ACCEPTABLE' : '❌ SLOW';
      console.log(`${performance}: ${Math.round(responseTime)}ms response time`);
    } else {
      console.log('❌ No slide-out options detected');
    }

    // Keep browser open for inspection
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFabSlideOut();
