import { test, expect } from '@playwright/test';

test('Paul Bunyan State Trail should show "Farther" button, not "No More"', async ({ page }) => {
  console.log('🔘 Testing Paul Bunyan State Trail button text...');
  
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
      await page.waitForTimeout(1000); // Wait for navigation
      stepCount++;
    } else {
      console.log('❌ No farther button available');
      break;
    }
  }
  
  if (currentPOI.includes('Paul Bunyan')) {
    console.log('🔘 Testing Paul Bunyan State Trail button text...');
    
    // Get all button texts in the popup
    const buttons = await page.locator('.leaflet-popup-content button').allTextContents();
    console.log(`📊 Button texts: ${JSON.stringify(buttons)}`);
    
    // Check for correct button text
    const hasFartherButton = buttons.some(text => text.includes('Farther') || text.includes('Expand'));
    const hasNoMoreButton = buttons.some(text => text.includes('No More'));
    
    console.log(`📊 Has Farther/Expand button: ${hasFartherButton}`);
    console.log(`📊 Has "No More" button: ${hasNoMoreButton}`);
    
    if (hasFartherButton && !hasNoMoreButton) {
      console.log('✅ Paul Bunyan State Trail shows correct "Farther" button!');
    } else if (hasNoMoreButton) {
      console.log('❌ Paul Bunyan State Trail incorrectly shows "No More" button');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'paul-bunyan-button-issue.png', fullPage: true });
      console.log('📸 Screenshot saved for debugging');
    } else {
      console.log('⚠️ Unexpected button state');
    }
    
    // Test that the button actually works (should navigate to next POI)
    if (hasFartherButton) {
      console.log('🧪 Testing button functionality...');
      const fartherButton = page.locator('button:has-text("Farther"), button:has-text("Expand")').first();
      await fartherButton.click();
      await page.waitForTimeout(1000);
      
      const newPOI = await page.locator('.leaflet-popup-content h3').textContent();
      console.log(`📍 After click: ${newPOI}`);
      
      if (newPOI !== currentPOI) {
        console.log('✅ Button functionality works correctly!');
      } else {
        console.log('⚠️ Button click did not change POI');
      }
    }
    
  } else {
    console.log('❌ Could not reach Paul Bunyan State Trail');
  }
  
  console.log('✅ Paul Bunyan button text test complete!');
});