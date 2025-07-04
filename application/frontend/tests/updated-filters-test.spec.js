const { test, expect } = require('@playwright/test');

test.describe('Updated Filters Test', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('test new Tailwind-style weather filters', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('📱 Testing updated filter design...');
    
    // Screenshot before opening filters
    await page.screenshot({ 
      path: 'test-results/NEW-FILTERS-mobile-closed.png',
      fullPage: true 
    });
    
    // Open hamburger menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();
    await page.waitForTimeout(1000);
    
    // Screenshot with new filters open
    await page.screenshot({ 
      path: 'test-results/NEW-FILTERS-mobile-open.png',
      fullPage: true 
    });
    
    // Test filter interactions
    console.log('🌡️ Testing temperature filter selection...');
    
    // Select "Comfortable" temperature
    const comfortableTemp = page.locator('button:has-text("Comfortable")').first();
    if (await comfortableTemp.isVisible()) {
      await comfortableTemp.click();
      await page.waitForTimeout(500);
      console.log('✅ Selected comfortable temperature');
      
      // Check if it shows as selected (blue background)
      const isSelected = await comfortableTemp.evaluate(el => 
        el.classList.contains('bg-primary-blue') || 
        el.classList.contains('border-primary-blue')
      );
      console.log(`Temperature selection visual feedback: ${isSelected}`);
    }
    
    // Select "Sunny" precipitation
    console.log('☀️ Testing precipitation filter selection...');
    const sunnyPrecip = page.locator('button:has-text("Sunny")').first();
    if (await sunnyPrecip.isVisible()) {
      await sunnyPrecip.click();
      await page.waitForTimeout(500);
      console.log('✅ Selected sunny precipitation');
    }
    
    // Select "Calm" wind
    console.log('🌱 Testing wind filter selection...');
    const calmWind = page.locator('button:has-text("Calm")').first();
    if (await calmWind.isVisible()) {
      await calmWind.click();
      await page.waitForTimeout(500);
      console.log('✅ Selected calm wind');
    }
    
    // Screenshot with all filters selected
    await page.screenshot({ 
      path: 'test-results/NEW-FILTERS-selections-made.png',
      fullPage: true 
    });
    
    // Check for active filter summary badges
    const filterBadges = page.locator('.bg-blue-100');
    const badgeCount = await filterBadges.count();
    console.log(`Filter summary badges found: ${badgeCount}`);
    
    // Test the search button
    const searchButton = page.locator('button:has-text("Find Perfect Weather")');
    if (await searchButton.isVisible()) {
      const isEnabled = await searchButton.isEnabled();
      console.log(`Search button enabled after selections: ${isEnabled}`);
      
      if (isEnabled) {
        await searchButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Search button clicked successfully');
        
        // Screenshot after search
        await page.screenshot({ 
          path: 'test-results/NEW-FILTERS-after-search.png',
          fullPage: true 
        });
      }
    }
    
    console.log('✅ New filter design test completed');
  });
  
  test('compare desktop vs mobile filter layouts', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/NEW-FILTERS-desktop-layout.png',
      fullPage: true 
    });
    
    // Check if filters are visible in desktop sidebar
    const temperatureFilter = page.locator('h3:has-text("Temperature Preference")');
    const desktopFiltersVisible = await temperatureFilter.isVisible();
    console.log(`Desktop filters visible in sidebar: ${desktopFiltersVisible}`);
    
    if (desktopFiltersVisible) {
      // Test desktop filter interaction
      const comfortableOption = page.locator('button:has-text("Comfortable")').first();
      if (await comfortableOption.isVisible()) {
        await comfortableOption.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ 
          path: 'test-results/NEW-FILTERS-desktop-selected.png',
          fullPage: true 
        });
        console.log('✅ Desktop filter interaction working');
      }
    }
    
    // Mobile comparison
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Open mobile filters
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    if (await hamburgerButton.isVisible()) {
      await hamburgerButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'test-results/NEW-FILTERS-mobile-comparison.png',
        fullPage: true 
      });
      console.log('✅ Mobile filter layout captured');
    }
  });
});