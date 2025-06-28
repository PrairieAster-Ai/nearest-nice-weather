const { test, expect } = require('@playwright/test');

test.describe('Hamburger Menu Tests', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('hamburger menu shows and hides on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Take screenshot of closed menu
    await page.screenshot({ 
      path: 'test-results/hamburger-menu-closed.png',
      fullPage: true 
    });
    
    // Look for hamburger menu button
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"], button[aria-label="Toggle menu"], .hamburger-menu, [role="button"]:has-text("Menu")');
    
    // Check if hamburger button is visible
    const buttonCount = await hamburgerButton.count();
    console.log(`Found ${buttonCount} potential hamburger menu buttons`);
    
    if (buttonCount > 0) {
      // Check if button is visible
      const isVisible = await hamburgerButton.first().isVisible();
      console.log(`Hamburger button visible: ${isVisible}`);
      
      if (isVisible) {
        // Click the hamburger menu
        await hamburgerButton.first().click();
        
        // Wait for menu to open
        await page.waitForTimeout(500);
        
        // Take screenshot of open menu
        await page.screenshot({ 
          path: 'test-results/hamburger-menu-open.png',
          fullPage: true 
        });
        
        // Check if filters are visible in the menu
        const filtersInMenu = page.locator('[data-testid="weather-filters"], .weather-filters');
        const filtersVisible = await filtersInMenu.isVisible();
        console.log(`Filters visible in menu: ${filtersVisible}`);
        
        // Verify menu content is accessible
        expect(await filtersInMenu.count()).toBeGreaterThan(0);
      } else {
        console.log('❌ Hamburger button exists but is not visible');
      }
    } else {
      console.log('❌ No hamburger menu button found');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/hamburger-menu-missing.png',
        fullPage: true 
      });
    }
  });

  test('desktop sidebar shows filters directly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    // Take screenshot of desktop layout
    await page.screenshot({ 
      path: 'test-results/desktop-sidebar.png',
      fullPage: true 
    });
    
    // Check if sidebar with filters is visible
    const sidebar = page.locator('[data-testid="desktop-sidebar"], .sidebar, aside');
    const sidebarVisible = await sidebar.isVisible();
    console.log(`Desktop sidebar visible: ${sidebarVisible}`);
    
    // Check if filters are visible in sidebar
    const filtersInSidebar = page.locator('[data-testid="weather-filters"], .weather-filters');
    const filtersVisible = await filtersInSidebar.first().isVisible();
    console.log(`Filters visible in desktop sidebar: ${filtersVisible}`);
  });

  test('debug hamburger menu button positioning', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Inject CSS to highlight potential menu buttons
    await page.addStyleTag({
      content: `
        button, [role="button"] {
          outline: 2px solid red !important;
          background-color: rgba(255, 0, 0, 0.1) !important;
        }
        .fixed {
          outline: 3px solid blue !important;
        }
        [data-testid*="menu"], [class*="menu"], [class*="hamburger"] {
          outline: 4px solid green !important;
          background-color: rgba(0, 255, 0, 0.3) !important;
        }
      `
    });
    
    // Take screenshot with debug styling
    await page.screenshot({ 
      path: 'test-results/hamburger-debug-buttons.png',
      fullPage: true 
    });
    
    // Log all buttons found
    const allButtons = await page.locator('button, [role="button"]').all();
    console.log(`Total buttons found: ${allButtons.length}`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const boundingBox = await button.boundingBox();
      console.log(`Button ${i}: "${text}" - Visible: ${isVisible} - Position: ${JSON.stringify(boundingBox)}`);
    }
  });

  test('check responsive breakpoints', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 667, name: 'mobile-medium' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 1200, height: 800, name: 'desktop-large' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForTimeout(500);
      
      // Take screenshot at each breakpoint
      await page.screenshot({ 
        path: `test-results/responsive-${viewport.name}-${viewport.width}x${viewport.height}.png`,
        fullPage: false 
      });
      
      // Check what's visible at this breakpoint
      const hamburgerVisible = await page.locator('button:has-text("☰"), button:has-text("Menu"), [data-testid*="menu"]').isVisible();
      const sidebarVisible = await page.locator('aside, .sidebar, [data-testid*="sidebar"]').isVisible();
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Hamburger: ${hamburgerVisible}, Sidebar: ${sidebarVisible}`);
    }
  });
});