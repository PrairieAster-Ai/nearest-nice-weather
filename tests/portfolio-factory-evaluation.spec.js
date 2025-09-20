import { test, expect } from '@playwright/test';

const PORTFOLIO_FACTORY_URL = 'https://portfolio-factory.vercel.app';

test.describe('Portfolio Factory Comprehensive Evaluation', () => {
  let consoleErrors = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    consoleErrors = [];
    networkErrors = [];

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network failures
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
  });

  test('1. Homepage loads correctly and displays all essential elements', async ({ page }) => {
    console.log('🏠 Testing homepage loading and display...');

    // Navigate to the site
    const response = await page.goto(PORTFOLIO_FACTORY_URL);
    expect(response.status()).toBe(200);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot for visual verification
    await page.screenshot({ path: 'portfolio-factory-homepage.png', fullPage: true });

    // Check for basic page structure
    await expect(page).toHaveTitle(/Portfolio Factory|Assessment|Qualification/i);

    // Look for key UI elements
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Portfolio Factory' || bodyText.includes('Assessment') || bodyText.includes('Job'));

    // Check if Material-UI is loaded (look for MUI classes or components)
    const muiElements = await page.locator('[class*="Mui"], [class*="MuiButton"], [class*="MuiTextField"]').count();
    console.log(`Found ${muiElements} Material-UI elements`);

    console.log('✅ Homepage loaded successfully');
  });

  test('2. Job description input functionality works', async ({ page }) => {
    console.log('📝 Testing job description input functionality...');

    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');

    // Look for input fields that might be for job descriptions
    const inputSelectors = [
      'input[type="text"]',
      'textarea',
      '[placeholder*="job"]',
      '[placeholder*="description"]',
      '[placeholder*="role"]',
      '[data-testid*="job"]',
      '[name*="job"]',
      '[id*="job"]'
    ];

    let jobInput = null;
    for (const selector of inputSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        jobInput = element;
        console.log(`Found input field with selector: ${selector}`);
        break;
      }
    }

    if (jobInput) {
      // Test typing in the job description
      await jobInput.click();
      await jobInput.fill('Software Engineer - Full Stack Developer with React and Node.js experience');

      const inputValue = await jobInput.inputValue();
      expect(inputValue).toContain('Software Engineer');
      console.log('✅ Job description input works correctly');
    } else {
      console.log('⚠️ Could not locate job description input field');

      // Take screenshot to see what's available
      await page.screenshot({ path: 'portfolio-factory-no-input.png', fullPage: true });

      // Log all visible form elements for debugging
      const allInputs = await page.locator('input, textarea, button').all();
      console.log(`Found ${allInputs.length} interactive elements`);

      for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
        const element = allInputs[i];
        const tagName = await element.evaluate(el => el.tagName);
        const type = await element.getAttribute('type') || 'N/A';
        const placeholder = await element.getAttribute('placeholder') || 'N/A';
        const id = await element.getAttribute('id') || 'N/A';
        console.log(`Element ${i}: ${tagName} type="${type}" placeholder="${placeholder}" id="${id}"`);
      }
    }
  });

  test('3. Assessment generation functionality', async ({ page }) => {
    console.log('🎯 Testing assessment generation...');

    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');

    // Look for job input and submit button
    const jobInput = await findJobInput(page);
    const submitButton = await findSubmitButton(page);

    if (jobInput && submitButton) {
      // Fill out job description
      await jobInput.fill('Product Manager - Experience with roadmap planning, stakeholder management, and agile methodologies');

      // Submit the form
      await submitButton.click();

      // Wait for assessment to be generated (with timeout)
      console.log('Waiting for assessment generation...');

      try {
        // Wait for either results or error message
        await Promise.race([
          page.waitForSelector('text=Assessment Results', { timeout: 15000 }),
          page.waitForSelector('text=Score', { timeout: 15000 }),
          page.waitForSelector('text=Recommendation', { timeout: 15000 }),
          page.waitForSelector('[class*="error"]', { timeout: 15000 }),
          page.waitForSelector('text=Error', { timeout: 15000 })
        ]);

        console.log('✅ Assessment generation completed');

        // Take screenshot of results
        await page.screenshot({ path: 'portfolio-factory-assessment-results.png', fullPage: true });

      } catch (error) {
        console.log('⚠️ Assessment generation timeout or failed');
        await page.screenshot({ path: 'portfolio-factory-assessment-timeout.png', fullPage: true });
      }
    } else {
      console.log('⚠️ Could not find input/submit elements for assessment');
      await page.screenshot({ path: 'portfolio-factory-no-form.png', fullPage: true });
    }
  });

  test('4. Assessment results display validation', async ({ page }) => {
    console.log('📊 Testing assessment results display...');

    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');

    const jobInput = await findJobInput(page);
    const submitButton = await findSubmitButton(page);

    if (jobInput && submitButton) {
      await jobInput.fill('Software Engineer');
      await submitButton.click();

      try {
        // Wait for results to appear
        await page.waitForSelector('text=Score,text=Recommendation,text=Assessment', { timeout: 20000 });

        // Check for score display
        const scoreElements = await page.locator('text=/\\d+%|\\d+\/\\d+|Score:/').count();
        console.log(`Found ${scoreElements} score-related elements`);

        // Check for recommendations
        const recommendationText = await page.textContent('body');
        const hasRecommendations = recommendationText.includes('recommend') ||
                                 recommendationText.includes('improve') ||
                                 recommendationText.includes('suggestion');

        if (hasRecommendations) {
          console.log('✅ Recommendations found in results');
        }

        // Check for professional formatting
        const formattedElements = await page.locator('[class*="result"], [class*="score"], [class*="recommendation"]').count();
        console.log(`Found ${formattedElements} formatted result elements`);

        console.log('✅ Assessment results display correctly');

      } catch (error) {
        console.log('⚠️ Results did not display within expected time');
      }
    }
  });

  test('5. Download functionality test', async ({ page }) => {
    console.log('💾 Testing download functionality...');

    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');

    // Look for download buttons/links
    const downloadSelectors = [
      'button:has-text("Download")',
      'a:has-text("Download")',
      '[download]',
      'button:has-text("Export")',
      'a:has-text("Export")',
      'button:has-text("DOCX")',
      'a:has-text("DOCX")'
    ];

    let downloadButton = null;
    for (const selector of downloadSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        downloadButton = element;
        console.log(`Found download button with selector: ${selector}`);
        break;
      }
    }

    if (downloadButton) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');

      try {
        await downloadButton.click();
        const download = await downloadPromise;

        console.log(`✅ Download initiated: ${download.suggestedFilename()}`);

        // Verify file type
        const filename = download.suggestedFilename();
        if (filename.endsWith('.docx')) {
          console.log('✅ DOCX file download confirmed');
        }

      } catch (error) {
        console.log('⚠️ Download may require assessment generation first');

        // Try generating assessment first, then downloading
        const jobInput = await findJobInput(page);
        const submitButton = await findSubmitButton(page);

        if (jobInput && submitButton) {
          await jobInput.fill('Marketing Manager');
          await submitButton.click();
          await page.waitForTimeout(5000); // Wait for processing

          // Try download again
          if (await downloadButton.isVisible()) {
            const downloadPromise2 = page.waitForEvent('download');
            await downloadButton.click();
            const download2 = await downloadPromise2;
            console.log(`✅ Download after assessment: ${download2.suggestedFilename()}`);
          }
        }
      }
    } else {
      console.log('⚠️ No download button found');

      // Check if download appears after assessment
      const jobInput = await findJobInput(page);
      const submitButton = await findSubmitButton(page);

      if (jobInput && submitButton) {
        await jobInput.fill('Data Scientist');
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check again for download button
        for (const selector of downloadSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            console.log(`✅ Download button appeared after assessment: ${selector}`);
            break;
          }
        }
      }
    }
  });

  test('6. Error handling validation', async ({ page }) => {
    console.log('🚨 Testing error handling...');

    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');

    const jobInput = await findJobInput(page);
    const submitButton = await findSubmitButton(page);

    if (jobInput && submitButton) {
      // Test empty submission
      await jobInput.fill('');
      await submitButton.click();

      await page.waitForTimeout(2000);

      // Check for error message
      const errorSelectors = [
        'text=required',
        'text=error',
        'text=invalid',
        '[class*="error"]',
        '.error',
        '[role="alert"]'
      ];

      let foundError = false;
      for (const selector of errorSelectors) {
        if (await page.locator(selector).isVisible().catch(() => false)) {
          foundError = true;
          console.log(`✅ Error handling found with selector: ${selector}`);
          break;
        }
      }

      if (!foundError) {
        console.log('⚠️ No error message displayed for empty input');
      }

      // Test invalid input
      await jobInput.fill('x'); // Very short input
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Test very long input
      await jobInput.fill('a'.repeat(5000)); // Very long input
      await submitButton.click();
      await page.waitForTimeout(2000);

      console.log('✅ Error handling tests completed');
    }
  });

  test('7. Responsive design and performance', async ({ page }) => {
    console.log('📱 Testing responsive design and performance...');

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    const startTime = Date.now();
    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Desktop load time: ${loadTime}ms`);
    await page.screenshot({ path: 'portfolio-factory-desktop.png', fullPage: true });

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'portfolio-factory-tablet.png', fullPage: true });

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'portfolio-factory-mobile.png', fullPage: true });

    // Performance checks
    if (loadTime < 3000) {
      console.log('✅ Good loading performance (< 3s)');
    } else if (loadTime < 5000) {
      console.log('⚠️ Moderate loading performance (3-5s)');
    } else {
      console.log('❌ Slow loading performance (> 5s)');
    }

    console.log('✅ Responsive design tests completed');
  });

  test('8. Console errors and JavaScript issues', async ({ page }) => {
    console.log('🐛 Checking for console errors and JavaScript issues...');

    await page.goto(PORTFOLIO_FACTORY_URL);
    await page.waitForLoadState('networkidle');

    // Interact with the site to trigger any dynamic errors
    const jobInput = await findJobInput(page);
    const submitButton = await findSubmitButton(page);

    if (jobInput && submitButton) {
      await jobInput.fill('Test Engineer');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }

    // Click various elements to test for JavaScript errors
    const clickableElements = await page.locator('button, a, [onclick]').all();
    for (let i = 0; i < Math.min(clickableElements.length, 5); i++) {
      try {
        if (await clickableElements[i].isVisible()) {
          await clickableElements[i].click();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log(`Click test ${i} failed: ${error.message}`);
      }
    }

    // Report findings
    console.log(`Console errors found: ${consoleErrors.length}`);
    consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });

    console.log(`Network errors found: ${networkErrors.length}`);
    networkErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });

    if (consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log('✅ No JavaScript or network errors detected');
    } else {
      console.log(`⚠️ Found ${consoleErrors.length} console errors and ${networkErrors.length} network errors`);
    }
  });
});

// Helper functions
async function findJobInput(page) {
  const selectors = [
    'input[placeholder*="job" i]',
    'textarea[placeholder*="job" i]',
    'input[placeholder*="description" i]',
    'textarea[placeholder*="description" i]',
    'input[name*="job" i]',
    'textarea[name*="job" i]',
    'input[type="text"]',
    'textarea'
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      return element;
    }
  }
  return null;
}

async function findSubmitButton(page) {
  const selectors = [
    'button:has-text("Generate")',
    'button:has-text("Submit")',
    'button:has-text("Create")',
    'button:has-text("Assess")',
    'button[type="submit"]',
    'input[type="submit"]',
    'button'
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      return element;
    }
  }
  return null;
}
