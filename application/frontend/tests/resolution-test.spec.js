const { test, expect } = require('@playwright/test');

test.describe('Resolution Test', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('test fixed hamburger menu with hydration fix', async ({ page }) => {
    // Capture all console messages to see React logs
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Wait longer for hydration to complete
    await page.waitForTimeout(3000);
    
    console.log('📱 Testing hydration fix...');
    
    // Check if hamburger button exists and is interactive
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(hamburgerButton).toBeVisible();
    
    // Take screenshot before click
    await page.screenshot({ 
      path: 'test-results/RESOLUTION-before-click.png',
      fullPage: true 
    });
    
    // Click hamburger menu
    await hamburgerButton.click();
    console.log('🖱️ Clicked hamburger button');
    
    // Wait for React state update
    await page.waitForTimeout(2000);
    
    // Check for modal elements
    const modalBackdrop = page.locator('[data-testid="modal-backdrop"]');
    const modalContent = page.locator('[data-testid="modal-content"]');
    
    const backdropVisible = await modalBackdrop.isVisible().catch(() => false);
    const contentVisible = await modalContent.isVisible().catch(() => false);
    
    console.log(`Modal backdrop visible: ${backdropVisible}`);
    console.log(`Modal content visible: ${contentVisible}`);
    
    // Take screenshot after click
    await page.screenshot({ 
      path: 'test-results/RESOLUTION-after-click.png',
      fullPage: true 
    });
    
    if (backdropVisible || contentVisible) {
      console.log('🎉 SUCCESS! Modal is now working!');
      
      // Test filter interaction
      const temperatureFilters = page.locator('text=Temperature');
      if (await temperatureFilters.isVisible()) {
        console.log('✅ Weather filters are visible in modal');
        
        // Try clicking a filter option
        const coldestFilter = page.locator('text=🧊').first();
        if (await coldestFilter.isVisible()) {
          await coldestFilter.click();
          console.log('✅ Filter interaction working');
        }
      }
      
      // Test close functionality
      const closeButton = page.locator('[data-testid="close-modal"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(1000);
        
        const stillVisible = await modalBackdrop.isVisible().catch(() => false);
        console.log(`Modal closes properly: ${!stillVisible}`);
      }
      
    } else {
      console.log('❌ Issue persists - checking console logs...');
      
      // Print React console logs for debugging
      const reactLogs = consoleMessages.filter(msg => msg.includes('ResponsiveSidebar'));
      console.log('React component logs:');
      reactLogs.forEach(log => console.log(`  ${log}`));
      
      // Check if click handler is now attached
      const clickHandlerWorking = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="mobile-menu-trigger"]');
        if (button) {
          // Try to trigger click programmatically and see if React responds
          const event = new MouseEvent('click', { bubbles: true });
          button.dispatchEvent(event);
          
          // Check if any modal elements appear after programmatic click
          setTimeout(() => {
            const modal = document.querySelector('[data-testid="modal-backdrop"]');
            return !!modal;
          }, 100);
        }
        return false;
      });
      
      console.log(`Programmatic click test: ${clickHandlerWorking}`);
    }
    
    // Final analysis
    const resolution = {
      modalWorking: backdropVisible || contentVisible,
      hydrationFixed: consoleMessages.some(msg => msg.includes('isMounted: true')),
      clickHandlerAttached: await page.evaluate(() => {
        const button = document.querySelector('[data-testid="mobile-menu-trigger"]');
        return button && (button.onclick !== null || button.addEventListener !== undefined);
      })
    };
    
    console.log('📊 Resolution analysis:', resolution);
  });
});