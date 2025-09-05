import { test, expect } from '@playwright/test';

test.describe('POI Navigation Investigation', () => {
  test('should find and test POI navigation controls', async ({ page }) => {
    page.on('console', msg => console.log('Browser:', msg.text()));

    await page.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\n=== SEARCHING FOR UI ELEMENTS ===');

    // Take screenshot to see current state
    await page.screenshot({ path: 'current-ui-state.png', fullPage: true });

    // Search for all buttons on the page
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim(),
        className: btn.className,
        id: btn.id,
        visible: btn.offsetParent !== null,
        disabled: btn.disabled
      }));
    });
    console.log('\nAll buttons found:', JSON.stringify(allButtons, null, 2));

    // Search for FAB (Floating Action Button) elements
    const fabElements = await page.evaluate(() => {
      const fabs = Array.from(document.querySelectorAll('[class*="Fab"], [class*="fab"], [class*="floating"]'));
      return fabs.map(fab => ({
        className: fab.className,
        text: fab.textContent?.trim(),
        visible: fab.offsetParent !== null
      }));
    });
    console.log('\nFAB elements:', JSON.stringify(fabElements, null, 2));

    // Check for any POI-related text in the UI
    const poiText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .filter(el => el.textContent?.includes('POI') ||
                     el.textContent?.includes('Closer') ||
                     el.textContent?.includes('Farther') ||
                     el.textContent?.includes('mile') ||
                     el.textContent?.includes('distance'))
        .slice(0, 10)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 100),
          className: el.className
        }));
    });
    console.log('\nPOI-related text elements:', JSON.stringify(poiText, null, 2));

    // Look for Material-UI SpeedDial or similar navigation
    const speedDial = await page.evaluate(() => {
      const dials = Array.from(document.querySelectorAll('[class*="SpeedDial"], [class*="speed-dial"]'));
      return dials.map(dial => ({
        className: dial.className,
        visible: dial.offsetParent !== null,
        children: Array.from(dial.children).map(child => child.textContent)
      }));
    });
    console.log('\nSpeedDial elements:', JSON.stringify(speedDial, null, 2));

    // Try to find the filter FAB and click it
    const filterFab = await page.locator('[aria-label*="filter"], [aria-label*="Filter"]').first();
    if (await filterFab.isVisible()) {
      console.log('\n=== FOUND FILTER FAB, CLICKING ===');
      await filterFab.click();
      await page.waitForTimeout(1000);

      // Check what appeared after clicking
      const afterFilterClick = await page.evaluate(() => {
        const newElements = Array.from(document.querySelectorAll('button, [role="button"]'));
        return newElements.map(el => ({
          text: el.textContent?.trim(),
          visible: el.offsetParent !== null
        })).filter(el => el.visible);
      });
      console.log('Elements after filter click:', JSON.stringify(afterFilterClick, null, 2));

      await page.screenshot({ path: 'after-filter-click.png', fullPage: true });
    }

    // Check React component state in window
    const reactState = await page.evaluate(() => {
      // Try to access React DevTools global hook
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React DevTools detected';
      }

      // Try to find POI state in the window
      if (window.poiState || window.appState) {
        return { poiState: window.poiState, appState: window.appState };
      }

      return 'No global state found';
    });
    console.log('\nReact state:', reactState);

    // Final check - look for any distance-related controls
    const distanceControls = await page.locator('text=/\\d+\\s*mi/i').all();
    console.log(`\nFound ${distanceControls.length} elements with distance text`);

    for (let i = 0; i < Math.min(distanceControls.length, 3); i++) {
      const text = await distanceControls[i].textContent();
      console.log(`Distance element ${i + 1}: "${text}"`);
    }
  });
});
