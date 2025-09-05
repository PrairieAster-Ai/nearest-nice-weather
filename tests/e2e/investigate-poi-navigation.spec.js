const { test, expect } = require('@playwright/test');

test('POI Navigation Visual Investigation', async ({ page }) => {
  console.log('🔍 Starting POI Navigation Investigation...');

  // Go to preview environment
  await page.goto('https://p.nearestniceweather.com');

  // Wait for the map and data to load
  await page.waitForSelector('.leaflet-marker-icon', { timeout: 30000 });
  await page.waitForTimeout(5000); // Extra wait for POI data loading

  // Take full page screenshot
  await page.screenshot({
    path: '/home/robertspeer/Projects/screenshots/poi-navigation-investigation.png',
    fullPage: true
  });
  console.log('📸 Screenshot saved to /home/robertspeer/Projects/screenshots/poi-navigation-investigation.png');

  // Click on the first visible marker to open popup
  const markers = await page.locator('.leaflet-marker-icon').all();
  console.log(`📍 Found ${markers.length} markers on the map`);

  if (markers.length > 0) {
    // Click on a POI marker (not the user marker)
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const isDraggable = await marker.getAttribute('draggable');
      if (!isDraggable) {
        console.log(`📍 Clicking on marker ${i+1}...`);
        await marker.click();
        break;
      }
    }

    // Wait for popup to appear
    await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Take screenshot with popup open
    await page.screenshot({
      path: '/home/robertspeer/Projects/screenshots/poi-popup-with-navigation.png',
      fullPage: true
    });
    console.log('📸 Popup screenshot saved to /home/robertspeer/Projects/screenshots/poi-popup-with-navigation.png');

    // Get popup content
    const popupContent = await page.locator('.leaflet-popup-content').textContent();
    console.log('📝 Popup content:', popupContent);

    // Check for navigation buttons
    const closerButton = await page.locator('button[data-nav-action="closer"]').count();
    const fartherButton = await page.locator('button[data-nav-action="farther"]').count();

    console.log(`🔘 Closer buttons found: ${closerButton}`);
    console.log(`🔘 Farther buttons found: ${fartherButton}`);

    if (fartherButton > 0) {
      const buttonText = await page.locator('button[data-nav-action="farther"]').first().textContent();
      console.log(`📝 Farther button text: "${buttonText}"`);
    }

    // Get console logs from browser
    const logs = await page.evaluate(() => {
      return window.console._logs || [];
    });

    // Check POI data in browser console
    await page.evaluate(() => {
      console.log('=== POI NAVIGATION DEBUG INFO ===');
      // Try to access POI navigation state if available
      if (window.poiNavigationDebug) {
        console.log('POI Navigation State:', window.poiNavigationDebug);
      }
    });
  }

  console.log('✅ POI Navigation Investigation Complete!');
});
