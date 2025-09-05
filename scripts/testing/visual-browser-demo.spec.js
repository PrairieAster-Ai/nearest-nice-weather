/**
 * 🎭 VISUAL BROWSER AUTOMATION DEMO
 * This test runs in HEADED mode so you can see the automation happening!
 */

import { test, expect } from '@playwright/test';

test.describe('🎭 Visual Browser Automation Demo', () => {
  // Configure to run slowly so we can see what's happening
  test.use({
    headless: false,  // Show the browser!
    viewport: { width: 1280, height: 720 },
    video: 'on',
    trace: 'on',
    // Slow down actions so they're visible
    launchOptions: {
      slowMo: 500  // Add 500ms delay between actions
    }
  });

  test('🚀 Complete User Journey - Watch the Browser in Action!', async ({ page }) => {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🎭 BROWSER AUTOMATION STARTING - WATCH YOUR SCREEN!');
    console.log('═'.repeat(60));
    console.log('');

    // Step 1: Navigate to the app
    console.log('📍 Step 1: Opening NearestNiceWeather.com...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 2: Wait for map to load
    console.log('🗺️  Step 2: Waiting for interactive map to load...');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Step 3: Zoom in on the map
    console.log('🔍 Step 3: Zooming in on the map...');
    const map = page.locator('.leaflet-container');

    // Click zoom in button twice
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(1000);
      await zoomIn.click();
      await page.waitForTimeout(1000);
    }

    // Step 4: Find and click POI markers
    console.log('📍 Step 4: Looking for Points of Interest...');
    await page.waitForTimeout(1000);

    const markers = await page.locator('.leaflet-marker-icon').all();
    console.log(`   Found ${markers.length} POI markers on the map`);

    if (markers.length > 0) {
      // Step 5: Click on different POI markers
      console.log('👆 Step 5: Clicking on POI markers to show weather info...');

      // Try to find and click a POI marker (not user location)
      let poiClicked = false;
      for (let i = 0; i < Math.min(markers.length, 5); i++) {
        const marker = markers[i];
        const src = await marker.getAttribute('src');

        if (src && src.includes('aster-marker')) {
          console.log(`   Clicking POI marker #${i + 1}...`);
          await marker.scrollIntoViewIfNeeded();
          await marker.click({ force: true });
          poiClicked = true;
          await page.waitForTimeout(2000);

          // Check if popup opened
          const popup = page.locator('.leaflet-popup-content');
          if (await popup.isVisible()) {
            console.log('   ✅ Weather popup opened!');

            // Read the POI name
            const poiName = await popup.locator('h3').textContent().catch(() => 'Unknown');
            console.log(`   📍 Location: ${poiName}`);

            // Check for weather info
            const temperature = await popup.textContent();
            if (temperature.includes('°F')) {
              const tempMatch = temperature.match(/(\d+)°F/);
              if (tempMatch) {
                console.log(`   🌡️  Temperature: ${tempMatch[0]}`);
              }
            }

            // Look for directions button
            const directionsBtn = popup.locator('[title="Get directions"]');
            if (await directionsBtn.isVisible()) {
              console.log('   🧭 Directions button found');

              // Hover over it to show it's interactive
              await directionsBtn.hover();
              await page.waitForTimeout(1000);
            }

            // Try navigation buttons
            const closerBtn = popup.locator('[data-nav-action="closer"]');
            const fartherBtn = popup.locator('[data-nav-action="farther"]');

            if (await fartherBtn.isVisible() && !await fartherBtn.isDisabled()) {
              console.log('   ➡️  Navigating to next POI...');
              await fartherBtn.click();
              await page.waitForTimeout(2000);
            }

            // Close popup by clicking on map
            await map.click({ position: { x: 100, y: 100 } });
            await page.waitForTimeout(1000);
          }

          if (poiClicked) break;
        }
      }

      // Step 6: Test multiple POIs
      if (markers.length > 3) {
        console.log('🔄 Step 6: Testing multiple POI interactions...');

        for (let i = 1; i < Math.min(4, markers.length); i++) {
          await markers[i].scrollIntoViewIfNeeded();
          await markers[i].click({ force: true });
          await page.waitForTimeout(1500);

          // Close popup
          await map.click({ position: { x: 100, y: 100 } });
          await page.waitForTimeout(500);
        }
      }
    }

    // Step 7: Pan the map
    console.log('🗺️  Step 7: Panning the map to explore the area...');
    await map.dragTo(map, {
      sourcePosition: { x: 640, y: 360 },
      targetPosition: { x: 400, y: 360 }
    });
    await page.waitForTimeout(1000);

    await map.dragTo(map, {
      sourcePosition: { x: 640, y: 360 },
      targetPosition: { x: 640, y: 200 }
    });
    await page.waitForTimeout(1000);

    // Step 8: Zoom out to see full area
    console.log('🔍 Step 8: Zooming out to see the full area...');
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(1000);
      await zoomOut.click();
      await page.waitForTimeout(1000);
    }

    // Step 9: Take a screenshot
    console.log('📸 Step 9: Taking a screenshot of the final view...');
    await page.screenshot({
      path: 'visual-demo-final.png',
      fullPage: true
    });

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ BROWSER AUTOMATION DEMO COMPLETE!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('📊 Demo Summary:');
    console.log('   • Navigated to the application');
    console.log('   • Interacted with the interactive map');
    console.log('   • Clicked on POI markers');
    console.log('   • Viewed weather information');
    console.log('   • Tested navigation between POIs');
    console.log('   • Demonstrated map controls (zoom, pan)');
    console.log('   • Captured screenshot');
    console.log('');
    console.log('🎬 Video saved to: test-results/');
    console.log('📸 Screenshot saved to: visual-demo-final.png');
    console.log('');

    // Keep browser open for a moment at the end
    await page.waitForTimeout(3000);
  });

  test('🎨 Visual Effects Demo - Animations and Interactions', async ({ page }) => {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🎨 VISUAL EFFECTS DEMO - WATCH THE ANIMATIONS!');
    console.log('═'.repeat(60));
    console.log('');

    await page.goto('http://localhost:3001');
    await page.waitForSelector('.leaflet-container');

    // Highlight elements as we interact with them
    console.log('✨ Highlighting interactive elements...');

    // Add visual highlight effect
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes highlight {
          0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
          50% { box-shadow: 0 0 30px 10px rgba(255, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
        .highlight-element {
          animation: highlight 1s ease-in-out;
          border: 3px solid red !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Highlight map
    await page.evaluate(() => {
      const map = document.querySelector('.leaflet-container');
      map?.classList.add('highlight-element');
    });
    await page.waitForTimeout(1500);

    // Highlight each marker
    const markers = await page.locator('.leaflet-marker-icon').all();
    for (let i = 0; i < Math.min(3, markers.length); i++) {
      await markers[i].evaluate(el => {
        el.classList.add('highlight-element');
        el.style.transition = 'transform 0.3s ease';
        el.style.transform = 'scale(1.5)';
        setTimeout(() => {
          el.style.transform = 'scale(1)';
        }, 500);
      });
      await page.waitForTimeout(1000);
    }

    console.log('✅ Visual effects demonstration complete!');
    await page.waitForTimeout(2000);
  });
});
