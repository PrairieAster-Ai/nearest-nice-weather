import { test, expect } from '@playwright/test';

test.describe('Auto-Expand Search Radius', () => {
  test('should automatically expand search radius when no POIs found', async ({ page }) => {
    // Enable console logging to see auto-expand messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log('Browser:', text);
      consoleLogs.push(text);
    });

    await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Give time for auto-expand

    // Check console logs for auto-expand messages
    const autoExpandLogs = consoleLogs.filter(log =>
      log.includes('Auto-expanding') ||
      log.includes('Auto-expanded') ||
      log.includes('Loaded') ||
      log.includes('POIs')
    );

    console.log('\n=== AUTO-EXPAND LOGS ===');
    autoExpandLogs.forEach(log => console.log(log));

    // Check if map has markers now
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    console.log('\nMarker count after auto-expand:', markerCount);

    // Check the current state from DOM
    const currentState = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('*'));
      const stateText = textElements.find(el =>
        el.textContent?.includes('POI locations:') &&
        el.textContent?.includes('visible within')
      );
      return stateText?.textContent || 'State not found';
    });

    console.log('\nCurrent state:', currentState);

    // Take screenshot to see the results
    await page.screenshot({ path: 'auto-expanded-map.png', fullPage: true });

    // Click on a POI marker if available (skip user location marker)
    if (markerCount > 1) {
      console.log('\n=== CLICKING POI MARKER ===');
      const poiMarker = await page.locator('.leaflet-marker-icon').nth(1);
      await poiMarker.click();
      await page.waitForTimeout(1000);

      // Check if popup appeared
      const popup = await page.locator('.leaflet-popup-content').first();
      if (await popup.isVisible()) {
        const popupContent = await popup.textContent();
        console.log('POI Popup content:', popupContent.substring(0, 200) + '...');

        // Check for navigation buttons in popup
        const hasNavButtons = popupContent.includes('Closer') || popupContent.includes('Farther');
        console.log('Navigation buttons present:', hasNavButtons);
      }

      await page.screenshot({ path: 'poi-popup-open.png', fullPage: true });
    }

    // Verify auto-expand worked
    const expandedRadius = autoExpandLogs.find(log => log.includes('Auto-expanded'));
    expect(expandedRadius).toBeTruthy();
    expect(markerCount).toBeGreaterThan(1); // Should have user marker + POI markers
  });
});
