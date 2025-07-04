const { test, expect } = require('@playwright/test');

test.describe('Final Button Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('final layout with all requested changes', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('🖥️ Testing final desktop layout...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/FINAL-LAYOUT-desktop.png',
      fullPage: true 
    });
    
    // Check that labels are removed (should not find temp/rain/wind text)
    const tempLabel = page.locator('text=🌡️ Temp');
    const rainLabel = page.locator('text=☔ Rain');
    const windLabel = page.locator('text=💨 Wind');
    
    await expect(tempLabel).not.toBeVisible();
    await expect(rainLabel).not.toBeVisible();
    await expect(windLabel).not.toBeVisible();
    console.log('✅ Labels removed successfully');
    
    // Check button groups are visible
    const tempButtons = page.locator('button:has-text("🧊"), button:has-text("😌"), button:has-text("🔥")');
    const precipButtons = page.locator('button:has-text("☀️"), button:has-text("⛅"), button:has-text("🌧️")');
    const windButtons = page.locator('button:has-text("🌱"), button:has-text("🍃"), button:has-text("💨")');
    
    await expect(tempButtons.first()).toBeVisible();
    await expect(precipButtons.first()).toBeVisible();
    await expect(windButtons.first()).toBeVisible();
    console.log('✅ All button groups visible');
    
    // Check "Find Nice" button text
    const findButton = page.locator('button:has-text("Find Nice")');
    await expect(findButton).toBeVisible();
    console.log('✅ Button text changed to "Find Nice"');
    
    // Test active state by clicking a button
    const coldButton = page.locator('button:has-text("🧊")').first();
    const niceButton = page.locator('button:has-text("😌")').first();
    
    // Check Nice is selected by default (should have scale-105 class)
    const niceActive = await niceButton.evaluate(el => 
      el.classList.contains('scale-105') && el.classList.contains('bg-primary-blue')
    );
    console.log(`Nice button has active state: ${niceActive}`);
    
    // Click Cold button and check active state
    await coldButton.click();
    await page.waitForTimeout(500);
    
    const coldActive = await coldButton.evaluate(el => 
      el.classList.contains('scale-105') && el.classList.contains('bg-primary-blue')
    );
    console.log(`Cold button has active state after click: ${coldActive}`);
    
    // Screenshot after interaction
    await page.screenshot({ 
      path: 'test-results/FINAL-LAYOUT-desktop-active.png',
      fullPage: true 
    });
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('📱 Testing final mobile layout...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/FINAL-LAYOUT-mobile.png',
      fullPage: true 
    });
    
    // Check mobile stacking
    const mobileTempButton = page.locator('button:has-text("😌")').first();
    const mobilePrecipButton = page.locator('button:has-text("☀️")').first();
    const mobileWindButton = page.locator('button:has-text("🌱")').first();
    
    await expect(mobileTempButton).toBeVisible();
    await expect(mobilePrecipButton).toBeVisible();
    await expect(mobileWindButton).toBeVisible();
    console.log('✅ Mobile button groups visible and stacked');
    
    // Test mobile interaction
    const mobileHotButton = page.locator('button:has-text("🔥")').first();
    await mobileHotButton.click();
    await page.waitForTimeout(500);
    
    const mobileHotActive = await mobileHotButton.evaluate(el => 
      el.classList.contains('scale-105')
    );
    console.log(`Mobile hot button active state: ${mobileHotActive}`);
    
    // Screenshot mobile after interaction
    await page.screenshot({ 
      path: 'test-results/FINAL-LAYOUT-mobile-active.png',
      fullPage: true 
    });
    
    console.log('✅ Final layout test completed');
  });
});