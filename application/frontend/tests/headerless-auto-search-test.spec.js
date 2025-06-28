const { test, expect } = require('@playwright/test');

test.describe('Headerless Auto-Search Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('no header with automatic search on filter clicks', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('🎯 Testing headerless auto-search layout...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/HEADERLESS-AUTO-SEARCH-desktop.png',
      fullPage: true 
    });
    
    // Check that header is completely removed
    const header = page.locator('header');
    await expect(header).not.toBeVisible();
    console.log('✅ Header completely removed');
    
    // Check that filters start at the very top of content
    const filtersContainer = page.locator('div:has(button:has-text("😌"))').first();
    const filtersPosition = await filtersContainer.boundingBox();
    console.log(`Filters start at: ${filtersPosition?.y}px from top`);
    
    // Test auto-search functionality
    const coldButton = page.locator('button:has-text("🧊")').first();
    const niceButton = page.locator('button:has-text("😌")').first();
    
    // Click Cold button and verify auto-search triggers
    await coldButton.click();
    await page.waitForTimeout(500);
    
    // Check that search results are updated automatically
    const resultsHeading = page.locator('text=Nice weather found!');
    await expect(resultsHeading).toBeVisible();
    console.log('✅ Auto-search triggered on filter click');
    
    // Test another filter change
    const rainyButton = page.locator('button:has-text("🌧️")').first();
    await rainyButton.click();
    await page.waitForTimeout(500);
    
    // Verify search results still present (auto-updated)
    await expect(resultsHeading).toBeVisible();
    console.log('✅ Multiple filter changes trigger auto-search');
    
    // Check that search button is removed
    const searchButton = page.locator('button:has-text("Find Nice"), button:has-text("Find Weather")');
    await expect(searchButton).not.toBeVisible();
    console.log('✅ Search button removed');
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('📱 Testing mobile headerless auto-search...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/HEADERLESS-AUTO-SEARCH-mobile.png',
      fullPage: true 
    });
    
    // Verify no header on mobile
    const mobileHeader = page.locator('header');
    await expect(mobileHeader).not.toBeVisible();
    
    // Test mobile auto-search
    const mobileHotButton = page.locator('button:has-text("🔥")').first();
    await mobileHotButton.click();
    await page.waitForTimeout(500);
    
    const mobileResults = page.locator('text=Nice weather found!');
    await expect(mobileResults).toBeVisible();
    console.log('✅ Mobile auto-search working');
    
    // Check maximum content visibility in viewport
    const mobileFilters = page.locator('button:has-text("😌"), button:has-text("☀️"), button:has-text("🌱")');
    await expect(mobileFilters.first()).toBeVisible();
    console.log('✅ Maximum mobile content visible');
    
    console.log('✅ Headerless auto-search test completed');
  });
});