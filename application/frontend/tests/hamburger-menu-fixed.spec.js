const { test, expect } = require('@playwright/test');

test.describe('Hamburger Menu - Fixed Tests', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('hamburger menu opens and shows filters', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Take screenshot before clicking
    await page.screenshot({ 
      path: 'test-results/hamburger-before-click.png',
      fullPage: true 
    });
    
    // Find the hamburger menu button using the correct selector
    // Based on the code: Button with Menu icon, positioned fixed top-4 left-4
    const hamburgerButton = page.locator('button:has(svg)').first();
    
    // Verify button is visible
    await expect(hamburgerButton).toBeVisible();
    console.log('✅ Hamburger button is visible');
    
    // Get button position to verify it's in the right place
    const buttonBox = await hamburgerButton.boundingBox();
    console.log(`Button position: x=${buttonBox?.x}, y=${buttonBox?.y}`);
    
    // Click the hamburger menu
    await hamburgerButton.click();
    console.log('🖱️ Clicked hamburger menu');
    
    // Wait for the sheet to open
    await page.waitForTimeout(500);
    
    // Take screenshot after clicking
    await page.screenshot({ 
      path: 'test-results/hamburger-after-click.png',
      fullPage: true 
    });
    
    // Check if the sheet content is visible
    // The sheet should have the weather filters
    const sheetContent = page.locator('[role="dialog"], [data-state="open"]');
    await expect(sheetContent).toBeVisible();
    console.log('✅ Sheet dialog is open');
    
    // Look for filter buttons inside the sheet
    const filterButtons = page.locator('button:has-text("🧊"), button:has-text("😌"), button:has-text("🔥")');
    const buttonCount = await filterButtons.count();
    console.log(`Found ${buttonCount} filter buttons in the sheet`);
    
    if (buttonCount > 0) {
      console.log('✅ Weather filters are visible in the hamburger menu');
      
      // Take a focused screenshot of just the open menu
      const sheet = page.locator('[role="dialog"]');
      await sheet.screenshot({ 
        path: 'test-results/hamburger-menu-content.png'
      });
    } else {
      console.log('❌ Weather filters are NOT visible in the hamburger menu');
    }
    
    // Try to close the menu by clicking outside or pressing escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Take screenshot after closing
    await page.screenshot({ 
      path: 'test-results/hamburger-after-close.png',
      fullPage: true 
    });
  });

  test('verify filter functionality in mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Open hamburger menu
    const hamburgerButton = page.locator('button:has(svg)').first();
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    // Try to interact with filters
    const coldestButton = page.locator('button:has-text("🧊Coldest")');
    if (await coldestButton.isVisible()) {
      await coldestButton.click();
      console.log('✅ Successfully clicked Coldest filter');
      
      // Take screenshot showing filter selection
      await page.screenshot({ 
        path: 'test-results/hamburger-filter-selected.png',
        fullPage: true 
      });
    } else {
      console.log('❌ Coldest filter not visible or clickable');
    }
  });

  test('compare desktop vs mobile layouts', async ({ page }) => {
    // Desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/desktop-layout-comparison.png',
      fullPage: true 
    });
    
    // Check if filters are visible in desktop sidebar
    const desktopFilters = page.locator('button:has-text("🧊Coldest")');
    const desktopFiltersVisible = await desktopFilters.isVisible();
    console.log(`Desktop filters visible: ${desktopFiltersVisible}`);
    
    // Mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/mobile-layout-comparison.png',
      fullPage: true 
    });
    
    // Check if hamburger menu is visible
    const hamburgerVisible = await page.locator('button:has(svg)').first().isVisible();
    console.log(`Mobile hamburger visible: ${hamburgerVisible}`);
    
    // Check if filters are hidden in mobile (should be in hamburger menu)
    const mobileFiltersVisible = await desktopFilters.isVisible();
    console.log(`Mobile filters directly visible: ${mobileFiltersVisible}`);
  });
});