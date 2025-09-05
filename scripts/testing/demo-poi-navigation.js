import { chromium } from 'playwright';
import fs from 'fs';

async function demonstratePOINavigation() {
  console.log('🎬 Starting POI Navigation Demo...');

  // Launch browser in headed mode (visible)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 2000 // 2 second delay between actions
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Loading localhost:3001...');
    await page.goto('http://localhost:3001');

    // Wait for the page to fully load
    console.log('🗺️ Waiting for page to fully load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Extra wait for React app and POI markers to load

    // Check if map container exists
    const mapContainer = await page.locator('#map, .leaflet-container').first();
    if (await mapContainer.isVisible()) {
      console.log('✅ Map container found and visible');
    } else {
      console.log('⚠️ Map container not visible, continuing anyway...');
    }

    // Take initial screenshot
    await page.screenshot({ path: 'demo-screenshots/01-initial-load.png', fullPage: true });
    console.log('📸 Screenshot 1: Initial page load');

    // Find and click on POI markers (purple star-like icons) - skip the user location marker
    console.log('🎯 Looking for POI markers (purple stars)...');
    let markers = await page.locator('.leaflet-marker-icon').all();

    if (markers.length === 0) {
      console.log('🔍 No .leaflet-marker-icon found, trying alternative selectors...');
      markers = await page.locator('[class*="marker"]').all();
    }

    if (markers.length === 0) {
      console.log('❌ No POI markers found on map with any selector');
      console.log('🔍 Taking screenshot to debug...');
      await page.screenshot({ path: 'demo-screenshots/debug-no-markers.png', fullPage: true });
      return;
    }

    console.log(`📍 Found ${markers.length} total markers`);

    // Try to click on multiple markers to find a POI (skip the first one which might be user location)
    let foundPOI = false;
    for (let i = 1; i < Math.min(markers.length, 5); i++) {
      console.log(`👆 Trying marker ${i + 1}...`);
      await markers[i].click();
      await page.waitForTimeout(2000);

      // Check if we got a POI popup with navigation buttons
      const fartherButton = page.locator('text="Farther →"').first();
      const poiTitle = page.locator('.leaflet-popup-content h3, .leaflet-popup-content .poi-name').first();

      if (await fartherButton.isVisible() || await poiTitle.isVisible()) {
        console.log(`✅ Found POI popup at marker ${i + 1}!`);
        foundPOI = true;
        break;
      } else {
        console.log(`⚠️ Marker ${i + 1} didn't show POI popup, trying next...`);
      }
    }

    if (!foundPOI) {
      console.log('❌ No POI popups found after trying multiple markers');
      await page.screenshot({ path: 'demo-screenshots/debug-no-poi-popup.png', fullPage: true });
      return;
    }

    // Take screenshot of popup
    await page.screenshot({ path: 'demo-screenshots/02-first-popup.png', fullPage: true });
    console.log('📸 Screenshot 2: First POI popup opened');

    // Now demonstrate navigation by clicking "Farther →" button repeatedly
    let navigationCount = 0;
    const maxNavigations = 10;

    while (navigationCount < maxNavigations) {
      // Look for the "Farther →" button
      const fartherButton = page.locator('text="Farther →"').first();

      if (await fartherButton.isVisible()) {
        console.log(`🔄 Navigation ${navigationCount + 1}: Clicking "Farther →" button...`);
        await fartherButton.click();
        await page.waitForTimeout(3000); // Wait for map to pan and new popup to load

        // Take screenshot of new POI
        await page.screenshot({
          path: `demo-screenshots/03-navigation-${navigationCount + 1}.png`,
          fullPage: true
        });
        console.log(`📸 Screenshot ${navigationCount + 3}: Navigation step ${navigationCount + 1}`);

        navigationCount++;
      } else {
        // Look for "Expand +30mi" button with flexible selectors
        let expandButton = page.locator('text="Expand"').first();

        // Try alternative selectors if first doesn't work
        if (!(await expandButton.isVisible())) {
          expandButton = page.locator('button:has-text("Expand")').first();
        }
        if (!(await expandButton.isVisible())) {
          expandButton = page.locator('[text*="Expand"], button[title*="Expand"]').first();
        }

        if (await expandButton.isVisible()) {
          console.log('🔍 Found "Expand" button, clicking to expand search radius...');
          await expandButton.click();
          await page.waitForTimeout(4000); // Wait for new POIs to load

          await page.screenshot({
            path: `demo-screenshots/04-expanded-search.png`,
            fullPage: true
          });
          console.log('📸 Screenshot: Search radius expanded');

          // Continue with navigation if more POIs are available
          continue;
        } else {
          console.log('✅ No more "Farther →" or "Expand" buttons found. Navigation complete!');
          break;
        }
      }

      // Small delay between actions for visibility
      await page.waitForTimeout(1000);
    }

    // Take final screenshot
    await page.screenshot({ path: 'demo-screenshots/05-final-state.png', fullPage: true });
    console.log('📸 Final screenshot: Navigation demonstration complete');

    console.log('🎉 POI Navigation Demo completed successfully!');
    console.log(`📊 Navigated through ${navigationCount} POIs`);
    console.log('📁 Screenshots saved in demo-screenshots/ directory');

    // Keep browser open for 10 seconds so user can see final state
    console.log('⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Demo error:', error);
    await page.screenshot({ path: 'demo-screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🔚 Browser closed. Demo complete!');
  }
}

// Create screenshots directory
if (!fs.existsSync('demo-screenshots')) {
  fs.mkdirSync('demo-screenshots');
}

// Run the demonstration
demonstratePOINavigation().catch(console.error);
