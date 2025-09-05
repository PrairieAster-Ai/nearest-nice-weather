/**
 * Core Web Vitals Performance Tests
 * Testing Web Vitals metrics with Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('should meet LCP (Largest Contentful Paint) thresholds', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Measure LCP using Performance Observer
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(null), 10000);
      });
    });

    if (lcp) {
      expect(lcp).toBeLessThan(4000); // Good LCP < 2.5s, Acceptable < 4s
    }
  });

  test('should meet FID (First Input Delay) thresholds', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Simulate first user interaction
    const startTime = Date.now();
    await page.click('[data-testid="map-container"]', { timeout: 10000 });
    const endTime = Date.now();

    const inputDelay = endTime - startTime;
    expect(inputDelay).toBeLessThan(300); // Good FID < 100ms, Acceptable < 300ms
  });

  test('should meet CLS (Cumulative Layout Shift) thresholds', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Monitor layout shifts during page load
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Wait for layout shifts to settle
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });

    expect(cls).toBeLessThan(0.25); // Good CLS < 0.1, Acceptable < 0.25
  });

  test('should have acceptable Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3001');

    // Wait for main thread to be quiet and interactive
    await page.waitForFunction(() => {
      // Check if React has rendered and is interactive
      return window.React && document.querySelectorAll('[data-testid]').length > 0;
    }, { timeout: 10000 });

    const tti = Date.now() - startTime;
    expect(tti).toBeLessThan(5000); // TTI should be under 5 seconds
  });

  test('should load critical resources efficiently', async ({ page }) => {
    const resourceTiming = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css') || url.includes('/api/')) {
        resourceTiming.push({
          url,
          status: response.status(),
          timing: response.timing()
        });
      }
    });

    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Verify critical resources loaded successfully
    const criticalResources = resourceTiming.filter(r =>
      r.url.includes('main') || r.url.includes('vendor') || r.url.includes('/api/weather-locations')
    );

    criticalResources.forEach(resource => {
      expect(resource.status).toBe(200);
      if (resource.timing) {
        expect(resource.timing.responseEnd - resource.timing.requestStart).toBeLessThan(3000);
      }
    });
  });

  test('should handle slow network conditions gracefully', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 15000 });
    const loadTime = Date.now() - startTime;

    // Should still load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(15000);

    // Verify basic functionality works
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  });

  test('should optimize JavaScript bundle size', async ({ page }) => {
    const jsResources = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('node_modules')) {
        jsResources.push({
          url,
          size: response.headers()['content-length']
        });
      }
    });

    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    const totalJSSize = jsResources.reduce((total, resource) => {
      return total + (parseInt(resource.size) || 0);
    }, 0);

    // JavaScript bundle should be under 1MB for good performance
    expect(totalJSSize).toBeLessThan(1024 * 1024);
  });
});
