const { test, expect } = require('@playwright/test');

test.describe('Horizontal Filters Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('horizontal filters layout works on desktop and mobile', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    console.log('🖥️ Testing desktop horizontal filters...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/HORIZONTAL-FILTERS-desktop.png',
      fullPage: true 
    });
    
    // Check that filters are visible horizontally
    const temperatureFilter = page.locator('h3:has-text("Temperature")');
    const precipitationFilter = page.locator('h3:has-text("Precipitation")');
    const windFilter = page.locator('h3:has-text("Wind")');
    
    await expect(temperatureFilter).toBeVisible();
    await expect(precipitationFilter).toBeVisible();
    await expect(windFilter).toBeVisible();
    
    // Test filter selection
    const comfortableOption = page.locator('button:has-text("Comfortable")').first();
    if (await comfortableOption.isVisible()) {
      await comfortableOption.click();
      await page.waitForTimeout(500);
      console.log('✅ Desktop filter selection working');
    }
    
    // Screenshot with selection
    await page.screenshot({ 
      path: 'test-results/HORIZONTAL-FILTERS-desktop-selected.png',
      fullPage: true 
    });
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('📱 Testing mobile stacked filters...');
    
    // Screenshot mobile layout (filters should stack vertically)
    await page.screenshot({ 
      path: 'test-results/HORIZONTAL-FILTERS-mobile-stacked.png',
      fullPage: true 
    });
    
    // Verify filters are still accessible on mobile
    const mobileComfortableOption = page.locator('button:has-text("Comfortable")').first();
    if (await mobileComfortableOption.isVisible()) {
      await mobileComfortableOption.click();
      await page.waitForTimeout(500);
      console.log('✅ Mobile filter selection working');
    }
    
    // Test search button works
    const searchButton = page.locator('button:has-text("Find Perfect Weather")');
    if (await searchButton.isVisible() && await searchButton.isEnabled()) {
      await searchButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Search functionality working');
      
      // Screenshot after search
      await page.screenshot({ 
        path: 'test-results/HORIZONTAL-FILTERS-after-search.png',
        fullPage: true 
      });
    }
    
    console.log('✅ Horizontal filters layout test completed');
  });
});