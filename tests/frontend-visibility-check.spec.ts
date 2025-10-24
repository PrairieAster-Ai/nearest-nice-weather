import { test, expect } from '@playwright/test';

/**
 * Frontend Visibility E2E Test
 * Validates that the frontend is viewable and functional for users
 */

const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

test.describe('Frontend Visibility Validation', () => {

  test('frontend loads and displays main UI elements', async ({ page }) => {
    // Navigate to frontend
    await page.goto(FRONTEND_URL);

    // Wait for app to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check page title
    await expect(page).toHaveTitle(/Nearest Nice Weather/i);

    // Verify main heading is visible
    const heading = page.locator('h1, h2, h3, h4').first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    console.log('✅ Frontend loaded successfully');
  });

  test('map container is present and visible', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Look for Leaflet map container
    const mapContainer = page.locator('.leaflet-container, [class*="map"], #map');
    await expect(mapContainer.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Map container is visible');
  });

  test('no React errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for React to render

    // Check for React-specific errors
    const reactErrors = consoleErrors.filter(error =>
      error.includes('React') ||
      error.includes('Multiple copies') ||
      error.includes('older version')
    );

    if (reactErrors.length > 0) {
      console.log('❌ React errors found:', reactErrors);
    } else {
      console.log('✅ No React errors detected');
    }

    expect(reactErrors).toHaveLength(0);
  });

  test('page is not blank (has visible content)', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Get body text content
    const bodyText = await page.locator('body').textContent();

    // Verify there's substantial content (not just whitespace)
    expect(bodyText?.trim().length).toBeGreaterThan(100);

    console.log('✅ Page has visible content');
  });

  test('POI data loads from API', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Wait for potential API calls
    await page.waitForTimeout(5000);

    // Check console logs for POI data
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Look for POI-related console output
    const poiLogs = consoleLogs.filter(log =>
      log.includes('POI') ||
      log.includes('locations') ||
      log.includes('visible')
    );

    console.log('📊 POI-related logs:', poiLogs);

    // At minimum, page should attempt to load POI data
    expect(poiLogs.length).toBeGreaterThan(0);
  });

  test('no JavaScript errors prevent rendering', async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (pageErrors.length > 0) {
      console.log('❌ JavaScript errors:', pageErrors);
    } else {
      console.log('✅ No JavaScript errors');
    }

    // We may have warnings, but critical errors should not exist
    const criticalErrors = pageErrors.filter(error =>
      error.includes('is not defined') ||
      error.includes('Cannot read') ||
      error.includes('undefined')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('screenshot verification - visual regression check', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for map and data to load

    // Take screenshot for manual verification
    await page.screenshot({
      path: 'test-results/frontend-visibility-check.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved to test-results/frontend-visibility-check.png');
  });
});
