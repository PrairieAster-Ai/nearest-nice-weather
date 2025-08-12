import { chromium } from 'playwright';

async function demonstrateApp() {
  console.log('🎭 Starting Playwright browser automation demo...');
  
  // Launch browser in headed mode so user can see
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 2000 // 2 second delay between actions
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to NearestNiceWeather app...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/Branding/playwright-demo-01-initial.png' });
    console.log('📸 Screenshot saved: playwright-demo-01-initial.png');
    
    // Wait for the app to load and check for key elements
    console.log('⏳ Waiting for map to load...');
    await page.waitForSelector('[data-testid="map"], .leaflet-container, #map', { timeout: 10000 });
    
    // Take screenshot after map loads
    await page.screenshot({ path: '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/Branding/playwright-demo-02-map-loaded.png' });
    console.log('📸 Screenshot saved: playwright-demo-02-map-loaded.png');
    
    // Look for POI markers on the map
    console.log('🔍 Looking for POI markers...');
    const markers = await page.locator('.leaflet-marker-icon, [data-testid="poi-marker"], .marker').all();
    console.log(`Found ${markers.length} potential markers`);
    
    if (markers.length > 0) {
      console.log('🎯 Clicking on first POI marker...');
      await markers[0].click();
      await page.waitForTimeout(3000); // Wait for popup
      
      // Take screenshot after clicking marker
      await page.screenshot({ path: '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/Branding/playwright-demo-03-marker-clicked.png' });
      console.log('📸 Screenshot saved: playwright-demo-03-marker-clicked.png');
    }
    
    // Try to interact with zoom controls
    console.log('🔍 Testing zoom controls...');
    const zoomIn = await page.locator('.leaflet-control-zoom-in, [data-testid="zoom-in"]').first();
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(2000);
      console.log('➕ Zoomed in');
    }
    
    const zoomOut = await page.locator('.leaflet-control-zoom-out, [data-testid="zoom-out"]').first();
    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(2000);
      console.log('➖ Zoomed out');
    }
    
    // Take final screenshot
    await page.screenshot({ path: '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/Branding/playwright-demo-04-final.png' });
    console.log('📸 Screenshot saved: playwright-demo-04-final.png');
    
    // Look for weather information or other interactive elements
    console.log('🌤️ Looking for weather elements...');
    const weatherElements = await page.locator('[data-testid*="weather"], .weather, .temperature').all();
    console.log(`Found ${weatherElements.length} weather-related elements`);
    
    // Try to interact with any search or filter controls
    console.log('🔍 Looking for search/filter controls...');
    const searchInput = await page.locator('input[type="search"], input[placeholder*="search"], [data-testid="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('park');
      await page.waitForTimeout(2000);
      console.log('🔍 Entered search term: park');
    }
    
    console.log('✨ Demo completed! Browser window will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/documentation/Branding/playwright-demo-error.png' });
    console.log('📸 Error screenshot saved: playwright-demo-error.png');
  } finally {
    await browser.close();
    console.log('🎭 Browser closed. Demo complete!');
  }
}

// Run the demo
demonstrateApp().catch(console.error);