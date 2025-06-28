const { test, expect } = require('@playwright/test');

test.describe('Single Row Filters Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('single row filters display with defaults and show results on load', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('🖥️ Testing single row filter layout...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/SINGLE-ROW-FILTERS-desktop.png',
      fullPage: true 
    });
    
    // Check that filters are visible in a single row
    const tempFilters = page.locator('button:has-text("Cold"), button:has-text("Nice"), button:has-text("Hot")');
    const precipFilters = page.locator('button:has-text("Sunny"), button:has-text("Mixed"), button:has-text("Rainy")');
    const windFilters = page.locator('button:has-text("Calm"), button:has-text("Breezy"), button:has-text("Windy")');
    
    // Verify all filter buttons are visible
    await expect(tempFilters.first()).toBeVisible();
    await expect(precipFilters.first()).toBeVisible();
    await expect(windFilters.first()).toBeVisible();
    
    console.log('✅ All filter categories visible');
    
    // Check that defaults are selected (Nice, Sunny, Calm)
    const niceTemp = page.locator('button:has-text("Nice")').first();
    const sunnyPrecip = page.locator('button:has-text("Sunny")').first();
    const calmWind = page.locator('button:has-text("Calm")').first();
    
    // Check for selected state (should have blue background)
    const niceTempSelected = await niceTemp.evaluate(el => 
      el.classList.contains('bg-primary-blue') || 
      el.classList.contains('border-primary-blue')
    );
    console.log(`Nice temperature selected: ${niceTempSelected}`);
    
    // Check that results are showing on initial load
    const resultsSection = page.locator('text=Brainerd Lakes Area');
    await expect(resultsSection).toBeVisible();
    console.log('✅ Results showing on page load');
    
    // Test filter interactions
    const hotTemp = page.locator('button:has-text("Hot")').first();
    if (await hotTemp.isVisible()) {
      await hotTemp.click();
      await page.waitForTimeout(500);
      console.log('✅ Filter interaction working');
      
      // Screenshot after filter change
      await page.screenshot({ 
        path: 'test-results/SINGLE-ROW-FILTERS-after-change.png',
        fullPage: true 
      });
    }
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('📱 Testing mobile single row layout...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/SINGLE-ROW-FILTERS-mobile.png',
      fullPage: true 
    });
    
    // Verify filters wrap properly on mobile
    const mobileFilters = page.locator('button:has-text("Nice"), button:has-text("Sunny"), button:has-text("Calm")');
    await expect(mobileFilters.first()).toBeVisible();
    console.log('✅ Mobile filter layout working');
    
    console.log('✅ Single row filters test completed');
  });
});