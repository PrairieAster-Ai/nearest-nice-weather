import { test, expect } from '@playwright/test';

test('Paul Bunyan State Trail centering test', async ({ page }) => {
  console.log('🏞️ Testing Paul Bunyan State Trail centering issue...');
  
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Wait for initial popup
  await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
  
  console.log('📍 Navigating to Paul Bunyan State Trail...');
  
  // Navigate through POIs until we reach Paul Bunyan State Trail
  let currentPOI = '';
  let stepCount = 0;
  
  while (stepCount < 10) { // Safety limit
    currentPOI = await page.locator('.leaflet-popup-content h3').textContent();
    console.log(`  Step ${stepCount + 1}: ${currentPOI}`);
    
    if (currentPOI.includes('Paul Bunyan')) {
      console.log('✅ Found Paul Bunyan State Trail!');
      break;
    }
    
    // Click farther button
    const button = page.locator('button:has-text("Farther")').first();
    const isVisible = await button.isVisible();
    
    if (isVisible) {
      await button.click();
      await page.waitForTimeout(1000); // Wait for navigation and potential centering
      stepCount++;
    } else {
      console.log('❌ No farther button available');
      break;
    }
  }
  
  if (currentPOI.includes('Paul Bunyan')) {
    console.log('🎯 Testing Paul Bunyan State Trail popup visibility...');
    
    // Check if popup is visible
    const popupVisible = await page.locator('.leaflet-popup').isVisible();
    console.log(`📊 Popup visible: ${popupVisible}`);
    
    // Take screenshot to verify centering
    await page.screenshot({ path: 'paul-bunyan-centering.png', fullPage: true });
    
    // Get viewport dimensions to analyze centering
    const viewport = page.viewportSize();
    console.log(`📐 Viewport: ${viewport.width}x${viewport.height}`);
    
    // Check if popup content is readable (not cut off)
    const popupContent = await page.locator('.leaflet-popup-content').boundingBox();
    if (popupContent) {
      console.log(`📊 Popup position: x=${popupContent.x}, y=${popupContent.y}`);
      console.log(`📊 Popup size: ${popupContent.width}x${popupContent.height}`);
      
      // Check if popup is within reasonable viewport bounds
      const inViewport = popupContent.x >= 0 && 
                        popupContent.y >= 0 && 
                        popupContent.x + popupContent.width <= viewport.width &&
                        popupContent.y + popupContent.height <= viewport.height;
      
      console.log(`📊 Popup fully in viewport: ${inViewport}`);
      
      if (inViewport) {
        console.log('✅ Paul Bunyan State Trail is properly centered and visible!');
      } else {
        console.log('⚠️ Paul Bunyan State Trail popup may be partially outside viewport');
      }
    }
    
    // Wait a bit more to see if any delayed centering occurs
    console.log('⏳ Waiting for potential delayed centering...');
    await page.waitForTimeout(2000);
    
    // Take final screenshot after delay
    await page.screenshot({ path: 'paul-bunyan-final.png', fullPage: true });
    
  } else {
    console.log('❌ Could not reach Paul Bunyan State Trail');
  }
  
  console.log('✅ Paul Bunyan centering test complete!');
});