const { test, expect } = require('@playwright/test');

test.describe('Console Debug', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('capture console errors and modal state', async ({ page }) => {
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Capture JavaScript errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    console.log('📱 Starting console debug test');
    
    // Check React state and component rendering
    const componentState = await page.evaluate(() => {
      // Look for React Fiber nodes to check component state
      const hamburgerButton = document.querySelector('[data-testid="mobile-menu-trigger"]');
      const modalBackdrop = document.querySelector('[data-testid="modal-backdrop"]');
      const modalContent = document.querySelector('[data-testid="modal-content"]');
      
      return {
        hamburgerExists: !!hamburgerButton,
        hamburgerVisible: hamburgerButton ? window.getComputedStyle(hamburgerButton).display !== 'none' : false,
        modalBackdropExists: !!modalBackdrop,
        modalContentExists: !!modalContent,
        bodyOverflow: document.body.style.overflow,
        reactVersion: window.React?.version || 'not found'
      };
    });
    
    console.log('🔍 Initial component state:', componentState);
    
    // Click the hamburger menu and capture state changes
    const hamburgerButton = page.locator('[data-testid="mobile-menu-trigger"]');
    await hamburgerButton.click();
    
    console.log('🖱️ Clicked hamburger menu');
    await page.waitForTimeout(1000);
    
    // Check state after click
    const stateAfterClick = await page.evaluate(() => {
      const modalBackdrop = document.querySelector('[data-testid="modal-backdrop"]');
      const modalContent = document.querySelector('[data-testid="modal-content"]');
      
      // Check if any elements with isOpen are rendered
      const elementsWithOpen = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('OPEN')
      );
      
      return {
        modalBackdropExists: !!modalBackdrop,
        modalContentExists: !!modalContent,
        bodyOverflow: document.body.style.overflow,
        openElements: elementsWithOpen.map(el => ({
          tag: el.tagName,
          text: el.textContent,
          class: el.className
        })),
        allDataTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'))
      };
    });
    
    console.log('🔍 State after click:', stateAfterClick);
    
    // Take screenshot after click
    await page.screenshot({ 
      path: 'test-results/console-debug-after-click.png',
      fullPage: true 
    });
    
    // Log all console messages and errors
    console.log('📝 Console messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors:');
      errors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Check if the onclick handler is working
    const clickHandlerTest = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="mobile-menu-trigger"]');
      if (button) {
        // Check if onclick handler exists
        const hasOnClick = typeof button.onclick === 'function';
        const hasEventListeners = !!button.getEventListeners?.().click?.length;
        
        return {
          hasOnClick,
          hasEventListeners,
          buttonProps: Object.getOwnPropertyNames(button).filter(prop => prop.includes('react'))
        };
      }
      return { error: 'Button not found' };
    });
    
    console.log('🔧 Click handler analysis:', clickHandlerTest);
  });
});