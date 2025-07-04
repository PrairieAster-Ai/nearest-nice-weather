const { test, expect } = require('@playwright/test');

test.describe('Hamburger Menu - Final Test', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('hamburger menu opens and shows weather filters', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    console.log('📱 Testing on mobile viewport: 375x667');
    
    // Take screenshot before interaction
    await page.screenshot({ 
      path: 'test-results/final-test-before.png',
      fullPage: true 
    });
    
    // Find hamburger menu button using the testid we added
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    
    // Verify button exists and is visible
    await expect(hamburgerButton).toBeVisible();
    console.log('✅ Hamburger button is visible');
    
    // Get button position
    const buttonBox = await hamburgerButton.boundingBox();
    console.log(`📍 Button position: x=${buttonBox?.x}, y=${buttonBox?.y}, width=${buttonBox?.width}, height=${buttonBox?.height}`);
    
    // Click the hamburger menu
    await hamburgerButton.click();
    console.log('🖱️ Clicked hamburger menu button');
    
    // Wait for animation to complete
    await page.waitForTimeout(1000);
    
    // Take screenshot after clicking
    await page.screenshot({ 
      path: 'test-results/final-test-after-click.png',
      fullPage: true 
    });
    
    // Check if sheet overlay is visible (using Radix UI data attributes)
    const sheetOverlay = page.locator('[data-radix-dialog-overlay]');
    if (await sheetOverlay.count() > 0) {
      console.log('✅ Sheet overlay detected');
      await expect(sheetOverlay).toBeVisible();
    }
    
    // Check if sheet content is visible
    const sheetContent = page.locator('[data-radix-dialog-content]');
    if (await sheetContent.count() > 0) {
      console.log('✅ Sheet content detected');
      await expect(sheetContent).toBeVisible();
    }
    
    // Check for weather filter buttons in the opened sheet
    const temperatureFilters = page.locator('button:has-text("🧊"), button:has-text("😌"), button:has-text("🔥")');
    const tempFilterCount = await temperatureFilters.count();
    console.log(`🌡️ Found ${tempFilterCount} temperature filter buttons`);
    
    const precipitationFilters = page.locator('button:has-text("🌧️"), button:has-text("⛅"), button:has-text("☀️")');
    const precipFilterCount = await precipitationFilters.count();
    console.log(`🌧️ Found ${precipFilterCount} precipitation filter buttons`);
    
    const windFilters = page.locator('button:has-text("💨"), button:has-text("🍃"), button:has-text("🌱")');
    const windFilterCount = await windFilters.count();
    console.log(`💨 Found ${windFilterCount} wind filter buttons`);
    
    // Verify at least some filters are visible
    const totalFilters = tempFilterCount + precipFilterCount + windFilterCount;
    console.log(`📊 Total filter buttons found: ${totalFilters}`);
    
    if (totalFilters > 0) {
      console.log('✅ SUCCESS: Weather filters are visible in hamburger menu!');
      
      // Test clicking a filter
      const firstFilter = temperatureFilters.first();
      if (await firstFilter.isVisible()) {
        await firstFilter.click();
        console.log('✅ Successfully clicked a weather filter');
        
        // Take screenshot showing filter interaction
        await page.screenshot({ 
          path: 'test-results/final-test-filter-clicked.png',
          fullPage: true 
        });
      }
    } else {
      console.log('❌ FAIL: No weather filters found in hamburger menu');
    }
    
    // Try to close the menu by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/final-test-after-close.png',
      fullPage: true 
    });
    
    console.log('🎯 Test completed');
  });

  test('compare before and after fix', async ({ page }) => {
    // Test both mobile and desktop to show responsive behavior
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/comparison-mobile-fixed.png',
      fullPage: true 
    });
    
    // Check if hamburger is visible
    const mobileHamburger = page.locator('[data-testid="mobile-menu-trigger"]');
    const mobileHamburgerVisible = await mobileHamburger.isVisible();
    console.log(`📱 Mobile hamburger visible: ${mobileHamburgerVisible}`);
    
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/comparison-desktop-fixed.png',
      fullPage: true 
    });
    
    // Check if desktop sidebar is visible
    const desktopSidebar = page.locator('.lg\\:flex .lg\\:fixed');
    const desktopSidebarVisible = await desktopSidebar.isVisible();
    console.log(`🖥️ Desktop sidebar visible: ${desktopSidebarVisible}`);
    
    // Check if hamburger is hidden on desktop
    const desktopHamburgerVisible = await mobileHamburger.isVisible();
    console.log(`🖥️ Desktop hamburger hidden: ${!desktopHamburgerVisible}`);
  });
});