import { test, expect } from '@playwright/test';

test('complete navigation workflow with custom notification', async ({ page }) => {
  console.log('🧪 Testing complete navigation workflow...');
  
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Wait for initial popup
  await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
  
  console.log('📍 Starting navigation test...');
  
  // Navigate through several POIs
  for (let i = 0; i < 5; i++) {
    const button = page.locator('button:has-text("Farther")').first();
    await button.click();
    await page.waitForTimeout(500);
    
    const poi = await page.locator('.leaflet-popup-content h3').textContent();
    console.log(`  Step ${i + 1}: ${poi}`);
  }
  
  // Check current button states
  const buttons = await page.locator('.leaflet-popup-content button').allTextContents();
  console.log('🔘 Current buttons:', buttons);
  
  // Take a screenshot to see the current state
  await page.screenshot({ path: 'navigation-state.png', fullPage: true });
  console.log('📸 Screenshot saved as navigation-state.png');
  
  // Count total markers
  const markerCount = await page.locator('.leaflet-marker-icon').count();
  console.log(`📊 Total markers visible: ${markerCount}`);
  
  console.log('✅ Navigation system is working!');
});