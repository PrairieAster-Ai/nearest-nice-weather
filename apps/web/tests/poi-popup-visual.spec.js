import { test, expect } from '@playwright/test';

test.describe('POI Popup Visual Design', () => {
  test('should display mini-FAB directions button with correct styling', async ({ page }) => {
    // Navigate to localhost
    await page.goto('http://localhost:3001');

    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Wait for POI markers to appear
    await page.waitForTimeout(3000);

    // Find and click a POI marker (skip user location marker)
    const markers = await page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    console.log(`Found ${markerCount} markers`);

    if (markerCount > 1) {
      // Click the second marker (first is usually user location)
      await markers.nth(1).click();

      // Wait for popup to appear
      await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });

      // Take screenshot of the popup
      const popup = page.locator('.leaflet-popup').last();
      await popup.screenshot({ path: 'tests/screenshots/poi-popup-design.png' });

      // Verify the compass directions button exists
      const compassButton = page.locator('a[title="Get directions"]');
      await expect(compassButton).toBeVisible();

      // Verify button styling
      const buttonStyle = await compassButton.getAttribute('style');
      expect(buttonStyle).toContain('width: 28px');
      expect(buttonStyle).toContain('height: 28px');
      expect(buttonStyle).toContain('#7563A8');

      // Verify compass emoji
      const buttonText = await compassButton.textContent();
      expect(buttonText?.trim()).toBe('🧭');

      // Verify navigation buttons have consistent purple styling
      const navButtons = page.locator('[data-nav-action]');
      const navButtonCount = await navButtons.count();

      if (navButtonCount > 0) {
        const firstNavButton = navButtons.first();
        const navButtonStyle = await firstNavButton.getAttribute('style');
        expect(navButtonStyle).toContain('#7563A8');
      }

      console.log('✅ POI popup design verification passed');
      console.log(`🧭 Compass button found with correct styling`);
      console.log(`🔄 ${navButtonCount} navigation buttons found`);

    } else {
      console.log('❌ Insufficient markers found for testing');
    }
  });

  test('should take full page screenshot with popup open', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    const markers = await page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();

    if (markerCount > 1) {
      await markers.nth(1).click();
      await page.waitForTimeout(1000);

      // Take full page screenshot
      await page.screenshot({
        path: 'tests/screenshots/full-page-with-popup.png',
        fullPage: true
      });

      console.log('📸 Full page screenshot captured');
    }
  });
});
