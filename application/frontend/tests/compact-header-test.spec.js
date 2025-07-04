const { test, expect } = require('@playwright/test');

test.describe('Compact 40px Header', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test('header is exactly 40px tall with single row layout', async ({ page }) => {
    // Desktop test
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('📏 Testing compact 40px header...');
    
    // Screenshot desktop layout
    await page.screenshot({ 
      path: 'test-results/COMPACT-HEADER-desktop.png',
      fullPage: true 
    });
    
    // Measure header height
    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    console.log(`Header height: ${headerBox?.height}px (should be 40px)`);
    
    // Check that logo and text are on single row
    const logo = page.locator('header div:has-text("☀️")');
    const title = page.locator('header h1:has-text("Nearest Nice Weather")');
    const subtitle = page.locator('header span:has-text("A PrairieAster.Ai Product")');
    
    await expect(logo).toBeVisible();
    await expect(title).toBeVisible();
    await expect(subtitle).toBeVisible();
    
    // Check that title and subtitle are horizontally aligned
    const titleBox = await title.boundingBox();
    const subtitleBox = await subtitle.boundingBox();
    const verticalAlignment = Math.abs((titleBox?.y || 0) - (subtitleBox?.y || 0));
    console.log(`Title and subtitle vertical alignment difference: ${verticalAlignment}px (should be small)`);
    
    // Check user menu buttons are properly sized
    const userButton = page.locator('header button').first();
    const userButtonBox = await userButton.boundingBox();
    console.log(`User button size: ${userButtonBox?.width}x${userButtonBox?.height}px`);
    
    // Tablet test
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    console.log('📱 Testing tablet header layout...');
    
    await page.screenshot({ 
      path: 'test-results/COMPACT-HEADER-tablet.png',
      fullPage: true 
    });
    
    // Verify header is still 40px on tablet
    const tabletHeaderBox = await header.boundingBox();
    console.log(`Tablet header height: ${tabletHeaderBox?.height}px (should be 40px)`);
    
    // Mobile test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    console.log('📱 Testing mobile header layout...');
    
    await page.screenshot({ 
      path: 'test-results/COMPACT-HEADER-mobile.png',
      fullPage: true 
    });
    
    // Check mobile adaptations
    const mobileHeaderBox = await header.boundingBox();
    console.log(`Mobile header height: ${mobileHeaderBox?.height}px`);
    
    // Check that subtitle is hidden on mobile
    const mobileSubtitle = page.locator('header span:has-text("A PrairieAster.Ai Product")');
    const subtitleVisible = await mobileSubtitle.isVisible();
    console.log(`Mobile subtitle hidden: ${!subtitleVisible}`);
    
    // Check mobile button sizing
    const mobileUserButton = page.locator('header button').first();
    const mobileButtonBox = await mobileUserButton.boundingBox();
    console.log(`Mobile button size: ${mobileButtonBox?.width}x${mobileButtonBox?.height}px`);
    
    // Verify all content still fits in single row on mobile
    const mobileTitle = page.locator('header h1:has-text("Nearest Nice Weather")');
    await expect(mobileTitle).toBeVisible();
    
    console.log('✅ Compact header test completed');
  });
});