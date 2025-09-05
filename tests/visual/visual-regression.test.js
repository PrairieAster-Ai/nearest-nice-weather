/**
 * Visual Regression Tests
 * Testing UI consistency and visual changes
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport and color scheme
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('should match homepage layout', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]');

    // Wait for map to fully load
    await page.waitForFunction(() => {
      const mapContainer = document.querySelector('[data-testid="map-container"]');
      return mapContainer && mapContainer.querySelector('.leaflet-container');
    }, { timeout: 10000 });

    // Hide dynamic elements that change between runs
    await page.addStyleTag({
      content: `
        .leaflet-control-attribution,
        [data-testid*="current-time"],
        [data-testid*="weather-timestamp"] {
          visibility: hidden !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('homepage-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match filter panel appearance', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid*="filter"]');

    // Open first filter
    const firstFilter = page.locator('[data-testid*="filter"]').first();
    await firstFilter.click();

    // Wait for filter panel to appear
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('filter-panel-open.png', {
      animations: 'disabled'
    });
  });

  test('should match mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE dimensions
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]');

    // Wait for responsive layout to settle
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad dimensions
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]');

    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('tablet-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match dark mode appearance', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]');

    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('dark-mode-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match loading states', async ({ page }) => {
    // Intercept API calls to create loading state
    await page.route('**/api/weather-locations*', route => {
      // Delay response to capture loading state
      setTimeout(() => route.continue(), 2000);
    });

    await page.goto('http://localhost:3001');

    // Capture loading state
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled'
    });
  });

  test('should match error states', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/weather-locations*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('error-state.png', {
      animations: 'disabled'
    });
  });

  test('should match map with markers', async ({ page }) => {
    await page.goto('http://localhost:3001?lat=44.9537&lng=-93.0900');
    await page.waitForSelector('[data-testid="map-container"]');

    // Wait for markers to load
    await page.waitForFunction(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      return markers.length > 0;
    }, { timeout: 10000 });

    // Focus on map area
    const mapBounds = await page.locator('[data-testid="map-container"]').boundingBox();
    if (mapBounds) {
      await expect(page).toHaveScreenshot('map-with-markers.png', {
        clip: mapBounds,
        animations: 'disabled'
      });
    }
  });

  test('should match filter combinations', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid*="filter"]');

    // Apply multiple filters
    const temperatureFilter = page.locator('[data-testid="filter-temperature"]');
    const precipitationFilter = page.locator('[data-testid="filter-precipitation"]');

    if (await temperatureFilter.count() > 0) {
      await temperatureFilter.click();
      await page.locator('text=Mild').click();
      await page.waitForTimeout(500);
    }

    if (await precipitationFilter.count() > 0) {
      await precipitationFilter.click();
      await page.locator('text=None').click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('filters-applied.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match high contrast mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

    // Simulate high contrast preferences
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            filter: contrast(200%) !important;
          }
        }
      `
    });

    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]');

    await expect(page).toHaveScreenshot('high-contrast-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match print styles', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]');

    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    await expect(page).toHaveScreenshot('print-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
