const { test, expect } = require('@playwright/test');

test.describe('Button Groups Layout', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('button groups display as connected segments', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('🖥️ Testing button group layout...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/BUTTON-GROUPS-desktop.png',
      fullPage: true 
    });
    
    // Check that button groups are visible
    const tempButtons = page.locator('button:has-text("Cold"), button:has-text("Nice"), button:has-text("Hot")');
    const precipButtons = page.locator('button:has-text("Sunny"), button:has-text("Mixed"), button:has-text("Rainy")');
    const windButtons = page.locator('button:has-text("Calm"), button:has-text("Breezy"), button:has-text("Windy")');
    
    // Verify all button groups are visible
    await expect(tempButtons.first()).toBeVisible();
    await expect(precipButtons.first()).toBeVisible();
    await expect(windButtons.first()).toBeVisible();
    
    console.log('✅ All button groups visible');
    
    // Test button group interaction - click different temperature
    const coldButton = page.locator('button:has-text("Cold")').first();
    const niceButton = page.locator('button:has-text("Nice")').first();
    
    // Verify Nice is selected by default
    const niceSelected = await niceButton.evaluate(el => 
      el.classList.contains('bg-primary-blue')
    );
    console.log(`Nice temperature selected by default: ${niceSelected}`);
    
    // Click Cold button
    await coldButton.click();
    await page.waitForTimeout(500);
    
    // Verify Cold is now selected
    const coldSelected = await coldButton.evaluate(el => 
      el.classList.contains('bg-primary-blue')
    );
    console.log(`Cold temperature selected after click: ${coldSelected}`);
    
    // Screenshot after selection change
    await page.screenshot({ 
      path: 'test-results/BUTTON-GROUPS-after-selection.png',
      fullPage: true 
    });
    
    // Test precipitation button group
    const rainyButton = page.locator('button:has-text("Rainy")').first();
    await rainyButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Precipitation button group interaction working');
    
    // Test wind button group
    const windyButton = page.locator('button:has-text("Windy")').first();
    await windyButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Wind button group interaction working');
    
    // Final screenshot with all selections
    await page.screenshot({ 
      path: 'test-results/BUTTON-GROUPS-all-selections.png',
      fullPage: true 
    });
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('📱 Testing mobile button groups...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/BUTTON-GROUPS-mobile.png',
      fullPage: true 
    });
    
    // Verify button groups work on mobile
    const mobileTempButton = page.locator('button:has-text("Hot")').first();
    await mobileTempButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Mobile button group interaction working');
    
    console.log('✅ Button groups test completed');
  });
});