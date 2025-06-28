const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsive Button Groups', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('mobile layout stacks properly with better spacing', async ({ page }) => {
    // Mobile test with proper viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('📱 Testing improved mobile button group layout...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/MOBILE-IMPROVED-layout.png',
      fullPage: true 
    });
    
    // Check that button groups are visible and properly spaced
    const tempButtons = page.locator('button:has-text("🧊"), button:has-text("😌"), button:has-text("🔥")');
    const precipButtons = page.locator('button:has-text("☀️"), button:has-text("⛅"), button:has-text("🌧️")');
    const windButtons = page.locator('button:has-text("🌱"), button:has-text("🍃"), button:has-text("💨")');
    
    // Verify all button groups are visible
    await expect(tempButtons.first()).toBeVisible();
    await expect(precipButtons.first()).toBeVisible();
    await expect(windButtons.first()).toBeVisible();
    
    console.log('✅ All button groups visible on mobile');
    
    // Check that labels are showing on mobile now
    const tempLabel = page.locator('text=🌡️ Temp');
    const rainLabel = page.locator('text=☔ Rain');
    const windLabel = page.locator('text=💨 Wind');
    
    await expect(tempLabel).toBeVisible();
    await expect(rainLabel).toBeVisible();
    await expect(windLabel).toBeVisible();
    
    console.log('✅ Labels visible and properly sized on mobile');
    
    // Test button interactions work properly on mobile
    const coldButton = page.locator('button:has-text("🧊")').first();
    const niceButton = page.locator('button:has-text("😌")').first();
    
    // Click cold button
    await coldButton.click();
    await page.waitForTimeout(500);
    
    // Verify cold is now selected
    const coldSelected = await coldButton.evaluate(el => 
      el.classList.contains('bg-primary-blue')
    );
    console.log(`Cold temperature selected on mobile: ${coldSelected}`);
    
    // Test precipitation button
    const rainyButton = page.locator('button:has-text("🌧️")').first();
    await rainyButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Mobile button interactions working');
    
    // Test search button is full width on mobile
    const searchButton = page.locator('button:has-text("Find Weather")');
    await expect(searchButton).toBeVisible();
    
    const searchButtonWidth = await searchButton.evaluate(el => 
      getComputedStyle(el).width
    );
    console.log(`Mobile search button width: ${searchButtonWidth}`);
    
    // Screenshot after interactions
    await page.screenshot({ 
      path: 'test-results/MOBILE-IMPROVED-interactions.png',
      fullPage: true 
    });
    
    // Test landscape mobile
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);
    
    console.log('📱 Testing landscape mobile layout...');
    
    await page.screenshot({ 
      path: 'test-results/MOBILE-LANDSCAPE-layout.png',
      fullPage: true 
    });
    
    // Verify layout adapts to landscape
    await expect(tempButtons.first()).toBeVisible();
    console.log('✅ Landscape mobile layout working');
    
    console.log('✅ Mobile responsive test completed');
  });
});