import { test, expect } from '@playwright/test';

test.describe('Weather App - Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Nearest Nice Weather/);
    
    // Check that the page loads without major errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display weather filter buttons', async ({ page }) => {
    // Look for toggle buttons - they should be present
    const toggleButtons = page.locator('[role="button"]');
    await expect(toggleButtons.first()).toBeVisible({ timeout: 10000 });
    
    // Should have multiple filter buttons 
    const buttonCount = await toggleButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should have clean, optimized layout', async ({ page }) => {
    // Verify the layout is now optimized without extra UI elements
    await expect(page.locator('body')).toBeVisible();
    
    // Should not have the layout switcher FAB anymore
    await expect(page.locator('[aria-label="Layout Options"]')).not.toBeVisible();
  });

  test('should handle mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should interact with filter buttons', async ({ page }) => {
    // Wait for buttons to be ready
    await page.waitForLoadState('networkidle');
    
    // Find and click a filter button
    const filterButton = page.locator('[role="button"]').first();
    await expect(filterButton).toBeVisible();
    await filterButton.click();
    
    // Should not crash after clicking
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive across different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // Mobile small
      { width: 375, height: 667 }, // Mobile medium  
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect(page.locator('body')).toBeVisible();
      // Brief pause to let layout settle
      await page.waitForTimeout(500);
    }
  });

  test('should load without console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = consoleMessages.filter(msg => 
      !msg.includes('Favicon') && 
      !msg.includes('manifest') &&
      !msg.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});