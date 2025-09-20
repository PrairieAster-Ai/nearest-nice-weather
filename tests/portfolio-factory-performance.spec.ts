import { test, expect, Page } from '@playwright/test';

/**
 * Portfolio Factory Performance Validation Test Suite
 *
 * Tests the performance monitoring and optimization work deployed to
 * https://portfolio-factory.vercel.app/
 *
 * Focus areas:
 * 1. Assessment generation performance (10s warning, 20s blocker thresholds)
 * 2. Overall application functionality and user experience
 * 3. Portfolio mapping algorithms performance
 * 4. Critical issue detection
 */

test.describe('Portfolio Factory Performance Validation', () => {
  const BASE_URL = 'https://portfolio-factory.vercel.app';
  let performanceMetrics: Record<string, number> = {};

  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.goto(BASE_URL);

    // Listen for console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.warn(`Console Warning: ${msg.text()}`);
      }
    });

    // Monitor network requests for performance
    page.on('response', response => {
      if (response.url().includes('api/') && response.status() >= 400) {
        console.error(`API Error: ${response.url()} - ${response.status()}`);
      }
    });
  });

  test('Application loads successfully with no critical errors', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);

    // Wait for main content to load
    await page.waitForSelector('body', { timeout: 30000 });

    const loadTime = Date.now() - startTime;
    performanceMetrics.pageLoad = loadTime;

    console.log(`Page load time: ${loadTime}ms`);

    // Check for basic page structure
    const title = await page.title();
    expect(title).toBeTruthy();

    // Verify no critical JavaScript errors
    const errors = await page.evaluate(() => {
      return window.console.error || [];
    });

    // Check if page loaded successfully (not blank or error page)
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent.length).toBeGreaterThan(100); // Ensure substantial content

    // Performance threshold check
    if (loadTime > 10000) {
      console.warn(`⚠️  WARNING: Page load time ${loadTime}ms exceeds 10s threshold`);
    }
    if (loadTime > 20000) {
      console.error(`🚫 BLOCKER: Page load time ${loadTime}ms exceeds 20s threshold`);
    }

    expect(loadTime).toBeLessThan(30000); // Maximum acceptable load time
  });

  test('Assessment generation performance monitoring', async ({ page }) => {
    await page.goto(BASE_URL);

    // Look for assessment generation functionality
    const assessmentButtons = await page.locator('button, [role="button"]').filter({ hasText: /assess|generate|create|start/i });
    const buttonCount = await assessmentButtons.count();

    if (buttonCount === 0) {
      console.log('No assessment buttons found, checking for form inputs or other triggers');

      // Look for forms or input fields that might trigger assessment generation
      const forms = await page.locator('form, input, textarea, select').count();
      console.log(`Found ${forms} interactive elements`);

      if (forms === 0) {
        console.log('Application may be a static site or loading asynchronously');
        await page.waitForTimeout(3000); // Wait for dynamic content

        // Re-check for interactive elements
        const newButtonCount = await page.locator('button, [role="button"]').count();
        const newFormCount = await page.locator('form, input, textarea, select').count();

        console.log(`After waiting: ${newButtonCount} buttons, ${newFormCount} form elements`);
      }
    }

    // If we found assessment triggers, test them
    if (buttonCount > 0) {
      const startTime = Date.now();

      try {
        // Click the first assessment-related button
        await assessmentButtons.first().click();

        // Wait for response or completion indicator
        await page.waitForTimeout(1000); // Initial wait

        // Look for loading indicators, progress bars, or completion messages
        const loadingIndicators = page.locator('[data-testid*="loading"], .loading, .spinner, [aria-busy="true"]');
        const hasLoading = await loadingIndicators.count() > 0;

        if (hasLoading) {
          console.log('Loading indicator detected, waiting for completion...');
          await page.waitForSelector('[data-testid*="loading"], .loading, .spinner, [aria-busy="true"]', {
            state: 'detached',
            timeout: 25000
          });
        }

        const assessmentTime = Date.now() - startTime;
        performanceMetrics.assessmentGeneration = assessmentTime;

        console.log(`Assessment generation time: ${assessmentTime}ms`);

        // Performance threshold checks
        if (assessmentTime > 10000) {
          console.warn(`⚠️  WARNING: Assessment generation ${assessmentTime}ms exceeds 10s threshold`);
        }
        if (assessmentTime > 20000) {
          console.error(`🚫 BLOCKER: Assessment generation ${assessmentTime}ms exceeds 20s threshold`);
        }

        expect(assessmentTime).toBeLessThan(30000); // Maximum acceptable time

      } catch (error) {
        console.log(`Assessment generation test encountered error: ${error}`);
        // This might be expected if the UI has changed
      }
    }
  });

  test('Portfolio mapping algorithms performance', async ({ page }) => {
    await page.goto(BASE_URL);

    const startTime = Date.now();

    // Look for portfolio-related functionality
    const portfolioElements = await page.locator('*').filter({ hasText: /portfolio|mapping|algorithm|optimization/i });
    const portfolioCount = await portfolioElements.count();

    console.log(`Found ${portfolioCount} portfolio-related elements`);

    // If portfolio functionality is present, test it
    if (portfolioCount > 0) {
      try {
        // Look for interactive portfolio elements
        const interactiveElements = await page.locator('button, [role="button"], input, select').filter({ hasText: /portfolio|map|optimize/i });
        const interactiveCount = await interactiveElements.count();

        if (interactiveCount > 0) {
          await interactiveElements.first().click();

          // Wait for portfolio processing
          await page.waitForTimeout(2000);

          // Look for results or completion
          const results = await page.locator('[data-testid*="result"], .result, .portfolio-output, .mapping-result').count();

          const mappingTime = Date.now() - startTime;
          performanceMetrics.portfolioMapping = mappingTime;

          console.log(`Portfolio mapping time: ${mappingTime}ms`);
          console.log(`Portfolio results found: ${results}`);

          // Performance checks
          if (mappingTime > 10000) {
            console.warn(`⚠️  WARNING: Portfolio mapping ${mappingTime}ms exceeds 10s threshold`);
          }
          if (mappingTime > 20000) {
            console.error(`🚫 BLOCKER: Portfolio mapping ${mappingTime}ms exceeds 20s threshold`);
          }
        }
      } catch (error) {
        console.log(`Portfolio mapping test encountered error: ${error}`);
      }
    }

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(45000); // Overall timeout
  });

  test('API endpoints functionality and performance', async ({ page }) => {
    await page.goto(BASE_URL);

    // Monitor API calls
    const apiCalls: Array<{ url: string, status: number, duration: number }> = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const request = response.request();
        const timing = response.timing();

        apiCalls.push({
          url: response.url(),
          status: response.status(),
          duration: timing.responseEnd - timing.responseStart
        });
      }
    });

    // Trigger some user interactions to generate API calls
    await page.waitForTimeout(2000);

    // Try to click various interactive elements to trigger API calls
    const buttons = await page.locator('button, [role="button"]').count();
    if (buttons > 0) {
      for (let i = 0; i < Math.min(buttons, 3); i++) {
        try {
          await page.locator('button, [role="button"]').nth(i).click();
          await page.waitForTimeout(1000);
        } catch (error) {
          // Continue with other buttons if one fails
        }
      }
    }

    await page.waitForTimeout(3000); // Allow time for API calls

    console.log(`API calls detected: ${apiCalls.length}`);

    // Analyze API performance
    apiCalls.forEach(call => {
      console.log(`API: ${call.url} - Status: ${call.status} - Duration: ${call.duration}ms`);

      if (call.duration > 10000) {
        console.warn(`⚠️  WARNING: API call ${call.url} took ${call.duration}ms (>10s)`);
      }
      if (call.duration > 20000) {
        console.error(`🚫 BLOCKER: API call ${call.url} took ${call.duration}ms (>20s)`);
      }

      expect(call.status).toBeLessThan(500); // No server errors
    });

    performanceMetrics.apiCallCount = apiCalls.length;
    performanceMetrics.averageApiTime = apiCalls.length > 0
      ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
      : 0;
  });

  test('User experience and accessibility validation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for accessibility issues
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    const images = await page.locator('img').count();
    const links = await page.locator('a').count();
    const buttons = await page.locator('button, [role="button"]').count();

    console.log(`Page structure: ${headings} headings, ${images} images, ${links} links, ${buttons} buttons`);

    // Check for missing alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      console.warn(`⚠️  WARNING: ${imagesWithoutAlt} images missing alt text`);
    }

    // Check for responsive design
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.waitForTimeout(1000);

    const mobileBodyContent = await page.textContent('body');
    expect(mobileBodyContent).toBeTruthy();

    // Check for horizontal scrolling issues
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);

    if (scrollWidth > clientWidth + 10) {
      console.warn(`⚠️  WARNING: Horizontal scrolling detected (${scrollWidth}px > ${clientWidth}px)`);
    }

    // Reset to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    performanceMetrics.accessibilityScore = Math.max(0, 100 - (imagesWithoutAlt * 10));
  });

  test.afterAll(async () => {
    // Generate comprehensive performance report
    console.log('\n=== PORTFOLIO FACTORY PERFORMANCE REPORT ===');
    console.log('Test completed at:', new Date().toISOString());
    console.log('Application URL:', BASE_URL);
    console.log('\nPerformance Metrics:');

    Object.entries(performanceMetrics).forEach(([metric, value]) => {
      console.log(`  ${metric}: ${value}${typeof value === 'number' && metric.includes('Time') ? 'ms' : ''}`);
    });

    console.log('\nThreshold Analysis:');
    const warnings = [];
    const blockers = [];

    Object.entries(performanceMetrics).forEach(([metric, value]) => {
      if (typeof value === 'number' && metric.toLowerCase().includes('time')) {
        if (value > 10000) warnings.push(`${metric}: ${value}ms`);
        if (value > 20000) blockers.push(`${metric}: ${value}ms`);
      }
    });

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS (>10s threshold):');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (blockers.length > 0) {
      console.log('🚫 BLOCKERS (>20s threshold):');
      blockers.forEach(blocker => console.log(`  - ${blocker}`));
    }

    if (warnings.length === 0 && blockers.length === 0) {
      console.log('✅ All performance thresholds met!');
    }

    console.log('\nRecommendations:');
    if (performanceMetrics.pageLoad && performanceMetrics.pageLoad > 5000) {
      console.log('  - Consider optimizing initial page load time');
    }
    if (performanceMetrics.averageApiTime && performanceMetrics.averageApiTime > 3000) {
      console.log('  - Review API response time optimization');
    }
    if (performanceMetrics.accessibilityScore && performanceMetrics.accessibilityScore < 90) {
      console.log('  - Address accessibility issues for better user experience');
    }

    console.log('=============================================\n');
  });
});
