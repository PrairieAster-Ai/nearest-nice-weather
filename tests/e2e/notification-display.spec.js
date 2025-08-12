import { test, expect } from '@playwright/test';

test('should show custom notification when reaching end of results', async ({ page }) => {
  console.log('🧪 Testing custom notification display...');
  
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Wait for popup to appear
  await page.waitForSelector('.leaflet-popup', { timeout: 10000 });
  
  // Navigate until we find a "No More" button
  console.log('📍 Navigating to find "No More" button...');
  let foundNoMore = false;
  let clickCount = 0;
  
  while (!foundNoMore && clickCount < 20) {
    const buttons = page.locator('button');
    const buttonTexts = await buttons.allTextContents();
    
    if (buttonTexts.some(text => text.includes('No More'))) {
      foundNoMore = true;
      console.log(`✅ Found "No More" button after ${clickCount} navigations`);
      break;
    }
    
    // Click farther/expand button
    const navButton = page.locator('button:has-text("Farther"), button:has-text("Expand")').first();
    const isVisible = await navButton.isVisible();
    
    if (isVisible) {
      await navButton.click();
      await page.waitForTimeout(500);
      clickCount++;
    } else {
      break;
    }
  }
  
  if (foundNoMore) {
    // Click the "No More" button
    const noMoreButton = page.locator('button:has-text("No More")').first();
    console.log('🖱️ Clicking "No More" button...');
    await noMoreButton.click();
    
    // Wait for notification
    await page.waitForTimeout(1000);
    
    // Take screenshot to see what's displayed
    await page.screenshot({ path: 'notification-test.png', fullPage: true });
    
    // Check if notification exists in DOM
    const notificationExists = await page.locator('text=End of Results').count();
    console.log(`📊 Notification elements found: ${notificationExists}`);
    
    if (notificationExists > 0) {
      console.log('✅ Custom notification created successfully');
      
      // Check visibility
      const isVisible = await page.locator('text=End of Results').isVisible();
      console.log(`👁️ Notification visible: ${isVisible}`);
      
      // Get computed style to check z-index
      const zIndex = await page.locator('div:has-text("End of Results")').first().evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      });
      console.log(`📏 Notification z-index: ${zIndex}`);
    }
  } else {
    console.log('❌ Could not find "No More" button - may need more POIs in test data');
  }
});