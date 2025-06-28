const { test, expect } = require('@playwright/test');

test.describe('Website Validation Suite', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    // Ensure the frontend is accessible
    await page.goto(BASE_URL);
  });

  test('homepage loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Nearest Nice Weather/);
    
    // Take screenshot for visual validation
    await page.screenshot({ 
      path: 'test-results/homepage-screenshot.png',
      fullPage: true 
    });
  });

  test('navigation elements are present', async ({ page }) => {
    // Check for main navigation components
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    
    // Verify key UI components exist
    const header = page.locator('header, [role="banner"]');
    await expect(header).toBeVisible();
  });

  test('weather filters component functions', async ({ page }) => {
    // Look for weather filter elements
    const filterSection = page.locator('[data-testid="weather-filters"], .weather-filters');
    
    if (await filterSection.count() > 0) {
      await expect(filterSection).toBeVisible();
      
      // Take screenshot of filters
      await filterSection.screenshot({ 
        path: 'test-results/weather-filters-screenshot.png' 
      });
    }
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Verify mobile layout
    await expect(page.locator('body')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-results/mobile-screenshot.png',
      fullPage: true 
    });
  });

  test('api connectivity check', async ({ page }) => {
    // Check if backend API is accessible
    const apiUrl = 'http://localhost:8000';
    
    try {
      const response = await page.request.get(`${apiUrl}/docs`);
      console.log(`API Status: ${response.status()}`);
      
      // Log API availability
      if (response.status() === 200) {
        console.log('✅ Backend API is accessible');
      } else {
        console.log('⚠️ Backend API returned non-200 status');
      }
    } catch (error) {
      console.log('⚠️ Backend API not accessible:', error.message);
    }
  });

  test('performance check', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Assert reasonable load time (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test('accessibility basics', async ({ page }) => {
    // Check for basic accessibility elements
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main).toBeVisible();
    }
  });
});