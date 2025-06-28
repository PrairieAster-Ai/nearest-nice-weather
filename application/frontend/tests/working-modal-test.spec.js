const { test, expect } = require('@playwright/test');

test.describe('Working Modal Test', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('custom modal shows hamburger menu with filters', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    console.log('📱 Testing custom modal implementation');
    
    // Screenshot before clicking
    await page.screenshot({ 
      path: 'test-results/custom-modal-closed.png',
      fullPage: true 
    });
    
    // Click hamburger menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();
    
    console.log('🖱️ Clicked hamburger menu');
    await page.waitForTimeout(500);
    
    // Check if backdrop is visible
    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    await expect(backdrop).toBeVisible();
    console.log('✅ Modal backdrop is visible');
    
    // Check if modal content is visible
    const modalContent = page.locator('[data-testid="modal-content"]');
    await expect(modalContent).toBeVisible();
    console.log('✅ Modal content is visible');
    
    // Check for success message
    const successMessage = page.locator('text=Modal is working');
    await expect(successMessage).toBeVisible();
    console.log('✅ Success message visible');
    
    // Screenshot with modal open
    await page.screenshot({ 
      path: 'test-results/custom-modal-open.png',
      fullPage: true 
    });
    
    // Look for weather filter components
    const temperatureCard = page.locator('text=Temperature');
    const precipitationCard = page.locator('text=Precipitation');
    const windCard = page.locator('text=Wind');
    
    const tempVisible = await temperatureCard.isVisible();
    const precipVisible = await precipitationCard.isVisible();
    const windVisible = await windCard.isVisible();
    
    console.log(`🌡️ Temperature filter visible: ${tempVisible}`);
    console.log(`🌧️ Precipitation filter visible: ${precipVisible}`);
    console.log(`💨 Wind filter visible: ${windVisible}`);
    
    // Try clicking a filter option
    const coldestOption = page.locator('text=🧊').first();
    if (await coldestOption.isVisible()) {
      await coldestOption.click();
      console.log('✅ Successfully clicked temperature filter');
      
      await page.screenshot({ 
        path: 'test-results/custom-modal-filter-selected.png',
        fullPage: true 
      });
    }
    
    // Test close button
    const closeButton = page.locator('[data-testid="close-modal"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    console.log('🖱️ Clicked close button');
    await page.waitForTimeout(500);
    
    // Verify modal is closed
    await expect(backdrop).not.toBeVisible();
    await expect(modalContent).not.toBeVisible();
    console.log('✅ Modal closed successfully');
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/custom-modal-final.png',
      fullPage: true 
    });
  });

  test('compare desktop vs mobile layouts', async ({ page }) => {
    // Desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/desktop-layout-final.png',
      fullPage: true 
    });
    
    // Hamburger should be hidden on desktop
    const hamburgerDesktop = page.locator('[data-testid="mobile-menu-trigger"]');
    const hamburgerVisible = await hamburgerDesktop.isVisible();
    console.log(`🖥️ Desktop hamburger hidden: ${!hamburgerVisible}`);
    
    // Mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/mobile-layout-final.png',
      fullPage: true 
    });
    
    // Hamburger should be visible on mobile
    const hamburgerMobile = page.locator('[data-testid="mobile-menu-trigger"]');
    const hamburgerMobileVisible = await hamburgerMobile.isVisible();
    console.log(`📱 Mobile hamburger visible: ${hamburgerMobileVisible}`);
  });
});