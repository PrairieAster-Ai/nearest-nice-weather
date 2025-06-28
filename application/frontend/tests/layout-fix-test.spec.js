const { test, expect } = require('@playwright/test');

test.describe('Layout Fix Test', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('verify improved hamburger menu layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    console.log('📱 Testing improved layout...');
    
    // Screenshot BEFORE clicking menu
    await page.screenshot({ 
      path: 'test-results/LAYOUT-FIX-closed-state.png',
      fullPage: true 
    });
    
    // Check hamburger button size and position
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(hamburgerButton).toBeVisible();
    
    const buttonBox = await hamburgerButton.boundingBox();
    console.log(`Hamburger button: ${buttonBox?.width}x${buttonBox?.height} at (${buttonBox?.x}, ${buttonBox?.y})`);
    
    // Check for the info icon size
    const infoIcon = page.locator('svg[viewBox="0 0 24 24"]:has(path[d*="M13 16h-1v-4h-1"])');
    if (await infoIcon.count() > 0) {
      const iconBox = await infoIcon.first().boundingBox();
      console.log(`Info icon: ${iconBox?.width}x${iconBox?.height}`);
    }
    
    // Click hamburger menu
    await hamburgerButton.click();
    await page.waitForTimeout(1000);
    
    // Screenshot AFTER clicking menu
    await page.screenshot({ 
      path: 'test-results/LAYOUT-FIX-modal-open.png',
      fullPage: true 
    });
    
    // Check modal dimensions
    const modalContent = page.locator('[data-testid="modal-content"]');
    if (await modalContent.isVisible()) {
      const modalBox = await modalContent.boundingBox();
      console.log(`Modal: ${modalBox?.width}x${modalBox?.height} at (${modalBox?.x}, ${modalBox?.y})`);
      
      // Check if modal is properly sized for mobile
      const isProperlySize = modalBox?.width && modalBox.width <= 320; // Should be max 320px or 85vw
      console.log(`Modal properly sized for mobile: ${isProperlySize}`);
      
      // Test close button
      const closeButton = page.locator('[data-testid="close-modal"]');
      if (await closeButton.isVisible()) {
        const closeBox = await closeButton.boundingBox();
        console.log(`Close button: ${closeBox?.width}x${closeBox?.height}`);
        
        await closeButton.click();
        await page.waitForTimeout(500);
        
        // Verify modal closes
        const stillVisible = await modalContent.isVisible().catch(() => false);
        console.log(`Modal closes properly: ${!stillVisible}`);
      }
    }
    
    // Final screenshot showing closed state
    await page.screenshot({ 
      path: 'test-results/LAYOUT-FIX-final-state.png',
      fullPage: true 
    });
    
    console.log('✅ Layout test completed');
  });
  
  test('compare different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'small-mobile' },
      { width: 375, height: 667, name: 'medium-mobile' },
      { width: 414, height: 896, name: 'large-mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      await page.waitForTimeout(1000);
      
      // Test hamburger button visibility and positioning
      const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
      const isVisible = await hamburgerButton.isVisible();
      
      if (isVisible) {
        const buttonBox = await hamburgerButton.boundingBox();
        console.log(`${viewport.name}: Button at (${buttonBox?.x}, ${buttonBox?.y}), size ${buttonBox?.width}x${buttonBox?.height}`);
        
        // Click and test modal
        await hamburgerButton.click();
        await page.waitForTimeout(500);
        
        const modalContent = page.locator('[data-testid="modal-content"]');
        if (await modalContent.isVisible()) {
          const modalBox = await modalContent.boundingBox();
          const fitsScreen = modalBox?.width && modalBox.width <= viewport.width * 0.9;
          console.log(`${viewport.name}: Modal fits screen: ${fitsScreen}`);
        }
        
        // Screenshot for this viewport
        await page.screenshot({ 
          path: `test-results/LAYOUT-FIX-${viewport.name}-open.png`,
          fullPage: true 
        });
        
        // Close modal
        const closeButton = page.locator('[data-testid="close-modal"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});