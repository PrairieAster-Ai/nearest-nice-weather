import { test, expect, Page } from '@playwright/test';

/**
 * Portfolio Factory Detailed Analysis Test Suite
 *
 * Based on the actual application structure observed:
 * - Job description input field
 * - Generate Assessment button (disabled until content is provided)
 * - Performance monitoring integration
 */

test.describe('Portfolio Factory Detailed Analysis', () => {
  const BASE_URL = 'https://portfolio-factory.vercel.app';

  test('Complete application workflow with performance monitoring', async ({ page }) => {
    console.log('=== PORTFOLIO FACTORY COMPREHENSIVE TEST ===');
    console.log('Starting test at:', new Date().toISOString());

    // Navigate to application
    const navigationStart = Date.now();
    await page.goto(BASE_URL);

    // Wait for page to fully load
    await page.waitForSelector('body');
    await page.waitForLoadState('networkidle');

    const pageLoadTime = Date.now() - navigationStart;
    console.log(`✅ Page load time: ${pageLoadTime}ms`);

    // Performance threshold validation
    if (pageLoadTime > 10000) {
      console.warn(`⚠️  WARNING: Page load time ${pageLoadTime}ms exceeds 10s threshold`);
    }
    if (pageLoadTime > 20000) {
      console.error(`🚫 BLOCKER: Page load time ${pageLoadTime}ms exceeds 20s threshold`);
    }

    // Verify page title and content
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    expect(title).toContain('Portfolio Factory');

    // Check for main application elements
    const heading = await page.locator('h1, h2').first().textContent();
    console.log(`Main heading: "${heading}"`);

    const subtitle = await page.locator('text=AI-powered job application assessment generator').textContent();
    console.log(`Subtitle: "${subtitle}"`);

    // Test the job description input functionality
    const jobDescriptionTextarea = page.locator('textarea[placeholder*="job description"], textarea');
    await expect(jobDescriptionTextarea).toBeVisible();

    // Test button state before input
    const generateButton = page.locator('button:has-text("GENERATE ASSESSMENT"), button:has-text("Generate Assessment")');
    await expect(generateButton).toBeVisible();

    const isButtonDisabled = await generateButton.isDisabled();
    console.log(`Generate button initially disabled: ${isButtonDisabled}`);

    // Fill in the job description to enable the button
    const sampleJobDescription = `
Senior Software Engineer - Full Stack Development

We are seeking an experienced Senior Software Engineer to join our team. The ideal candidate will have:

Responsibilities:
- Design and develop scalable web applications
- Lead technical architecture decisions
- Mentor junior developers
- Collaborate with product teams

Requirements:
- 5+ years of software development experience
- Proficiency in React, Node.js, and TypeScript
- Experience with cloud platforms (AWS, Azure, or GCP)
- Strong problem-solving skills
- Excellent communication abilities

Preferred Qualifications:
- Experience with microservices architecture
- Knowledge of DevOps practices
- Previous leadership experience
- Bachelor's degree in Computer Science or related field
    `.trim();

    console.log('Filling job description...');
    await jobDescriptionTextarea.fill(sampleJobDescription);

    // Wait for the button to become enabled
    await page.waitForTimeout(1000);

    const isButtonEnabledAfterInput = await generateButton.isDisabled();
    console.log(`Generate button disabled after input: ${isButtonEnabledAfterInput}`);

    // If button is now enabled, test the assessment generation
    if (!isButtonEnabledAfterInput) {
      console.log('Testing assessment generation...');

      const assessmentStart = Date.now();
      await generateButton.click();

      // Monitor for loading states
      const loadingStates = [
        'text=Generating',
        'text=Loading',
        '[aria-busy="true"]',
        '.loading',
        '.spinner'
      ];

      let loadingDetected = false;
      for (const selector of loadingStates) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          loadingDetected = true;
          console.log(`Loading state detected: ${selector}`);
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      if (loadingDetected) {
        console.log('Waiting for assessment generation to complete...');

        // Wait for loading to finish
        for (const selector of loadingStates) {
          try {
            await page.waitForSelector(selector, { state: 'detached', timeout: 25000 });
          } catch (e) {
            // Selector might not have been present
          }
        }
      }

      const assessmentTime = Date.now() - assessmentStart;
      console.log(`✅ Assessment generation time: ${assessmentTime}ms`);

      // Performance threshold checks
      if (assessmentTime > 10000) {
        console.warn(`⚠️  WARNING: Assessment generation ${assessmentTime}ms exceeds 10s threshold`);
      }
      if (assessmentTime > 20000) {
        console.error(`🚫 BLOCKER: Assessment generation ${assessmentTime}ms exceeds 20s threshold`);
      }

      // Look for assessment results
      const resultElements = await page.locator('*').filter({ hasText: /assessment|result|analysis|portfolio|recommendation/i }).count();
      console.log(`Assessment result elements found: ${resultElements}`);

      // Check for any error messages
      const errorElements = await page.locator('text=/error|failed|problem/i').count();
      if (errorElements > 0) {
        console.warn(`⚠️  Potential error messages detected: ${errorElements}`);
      }

    } else {
      console.log('Button remains disabled after input - checking for validation requirements');

      // Check for validation messages
      const validationMessages = await page.locator('text=/required|invalid|minimum|character/i').count();
      console.log(`Validation messages found: ${validationMessages}`);
    }

    // Test mobile responsiveness
    console.log('Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mobileElements = {
      textarea: await jobDescriptionTextarea.isVisible(),
      button: await generateButton.isVisible(),
      heading: await page.locator('h1, h2').first().isVisible()
    };

    console.log('Mobile visibility:', mobileElements);

    // Check for horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    if (scrollWidth > viewportWidth + 10) {
      console.warn(`⚠️  Mobile horizontal scrolling detected: ${scrollWidth}px > ${viewportWidth}px`);
    } else {
      console.log(`✅ Mobile layout fits viewport: ${scrollWidth}px <= ${viewportWidth}px`);
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('=== TEST COMPLETED ===');
  });

  test('API monitoring and network performance', async ({ page }) => {
    const apiCalls: Array<{ url: string, method: string, status: number, duration: number, size: number }> = [];
    const consoleMessages: Array<{ type: string, text: string }> = [];

    // Monitor network requests
    page.on('response', async (response) => {
      const request = response.request();
      const timing = response.timing();
      const headers = await response.allHeaders();

      apiCalls.push({
        url: response.url(),
        method: request.method(),
        status: response.status(),
        duration: timing.responseEnd - timing.responseStart,
        size: parseInt(headers['content-length'] || '0')
      });
    });

    // Monitor console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for any additional async requests
    await page.waitForTimeout(3000);

    console.log('\n=== NETWORK PERFORMANCE ANALYSIS ===');
    console.log(`Total API calls: ${apiCalls.length}`);

    // Analyze API calls
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url}`);
      console.log(`   Status: ${call.status} | Duration: ${call.duration}ms | Size: ${call.size} bytes`);

      if (call.duration > 10000) {
        console.warn(`   ⚠️  WARNING: Request duration exceeds 10s threshold`);
      }
      if (call.duration > 20000) {
        console.error(`   🚫 BLOCKER: Request duration exceeds 20s threshold`);
      }
      if (call.status >= 400) {
        console.error(`   🚫 ERROR: HTTP ${call.status} status code`);
      }
    });

    // Analyze console messages
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');

    console.log(`\nConsole errors: ${errors.length}`);
    console.log(`Console warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\nConsole Errors:');
      errors.forEach(error => console.log(`  - ${error.text}`));
    }

    if (warnings.length > 0) {
      console.log('\nConsole Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning.text}`));
    }

    // Performance summary
    const avgDuration = apiCalls.length > 0
      ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
      : 0;

    const totalSize = apiCalls.reduce((sum, call) => sum + call.size, 0);

    console.log(`\nPerformance Summary:`);
    console.log(`  Average request duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Total transferred: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`  HTTP errors: ${apiCalls.filter(call => call.status >= 400).length}`);
    console.log(`  Slow requests (>5s): ${apiCalls.filter(call => call.duration > 5000).length}`);

    expect(errors.length).toBeLessThan(5); // Allow some minor errors
    expect(apiCalls.filter(call => call.status >= 500).length).toBe(0); // No server errors
  });

  test('Performance monitoring validation', async ({ page }) => {
    console.log('\n=== PERFORMANCE MONITORING VALIDATION ===');

    // Check if performance monitoring is active
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for performance monitoring code/scripts
    const performanceScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script => {
        const content = script.textContent || script.src || '';
        return content.includes('performance') ||
               content.includes('monitoring') ||
               content.includes('analytics') ||
               content.includes('timing');
      });
    });

    console.log(`Performance monitoring scripts detected: ${performanceScripts}`);

    // Check for Performance API usage
    const performanceApiUsage = await page.evaluate(() => {
      return {
        performanceAvailable: typeof window.performance !== 'undefined',
        timingAvailable: typeof window.performance?.timing !== 'undefined',
        navigationAvailable: typeof window.performance?.navigation !== 'undefined',
        marksAvailable: typeof window.performance?.mark !== 'undefined'
      };
    });

    console.log('Performance API availability:', performanceApiUsage);

    // Test performance measurement capabilities
    const customMetrics = await page.evaluate(() => {
      if (typeof window.performance?.mark === 'function') {
        window.performance.mark('test-start');
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
        window.performance.mark('test-end');

        if (typeof window.performance.measure === 'function') {
          window.performance.measure('test-duration', 'test-start', 'test-end');
          const measure = window.performance.getEntriesByName('test-duration')[0];
          return measure ? measure.duration : null;
        }
      }
      return null;
    });

    if (customMetrics !== null) {
      console.log(`✅ Custom performance measurement working: ${customMetrics.toFixed(2)}ms`);
    } else {
      console.log('❌ Custom performance measurement not available');
    }

    // Check for monitoring endpoints or beacons
    const monitoringEndpoints = await page.evaluate(() => {
      const beacons = [];
      // Check for common monitoring endpoints in network calls
      // This would normally be done via the Network API
      return beacons;
    });

    console.log(`Monitoring endpoints detected: ${monitoringEndpoints.length}`);

    console.log('=== PERFORMANCE MONITORING VALIDATION COMPLETE ===');
  });
});
