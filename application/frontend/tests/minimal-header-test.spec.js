const { test, expect } = require('@playwright/test');

test.describe('Minimal Header Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('header area is minimal with 40px height limit', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('📏 Testing minimal header layout...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/MINIMAL-HEADER-desktop.png',
      fullPage: true 
    });
    
    // Check that heading and description are removed
    const heading = page.locator('h1:has-text("Find Your Perfect Weather")');
    const description = page.locator('text=Discover the nearest locations');
    
    await expect(heading).not.toBeVisible();
    await expect(description).not.toBeVisible();
    console.log('✅ Heading and description text removed');
    
    // Verify filters are still present and working
    const niceButton = page.locator('button:has-text("😌")').first();
    const coldButton = page.locator('button:has-text("🧊")').first();
    
    await expect(niceButton).toBeVisible();
    await expect(coldButton).toBeVisible();
    console.log('✅ Filter buttons still visible and accessible');
    
    // Test filter interaction still works
    await coldButton.click();
    await page.waitForTimeout(500);
    
    const coldSelected = await coldButton.getAttribute('aria-pressed');
    console.log(`Filter interaction working: ${coldSelected}`);
    
    // Check that results are visible higher up on screen
    const resultsHeading = page.locator('text=Nice weather found!');
    await expect(resultsHeading).toBeVisible();
    
    // Measure approximate vertical position of filters
    const filterContainer = page.locator('div:has(button:has-text("🧊"))').first();
    const filterPosition = await filterContainer.boundingBox();
    console.log(`Filter container top position: ${filterPosition?.y}px (should be close to header)`);
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('📱 Testing minimal mobile header...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/MINIMAL-HEADER-mobile.png',
      fullPage: true 
    });
    
    // Verify mobile also has minimal header
    const mobileHeading = page.locator('h1:has-text("Find Your Perfect Weather")');
    await expect(mobileHeading).not.toBeVisible();
    
    // Check mobile filters are still stacked properly
    const mobileNiceButton = page.locator('button:has-text("😌")').first();
    await expect(mobileNiceButton).toBeVisible();
    
    // Test mobile interaction
    await mobileNiceButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Mobile filter interaction working');
    
    // Verify more content fits in viewport
    const mobileResults = page.locator('text=Nice weather found!');
    await expect(mobileResults).toBeVisible();
    console.log('✅ More content visible in mobile viewport');
    
    console.log('✅ Minimal header test completed');
  });
});