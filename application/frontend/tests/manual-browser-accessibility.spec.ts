import { test, expect } from '@playwright/test';

test.describe('Manual Browser Accessibility - Hard Constraint', () => {
  
  test('CRITICAL: App must be manually browsable via HTTP', async ({ page }) => {
    // This test enforces that the app can be manually accessed via browser
    // If this fails, the app is not suitable for user access
    
    // Test direct HTTP accessibility (simulating manual browser access)
    const response = await page.request.get('/');
    
    // HARD CONSTRAINT: Must return 200 OK
    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    
    // HARD CONSTRAINT: Must contain valid HTML
    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    
    // HARD CONSTRAINT: Must have the correct title
    expect(html).toContain('Nearest Nice Weather - Find Your Perfect Weather');
    
    // HARD CONSTRAINT: Must contain essential app components
    expect(html).toContain('Nearest Nice Weather'); // App title
    expect(html).toContain('PrairieAster.Ai'); // Branding
    
    // Log success for verification
    console.log('✅ Manual browser accessibility verified');
    console.log(`✅ HTTP Status: ${response.status()}`);
    console.log(`✅ Content-Type: ${response.headers()['content-type']}`);
  });

  test('CRITICAL: Page loads completely in browser context', async ({ page }) => {
    // Navigate to the page (simulating manual browser navigation)
    await page.goto('/');
    
    // HARD CONSTRAINT: Page must load without errors
    await expect(page).toHaveTitle(/Nearest Nice Weather/);
    
    // HARD CONSTRAINT: Essential elements must be visible
    await expect(page.getByText('Nearest Nice Weather')).toBeInViewport();
    
    // HARD CONSTRAINT: Interactive elements must be functional
    const buttons = page.locator('[role="button"]');
    await expect(buttons.first()).toBeVisible();
    
    // Verify the page is fully interactive (can click elements)
    await buttons.first().click();
    // Should not crash after interaction
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Full browser interaction verified');
  });

  test('CRITICAL: Server responds to concurrent manual requests', async ({ request }) => {
    // Simulate multiple manual browser requests (like user refreshing)
    const requests = Array.from({ length: 5 }, (_, i) => 
      request.get('/')
    );
    
    const responses = await Promise.all(requests);
    
    // HARD CONSTRAINT: All requests must succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();
    }
    
    console.log('✅ Concurrent manual access verified');
  });

  test('CRITICAL: App serves static assets for manual browsing', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // HARD CONSTRAINT: CSS must load for proper visual display
    const stylesheets = page.locator('link[rel="stylesheet"]');
    await expect(stylesheets.first()).toBeAttached();
    
    // HARD CONSTRAINT: JavaScript must load for interactivity  
    const scripts = page.locator('script[src]');
    await expect(scripts.first()).toBeAttached();
    
    // Verify no critical loading errors
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors (favicon, etc.)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
    
    console.log('✅ Static asset delivery verified');
  });
});