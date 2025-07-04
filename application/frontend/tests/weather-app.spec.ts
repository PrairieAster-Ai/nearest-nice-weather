import { test, expect } from '@playwright/test';

test.describe('Weather App Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage with weather filters', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Nearest Nice Weather/);
    
    // Verify main header exists (may be positioned differently)
    await expect(page.getByText('Nearest Nice Weather')).toBeInViewport();
    
    // Check weather filter components are present - look for filter buttons instead
    await expect(page.getByRole('button', { name: /nice/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sunny/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /calm/i })).toBeVisible();
  });

  test('should display weather results by default', async ({ page }) => {
    // Wait for results to load - check for any weather location first
    await expect(page.locator('text=/.*Lakes.*|.*North Shore.*|.*Rapids.*/')).toBeVisible({ timeout: 15000 });
    
    // Look for weather result cards or content
    const weatherContent = page.locator('text=/Perfect conditions|Great weather|Excellent conditions/');
    await expect(weatherContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should change temperature filter and trigger search', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible({ timeout: 10000 });
    
    // Click on "Hot" temperature filter
    await page.getByRole('button', { name: /hot/i }).click();
    
    // Verify the Hot button is selected (should have different styling)
    await expect(page.getByRole('button', { name: /hot/i })).toHaveClass(/Mui-selected/);
    
    // Should still show results (mock data stays the same)
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible();
  });

  test('should change weather filter and trigger search', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible({ timeout: 10000 });
    
    // Click on "Rainy" weather filter
    await page.getByRole('button', { name: /rainy/i }).click();
    
    // Verify the Rainy button is selected
    await expect(page.getByRole('button', { name: /rainy/i })).toHaveClass(/Mui-selected/);
    
    // Should still show results
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible();
  });

  test('should change wind filter and trigger search', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible({ timeout: 10000 });
    
    // Click on "Windy" wind filter
    await page.getByRole('button', { name: /windy/i }).click();
    
    // Verify the Windy button is selected
    await expect(page.getByRole('button', { name: /windy/i })).toHaveClass(/Mui-selected/);
    
    // Should still show results
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible();
  });

  test('should display layout switcher FAB', async ({ page }) => {
    // Layout switcher should be visible in top-right
    await expect(page.locator('[aria-label="Layout Options"]')).toBeVisible();
  });

  test('should handle mobile menu toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile menu button is present (should be visible on mobile)
    const mobileMenuButton = page.getByTestId('mobile-menu-trigger');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Check if modal opens
      await expect(page.getByTestId('modal-content')).toBeVisible();
      
      // Close the modal
      await page.getByTestId('close-modal').click();
      await expect(page.getByTestId('modal-content')).not.toBeVisible();
    }
  });

  test('should show loading state during search', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible({ timeout: 10000 });
    
    // Click a filter to trigger search with loading
    await page.getByRole('button', { name: /hot/i }).click();
    
    // Should show loading indicator briefly
    await expect(page.getByText('Finding...')).toBeVisible({ timeout: 1000 });
  });

  test('should display weather result cards with required information', async ({ page }) => {
    // Wait for results to load
    await expect(page.getByText('Brainerd Lakes Area')).toBeVisible({ timeout: 10000 });
    
    // Check first result card has all required information
    const firstCard = page.locator('[data-testid="weather-result-1"]');
    await expect(firstCard.getByText('Brainerd Lakes Area')).toBeVisible();
    await expect(firstCard.getByText('92 miles N')).toBeVisible();
    await expect(firstCard.getByText('72°F')).toBeVisible();
    await expect(firstCard.getByText(/Perfect conditions for lake activities/)).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByRole('heading', { name: /nearest nice weather/i })).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /nearest nice weather/i })).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /nearest nice weather/i })).toBeVisible();
  });
});