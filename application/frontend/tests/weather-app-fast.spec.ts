import { test, expect } from '@playwright/test';

// Fast test tier - optimized for speed
test.describe.configure({ mode: 'parallel' });

test.describe('Weather App - Fast Critical Tests', () => {
  
  test('FAST: App loads and responds', async ({ page }) => {
    await page.goto('/');
    
    // Quick title check
    await expect(page).toHaveTitle(/Nearest Nice Weather/);
    
    // Basic functionality check - should have filter buttons
    const buttons = page.locator('[role="button"]');
    await expect(buttons.first()).toBeVisible();
  });

  test('FAST: Manual browser accessibility', async ({ page }) => {
    const response = await page.request.get('/');
    
    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    
    const html = await response.text();
    expect(html).toContain('Nearest Nice Weather');
  });

  test('FAST: Filter interaction works', async ({ page }) => {
    await page.goto('/');
    
    // Quick interaction test
    const firstButton = page.locator('[role="button"]').first();
    await expect(firstButton).toBeVisible();
    await firstButton.click();
    
    // Verify no crash
    await expect(page.locator('body')).toBeVisible();
  });
});