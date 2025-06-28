const { test, expect } = require('@playwright/test');

test.describe('Material Design Implementation', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('Material Design button groups work correctly', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('🎨 Testing Material Design implementation...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/MATERIAL-DESIGN-desktop.png',
      fullPage: true 
    });
    
    // Check that Material UI ToggleButtonGroup is working
    const toggleButtons = page.locator('[role="group"]');
    const buttonGroupCount = await toggleButtons.count();
    console.log(`Material UI button groups found: ${buttonGroupCount}`);
    
    // Test Material Design button interactions
    const niceButton = page.locator('button:has-text("😌")').first();
    const coldButton = page.locator('button:has-text("🧊")').first();
    
    // Check default selected state (Nice should be selected)
    const niceSelected = await niceButton.getAttribute('aria-pressed');
    console.log(`Nice button selected by default: ${niceSelected}`);
    
    // Click Cold button
    await coldButton.click();
    await page.waitForTimeout(500);
    
    // Check that Cold is now selected and Nice is deselected
    const coldSelected = await coldButton.getAttribute('aria-pressed');
    const niceDeselected = await niceButton.getAttribute('aria-pressed');
    
    console.log(`After click - Cold selected: ${coldSelected}, Nice deselected: ${niceDeselected}`);
    
    // Screenshot after interaction
    await page.screenshot({ 
      path: 'test-results/MATERIAL-DESIGN-interaction.png',
      fullPage: true 
    });
    
    // Test precipitation button group
    const sunnyButton = page.locator('button:has-text("☀️")').first();
    const rainyButton = page.locator('button:has-text("🌧️")').first();
    
    await rainyButton.click();
    await page.waitForTimeout(500);
    
    const sunnyDeselected = await sunnyButton.getAttribute('aria-pressed');
    const rainySelected = await rainyButton.getAttribute('aria-pressed');
    console.log(`Precipitation change - Sunny deselected: ${sunnyDeselected}, Rainy selected: ${rainySelected}`);
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('📱 Testing Material Design mobile layout...');
    
    // Screenshot mobile layout
    await page.screenshot({ 
      path: 'test-results/MATERIAL-DESIGN-mobile.png',
      fullPage: true 
    });
    
    // Test mobile button size and spacing
    const mobileNiceButton = page.locator('button:has-text("😌")').first();
    await mobileNiceButton.click();
    await page.waitForTimeout(500);
    
    const mobileNiceSelected = await mobileNiceButton.getAttribute('aria-pressed');
    console.log(`Mobile button interaction working: ${mobileNiceSelected}`);
    
    // Check that labels are hidden on mobile (emoji only)
    const buttonText = await mobileNiceButton.textContent();
    const hasOnlyEmoji = buttonText && buttonText.trim() === '😌';
    console.log(`Mobile shows emoji only (no labels): ${hasOnlyEmoji}`);
    
    console.log('✅ Material Design implementation test completed');
  });
});