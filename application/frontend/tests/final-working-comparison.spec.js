const { test, expect } = require('@playwright/test');

test.describe('Final Working Comparison', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('create comparison screenshots of hamburger menu states', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    console.log('📱 Creating final comparison screenshots');
    
    // Screenshot 1: Mobile layout with hamburger menu (CLOSED)
    await page.screenshot({ 
      path: 'test-results/FINAL-hamburger-menu-CLOSED.png',
      fullPage: true 
    });
    
    console.log('✅ Captured: Hamburger menu CLOSED state');
    
    // Try multiple approaches to open the menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    
    // Approach 1: Regular click
    await hamburgerButton.click();
    await page.waitForTimeout(1000);
    
    // Check if modal appeared
    let modalVisible = await page.locator('[data-testid="modal-backdrop"], [data-testid="modal-content"]').count();
    console.log(`After regular click - modal elements found: ${modalVisible}`);
    
    if (modalVisible === 0) {
      // Approach 2: Force click
      await hamburgerButton.click({ force: true });
      await page.waitForTimeout(1000);
      modalVisible = await page.locator('[data-testid="modal-backdrop"], [data-testid="modal-content"]').count();
      console.log(`After force click - modal elements found: ${modalVisible}`);
    }
    
    if (modalVisible === 0) {
      // Approach 3: JavaScript click
      await page.evaluate(() => {
        const button = document.querySelector('[data-testid="mobile-menu-trigger"]');
        if (button) button.click();
      });
      await page.waitForTimeout(1000);
      modalVisible = await page.locator('[data-testid="modal-backdrop"], [data-testid="modal-content"]').count();
      console.log(`After JavaScript click - modal elements found: ${modalVisible}`);
    }
    
    // Screenshot 2: Attempt to capture open state (or still closed if not working)
    await page.screenshot({ 
      path: 'test-results/FINAL-hamburger-menu-ATTEMPTED-OPEN.png',
      fullPage: true 
    });
    
    if (modalVisible > 0) {
      console.log('✅ SUCCESS: Modal is open!');
      
      // Take a focused screenshot of the modal content
      const modalContent = page.locator('[data-testid="modal-content"]');
      await modalContent.screenshot({ 
        path: 'test-results/FINAL-modal-content-close-up.png'
      });
      
      // Look for weather filter content
      const filterContent = await page.textContent('body');
      const hasTemperature = filterContent.includes('Temperature');
      const hasPrecipitation = filterContent.includes('Precipitation');
      const hasWind = filterContent.includes('Wind');
      
      console.log(`Filter content found - Temperature: ${hasTemperature}, Precipitation: ${hasPrecipitation}, Wind: ${hasWind}`);
      
    } else {
      console.log('❌ ISSUE CONFIRMED: Modal does not open when hamburger menu is clicked');
      console.log('🔍 This confirms the React onClick handler is not working properly');
    }
    
    // Desktop comparison
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/FINAL-desktop-layout.png',
      fullPage: true 
    });
    
    console.log('✅ Captured: Desktop layout for comparison');
    
    // Summary
    const summary = {
      hamburgerButtonExists: await hamburgerButton.count() > 0,
      modalWorking: modalVisible > 0,
      issue: modalVisible === 0 ? 'React onClick handler not functioning' : 'Modal working correctly'
    };
    
    console.log('📊 Final Analysis:', summary);
  });
});