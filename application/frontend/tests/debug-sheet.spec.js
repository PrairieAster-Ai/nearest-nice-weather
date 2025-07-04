const { test, expect } = require('@playwright/test');

test.describe('Sheet Component Debug', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('debug sheet component rendering', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    console.log('🔍 Starting sheet debug...');
    
    // Inject CSS to make sheet components visible for debugging
    await page.addStyleTag({
      content: `
        [data-radix-dialog-overlay] {
          background: rgba(255, 0, 0, 0.8) !important;
          border: 5px solid red !important;
          z-index: 9999 !important;
        }
        [data-radix-dialog-content] {
          background: lime !important;
          border: 5px solid blue !important;
          z-index: 9999 !important;
        }
        [role="dialog"] {
          background: yellow !important;
          border: 5px solid purple !important;
        }
        .sheet-trigger-debug {
          background: orange !important;
          border: 3px solid black !important;
        }
      `
    });
    
    // Add debug class to hamburger button
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="mobile-menu-trigger"]');
      if (button) button.classList.add('sheet-trigger-debug');
    });
    
    await page.screenshot({ 
      path: 'test-results/debug-before-click.png',
      fullPage: true 
    });
    
    // Click hamburger menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    await hamburgerButton.click();
    console.log('🖱️ Clicked hamburger (debug mode)');
    
    await page.waitForTimeout(1000);
    
    // Take screenshot after click with debug styles
    await page.screenshot({ 
      path: 'test-results/debug-after-click.png',
      fullPage: true 
    });
    
    // Check DOM elements
    const overlayCount = await page.locator('[data-radix-dialog-overlay]').count();
    const contentCount = await page.locator('[data-radix-dialog-content]').count();
    const dialogCount = await page.locator('[role="dialog"]').count();
    
    console.log(`🔍 DOM elements found:`);
    console.log(`  - Overlay elements: ${overlayCount}`);
    console.log(`  - Content elements: ${contentCount}`);
    console.log(`  - Dialog elements: ${dialogCount}`);
    
    // Get computed styles of overlay if it exists
    if (overlayCount > 0) {
      const overlayStyles = await page.locator('[data-radix-dialog-overlay]').first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position,
          top: styles.top,
          left: styles.left,
          width: styles.width,
          height: styles.height,
          background: styles.background
        };
      });
      console.log('🎨 Overlay computed styles:', overlayStyles);
    }
    
    // Get computed styles of content if it exists
    if (contentCount > 0) {
      const contentStyles = await page.locator('[data-radix-dialog-content]').first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position,
          transform: styles.transform,
          width: styles.width,
          height: styles.height
        };
      });
      console.log('🎨 Content computed styles:', contentStyles);
    }
    
    // Check if filters are actually in the DOM and accessible
    const filterElements = await page.locator('input[type="radio"]').count();
    console.log(`📝 Radio input elements found: ${filterElements}`);
    
    const labelElements = await page.locator('label:has-text("Coldest"), label:has-text("Comfortable"), label:has-text("Hottest")').count();
    console.log(`🏷️ Filter label elements found: ${labelElements}`);
    
    // Check sheet state
    const sheetOpen = await page.evaluate(() => {
      const sheetElements = document.querySelectorAll('[data-state]');
      const states = Array.from(sheetElements).map(el => ({
        element: el.tagName,
        state: el.getAttribute('data-state'),
        class: el.className
      }));
      return states;
    });
    console.log('📊 Sheet states:', sheetOpen);
  });
});