import { test, expect } from '@playwright/test';

/**
 * Portfolio Factory Final Performance Validation
 *
 * Comprehensive test suite focusing on the actual functionality and performance
 * of the Portfolio Factory application deployed at https://portfolio-factory.vercel.app/
 */

test.describe('Portfolio Factory Final Performance Test', () => {
  const BASE_URL = 'https://portfolio-factory.vercel.app';

  test('End-to-end performance validation with complete workflow', async ({ page }) => {
    console.log('\n🚀 PORTFOLIO FACTORY PERFORMANCE VALIDATION');
    console.log('='.repeat(60));
    console.log(`Testing: ${BASE_URL}`);
    console.log(`Started: ${new Date().toISOString()}`);

    // ========================================
    // 1. PAGE LOAD PERFORMANCE
    // ========================================
    console.log('\n📊 1. PAGE LOAD PERFORMANCE');
    const pageLoadStart = Date.now();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const pageLoadTime = Date.now() - pageLoadStart;
    console.log(`   Load time: ${pageLoadTime}ms`);

    // Performance thresholds
    if (pageLoadTime > 10000) {
      console.log(`   ⚠️  WARNING: Exceeds 10s threshold (${pageLoadTime}ms)`);
    } else if (pageLoadTime > 20000) {
      console.log(`   🚫 BLOCKER: Exceeds 20s threshold (${pageLoadTime}ms)`);
    } else {
      console.log(`   ✅ Within performance thresholds`);
    }

    // ========================================
    // 2. APPLICATION STRUCTURE VALIDATION
    // ========================================
    console.log('\n🏗️  2. APPLICATION STRUCTURE');

    const title = await page.title();
    console.log(`   Title: "${title}"`);
    expect(title).toContain('Portfolio Factory');

    const heading = await page.locator('h1, h2').first().textContent();
    console.log(`   Heading: "${heading}"`);

    const subtitle = await page.locator('text=AI-powered job application assessment generator').first().textContent();
    console.log(`   Subtitle: "${subtitle}"`);

    // ========================================
    // 3. USER INTERFACE TESTING
    // ========================================
    console.log('\n🎨 3. USER INTERFACE TESTING');

    // Find the correct textarea (the visible one)
    const textarea = page.locator('textarea[placeholder*="job description"]').first();
    await expect(textarea).toBeVisible();
    console.log('   ✅ Job description textarea is visible');

    const generateButton = page.locator('button:has-text("GENERATE ASSESSMENT")');
    await expect(generateButton).toBeVisible();

    const initialButtonState = await generateButton.isDisabled();
    console.log(`   Initial button state: ${initialButtonState ? 'disabled' : 'enabled'}`);

    // ========================================
    // 4. ASSESSMENT GENERATION WORKFLOW
    // ========================================
    console.log('\n⚙️  4. ASSESSMENT GENERATION WORKFLOW');

    const sampleJobDescription = `
Software Engineer - Frontend Development

Position Overview:
Join our innovative team as a Frontend Software Engineer where you'll build cutting-edge web applications using modern technologies.

Key Responsibilities:
• Develop responsive web applications using React and TypeScript
• Collaborate with UX/UI designers to implement pixel-perfect designs
• Optimize application performance and user experience
• Write clean, maintainable, and well-tested code
• Participate in code reviews and technical discussions

Required Qualifications:
• 3+ years of experience in frontend development
• Proficiency in React, JavaScript/TypeScript, HTML5, CSS3
• Experience with modern build tools (Webpack, Vite, etc.)
• Knowledge of version control (Git)
• Strong problem-solving and communication skills

Preferred Qualifications:
• Experience with state management libraries (Redux, Zustand)
• Familiarity with testing frameworks (Jest, React Testing Library)
• Knowledge of web performance optimization
• Experience with CI/CD pipelines
• Bachelor's degree in Computer Science or related field

Benefits:
• Competitive salary and equity package
• Comprehensive health insurance
• Flexible work arrangements
• Professional development opportunities
• Modern tech stack and tools
    `.trim();

    console.log('   Filling job description...');
    await textarea.fill(sampleJobDescription);

    // Wait for validation and button state change
    await page.waitForTimeout(1000);

    const buttonStateAfterInput = await generateButton.isDisabled();
    console.log(`   Button state after input: ${buttonStateAfterInput ? 'disabled' : 'enabled'}`);

    if (!buttonStateAfterInput) {
      console.log('   🎯 Testing assessment generation...');

      const assessmentStart = Date.now();

      // Click the generate button
      await generateButton.click();
      console.log('   Button clicked, monitoring generation...');

      // Monitor for various possible loading/result states
      let assessmentCompleted = false;
      let assessmentTime = 0;

      try {
        // Wait for either loading indicators or results
        await Promise.race([
          // Wait for loading states to appear and disappear
          page.waitForSelector('text=/generating|loading|processing/i', { timeout: 5000 }).then(async () => {
            console.log('   📡 Loading indicator detected');
            await page.waitForSelector('text=/generating|loading|processing/i', { state: 'detached', timeout: 25000 });
            console.log('   ✅ Loading completed');
          }),

          // Wait for results to appear
          page.waitForSelector('text=/assessment|result|portfolio|analysis|recommendation/i', { timeout: 25000 }).then(() => {
            console.log('   📋 Assessment results detected');
          }),

          // Wait for error messages
          page.waitForSelector('text=/error|failed|problem/i', { timeout: 25000 }).then(() => {
            console.log('   ❌ Error message detected');
          }),

          // Fallback timeout
          page.waitForTimeout(25000)
        ]);

        assessmentTime = Date.now() - assessmentStart;
        assessmentCompleted = true;

      } catch (error) {
        assessmentTime = Date.now() - assessmentStart;
        console.log(`   ⏱️  Assessment process took ${assessmentTime}ms (timeout or error)`);
      }

      if (assessmentCompleted) {
        console.log(`   ⏱️  Assessment generation time: ${assessmentTime}ms`);

        // Performance threshold checks
        if (assessmentTime > 10000 && assessmentTime <= 20000) {
          console.log(`   ⚠️  WARNING: Assessment generation exceeds 10s threshold (${assessmentTime}ms)`);
        } else if (assessmentTime > 20000) {
          console.log(`   🚫 BLOCKER: Assessment generation exceeds 20s threshold (${assessmentTime}ms)`);
        } else {
          console.log(`   ✅ Assessment generation within thresholds`);
        }

        // Check for assessment results
        const resultsElements = await page.locator('*').filter({ hasText: /assessment|portfolio|analysis|recommendation/i }).count();
        console.log(`   📊 Assessment result elements: ${resultsElements}`);

        // Check for errors
        const errorElements = await page.locator('text=/error|failed|problem/i').count();
        if (errorElements > 0) {
          console.log(`   ⚠️  Error indicators found: ${errorElements}`);
        }
      }

    } else {
      console.log('   ❓ Button remained disabled - checking validation requirements');
      const validationMessages = await page.locator('text=/required|invalid|minimum|character/i').count();
      if (validationMessages > 0) {
        console.log(`   📝 Validation messages found: ${validationMessages}`);
      }
    }

    // ========================================
    // 5. MOBILE RESPONSIVENESS
    // ========================================
    console.log('\n📱 5. MOBILE RESPONSIVENESS');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileVisibility = {
      textarea: await textarea.isVisible(),
      button: await generateButton.isVisible(),
      heading: await page.locator('h1, h2').first().isVisible()
    };

    console.log(`   Mobile element visibility:`, mobileVisibility);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;

    if (scrollWidth > viewportWidth + 10) {
      console.log(`   ⚠️  Horizontal overflow: ${scrollWidth}px > ${viewportWidth}px`);
    } else {
      console.log(`   ✅ Mobile layout contained: ${scrollWidth}px <= ${viewportWidth}px`);
    }

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ========================================
    // 6. CONSOLE AND ERROR MONITORING
    // ========================================
    console.log('\n🔍 6. ERROR MONITORING');

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Trigger any remaining interactions
    await page.waitForTimeout(2000);

    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Console warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('   🔴 Console Errors:');
      consoleErrors.slice(0, 3).forEach(error => console.log(`     - ${error.slice(0, 100)}...`));
    }

    // ========================================
    // 7. FINAL PERFORMANCE SUMMARY
    // ========================================
    console.log('\n📈 7. PERFORMANCE SUMMARY');
    console.log('   Metrics:');
    console.log(`     Page Load: ${pageLoadTime}ms`);

    if (typeof assessmentTime !== 'undefined' && assessmentTime > 0) {
      console.log(`     Assessment Generation: ${assessmentTime}ms`);
    }

    console.log('   Thresholds:');
    console.log(`     10s Warning: ${pageLoadTime > 10000 ? '⚠️ ' : '✅'} Page load`);
    console.log(`     20s Blocker: ${pageLoadTime > 20000 ? '🚫' : '✅'} Page load`);

    console.log('\n✅ PORTFOLIO FACTORY VALIDATION COMPLETE');
    console.log('='.repeat(60));

    // Final assertions
    expect(pageLoadTime).toBeLessThan(30000); // Maximum acceptable
    expect(consoleErrors.length).toBeLessThan(10); // Allow some errors
    expect(title).toBeTruthy();
  });
});
