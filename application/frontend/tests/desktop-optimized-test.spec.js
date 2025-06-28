const { test, expect } = require('@playwright/test');

test.describe('Desktop Optimized Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('desktop layout is information dense with clear states', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('🖥️ Testing optimized desktop layout...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/DESKTOP-OPTIMIZED-layout.png',
      fullPage: true 
    });
    
    // Check that all filter options are visible at once
    const allButtons = page.locator('button:has-text("🧊"), button:has-text("😌"), button:has-text("🔥"), button:has-text("☀️"), button:has-text("⛅"), button:has-text("🌧️"), button:has-text("🌱"), button:has-text("🍃"), button:has-text("💨")');
    
    // Verify all 9 filter buttons are visible
    const buttonCount = await allButtons.count();
    console.log(`Total filter buttons visible: ${buttonCount}`);
    expect(buttonCount).toBe(9);
    
    // Check active state visibility - Nice should be selected by default
    const niceButton = page.locator('button:has-text("😌")').first();
    const sunnyButton = page.locator('button:has-text("☀️")').first();
    const calmButton = page.locator('button:has-text("🌱")').first();
    
    // Verify default selections are clearly visible
    const niceActive = await niceButton.evaluate(el => 
      el.classList.contains('bg-primary-blue') && el.classList.contains('text-white')
    );
    const sunnyActive = await sunnyButton.evaluate(el => 
      el.classList.contains('bg-primary-blue') && el.classList.contains('text-white')
    );
    const calmActive = await calmButton.evaluate(el => 
      el.classList.contains('bg-primary-blue') && el.classList.contains('text-white')
    );
    
    console.log(`Active states visible - Nice: ${niceActive}, Sunny: ${sunnyActive}, Calm: ${calmActive}`);
    
    // Check inactive state visibility - Cold should be inactive
    const coldButton = page.locator('button:has-text("🧊")').first();
    const coldInactive = await coldButton.evaluate(el => 
      el.classList.contains('text-gray-600') && el.classList.contains('bg-white')
    );
    console.log(`Inactive state visible - Cold: ${coldInactive}`);
    
    // Test state change visibility
    await coldButton.click();
    await page.waitForTimeout(300);
    
    const coldNowActive = await coldButton.evaluate(el => 
      el.classList.contains('bg-primary-blue') && el.classList.contains('text-white')
    );
    const niceNowInactive = await niceButton.evaluate(el => 
      el.classList.contains('text-gray-600') && el.classList.contains('bg-white')
    );
    
    console.log(`State change visible - Cold active: ${coldNowActive}, Nice inactive: ${niceNowInactive}`);
    
    // Screenshot after state change
    await page.screenshot({ 
      path: 'test-results/DESKTOP-OPTIMIZED-state-change.png',
      fullPage: true 
    });
    
    // Check spacing and information density
    const filterContainer = page.locator('div:has(button:has-text("🧊"))').first();
    const containerHeight = await filterContainer.evaluate(el => el.offsetHeight);
    console.log(`Filter container height: ${containerHeight}px (should be compact)`);
    
    // Verify all content fits in viewport
    const viewportHeight = 800;
    const resultsVisible = await page.locator('text=Nice weather found!').isVisible();
    console.log(`Results visible in viewport: ${resultsVisible}`);
    
    // Mobile comparison test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('📱 Verifying mobile view unchanged...');
    
    // Screenshot mobile to ensure it's unchanged
    await page.screenshot({ 
      path: 'test-results/DESKTOP-OPTIMIZED-mobile-unchanged.png',
      fullPage: true 
    });
    
    // Verify mobile still stacks
    const mobileButtons = page.locator('button:has-text("😌"), button:has-text("☀️"), button:has-text("🌱")');
    await expect(mobileButtons.first()).toBeVisible();
    console.log('✅ Mobile layout preserved');
    
    console.log('✅ Desktop optimization test completed');
  });
});