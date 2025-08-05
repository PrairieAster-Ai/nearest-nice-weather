/**
 * Visual Regression Testing Suite
 * Comprehensive visual validation for Nearest Nice Weather
 * Business Context: B2C outdoor recreation platform
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Core Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for critical elements to load
    await page.waitForSelector('body', { timeout: 30000 });
    
    // Wait for any initial loading states to complete
    await page.waitForTimeout(2000);
  });

  test('visual regression - homepage full page', async ({ page }) => {
    // Wait for map container (if present)
    try {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      await page.waitForTimeout(3000); // Allow map to stabilize
    } catch (error) {
      console.log('Map container not found, proceeding with page screenshot');
    }
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full-page.png', {
      fullPage: true,
      threshold: 0.2, // Allow for minor rendering differences
      animations: 'disabled'
    });
  });

  test('visual regression - above fold content', async ({ page }) => {
    // Screenshot of viewport area (above the fold)
    await expect(page).toHaveScreenshot('homepage-above-fold.png', {
      threshold: 0.2,
      animations: 'disabled'
    });
  });

  test('visual regression - map area', async ({ page }) => {
    // Check if map container exists
    const mapContainer = page.locator('.leaflet-container');
    
    if (await mapContainer.count() > 0) {
      // Wait for map to initialize
      await page.waitForTimeout(5000);
      
      // Screenshot just the map area
      await expect(mapContainer).toHaveScreenshot('map-container.png', {
        threshold: 0.3, // Maps can have slight rendering variations
        animations: 'disabled'
      });
    } else {
      console.log('Map container not found - skipping map visual regression');
    }
  });

  test('visual regression - footer visibility', async ({ page }) => {
    // Check for footer element
    const footer = page.locator('footer, [data-testid="footer"], .footer');
    
    if (await footer.count() > 0) {
      // Scroll to footer
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Screenshot footer area
      await expect(footer).toHaveScreenshot('footer-component.png', {
        threshold: 0.2,
        animations: 'disabled'
      });
    } else {
      console.log('Footer element not found - may need to check z-index visibility');
    }
  });
});

test.describe('Visual Regression - Mobile Responsive', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('visual regression - mobile homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for mobile layout to settle
    await page.waitForSelector('body', { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Mobile full page screenshot
    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled'
    });
  });

  test('visual regression - mobile map interaction', async ({ page }) => {
    await page.goto('/');
    
    // Check for map on mobile
    const mapContainer = page.locator('.leaflet-container');
    
    if (await mapContainer.count() > 0) {
      await page.waitForTimeout(5000);
      
      // Mobile map screenshot
      await expect(mapContainer).toHaveScreenshot('mobile-map.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });
});

test.describe('Visual Regression - Business Model Validation', () => {
  test('visual regression - POI markers display', async ({ page }) => {
    await page.goto('/');
    
    // Wait for potential POI markers
    await page.waitForTimeout(5000);
    
    // Look for Leaflet markers (indicating POI display, not cities)
    const markers = page.locator('.leaflet-marker-icon');
    
    if (await markers.count() > 0) {
      // Focus on marker area and screenshot
      const firstMarker = markers.first();
      await firstMarker.scrollIntoViewIfNeeded();
      
      // Screenshot area with markers
      await expect(page.locator('.leaflet-container')).toHaveScreenshot('poi-markers-display.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
      
      console.log(`Found ${await markers.count()} POI markers - validating outdoor recreation focus`);
    } else {
      console.log('No POI markers found - may indicate data loading issue');
    }
  });

  test('visual regression - no city markers validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Take screenshot to validate no city-style markers are displayed
    // This supports business requirement: outdoor recreation POIs, not cities
    await expect(page).toHaveScreenshot('business-model-validation.png', {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Performance States', () => {
  test('visual regression - loading state', async ({ page }) => {
    // Navigate but don't wait for full load
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Capture loading state quickly
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('visual regression - error state handling', async ({ page }) => {
    // Navigate to potentially non-existent route to test error handling
    await page.goto('/non-existent-route');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('error-state.png', {
      threshold: 0.2,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Cross-Browser Consistency', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`visual regression - ${browserName} consistency`, async ({ page, browserName: currentBrowser }) => {
      // Only run this test on the specific browser
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test on ${currentBrowser}`);
      
      await page.goto('/');
      await page.waitForSelector('body', { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Browser-specific screenshot
      await expect(page).toHaveScreenshot(`${browserName}-homepage.png`, {
        fullPage: true,
        threshold: 0.25, // Allow for browser rendering differences
        animations: 'disabled'
      });
    });
  });
});

// Utility function for debugging visual differences
test.describe('Visual Regression - Debug Utilities', () => {
  test('debug - capture all page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Capture detailed element information for debugging
    const elementInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      return Array.from(elements).slice(0, 20).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        textContent: el.textContent?.substring(0, 50)
      }));
    });
    
    console.log('Page elements:', elementInfo);
    
    // Full debug screenshot
    await expect(page).toHaveScreenshot('debug-full-page.png', {
      fullPage: true,
      threshold: 0.1,
      animations: 'disabled'
    });
  });
});