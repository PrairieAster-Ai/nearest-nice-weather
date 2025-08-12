import { chromium } from 'playwright';
import fs from 'fs';

async function inspectPOIPopup() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('📱 Navigating to localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  
  // Wait for map to load
  console.log('🗺️  Waiting for map to load...');
  await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  await page.waitForTimeout(3000); // Additional wait for markers
  
  // Find and click a POI marker
  console.log('📍 Looking for POI markers...');
  const markers = await page.locator('.leaflet-marker-icon').count();
  console.log(`Found ${markers} markers`);
  
  if (markers > 0) {
    // Click the first marker that's not the user location marker
    const poiMarker = page.locator('.leaflet-marker-icon').nth(1); // Skip user location marker
    await poiMarker.click();
    
    // Wait for popup to appear
    console.log('⏳ Waiting for popup...');
    await page.waitForTimeout(1000); // Wait for popup animation
    
    // Take screenshot of the popup area
    console.log('📸 Taking screenshot...');
    const popup = page.locator('.leaflet-popup').last(); // Get the POI popup (not user location)
    await popup.screenshot({ path: '/tmp/poi-popup-design.png' });
    
    // Also take a full page screenshot for context
    await page.screenshot({ path: '/tmp/full-page-with-popup.png' });
    
    console.log('✅ Screenshots saved:');
    console.log('   - /tmp/poi-popup-design.png (popup only)');
    console.log('   - /tmp/full-page-with-popup.png (full page)');
    
    // Check for design elements
    const compassButton = await page.locator('a[title="Get directions"]').count();
    const navButtons = await page.locator('[data-nav-action]').count();
    
    console.log(`🧭 Compass directions button found: ${compassButton > 0 ? 'YES' : 'NO'}`);
    console.log(`🔄 Navigation buttons found: ${navButtons}`);
    
    if (compassButton > 0) {
      const buttonStyle = await page.locator('a[title="Get directions"]').getAttribute('style');
      console.log('🎨 Button styling:', buttonStyle);
    }
    
  } else {
    console.log('❌ No POI markers found on the map');
  }
  
  await browser.close();
}

inspectPOIPopup().catch(console.error);