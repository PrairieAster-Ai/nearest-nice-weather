/**
 * DEBUG FRONTEND TEST - Investigate UI Loading Issues
 */

import { chromium } from 'playwright';

async function debugFrontendLoading() {
  console.log('🔍 Debugging frontend loading issues...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', (msg) => {
    console.log(`🖥️  CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  // Capture network failures
  page.on('response', (response) => {
    if (!response.ok()) {
      console.log(`🌐 NETWORK ERROR: ${response.status()} ${response.url()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('📖 Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001');

    console.log('⏱️  Waiting for page to load...');
    await page.waitForTimeout(3000);

    console.log('🔍 Checking for React root element...');
    const rootElement = await page.locator('#root').textContent();
    console.log('📋 Root element content length:', rootElement?.length || 0);

    console.log('🔍 Checking for specific UI elements...');
    const mapExists = await page.locator('.leaflet-container').count();
    const fabExists = await page.locator('.MuiFab-root').count();
    const anyButtons = await page.locator('button').count();
    const anyDivs = await page.locator('div').count();

    console.log(`📊 UI Elements found:`);
    console.log(`   - Leaflet map containers: ${mapExists}`);
    console.log(`   - Material-UI FAB buttons: ${fabExists}`);
    console.log(`   - Any buttons: ${anyButtons}`);
    console.log(`   - Any divs: ${anyDivs}`);

    // Take a screenshot for visual inspection
    await page.screenshot({
      path: './debug-frontend-screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: ./debug-frontend-screenshot.png');

    // Wait to allow manual inspection
    console.log('⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await browser.close();
  }
}

debugFrontendLoading();
