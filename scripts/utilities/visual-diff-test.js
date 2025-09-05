#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshotAndAnalyze() {
  console.log('🎯 Visual Diff Test - iPhone Portrait Analysis');
  console.log('=' . repeat(60));

  let browser, context, page;

  try {
    // Launch browser using system Chromium
    browser = await chromium.launch({
      headless: true,
      executablePath: '/usr/bin/flatpak',
      args: [
        'run',
        'org.chromium.Chromium',
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--remote-debugging-port=9222'
      ]
    });

    // Create iPhone portrait context
    context = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone 13 Pro
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    page = await context.newPage();

    console.log('📱 Loading presentation...');
    await page.goto('http://localhost:3001/presentation/index-reveal.html', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait for reveal.js to initialize
    await page.waitForSelector('.reveal .slides section', { timeout: 5000 });
    await page.waitForTimeout(2000); // Allow animations to settle

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'visual-analysis-current.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // Just viewport
      clip: { x: 0, y: 0, width: 375, height: 812 }
    });

    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Analyze layout measurements
    const measurements = await page.evaluate(() => {
      const header = document.getElementById('presentation-header');
      const slides = document.querySelector('.reveal .slides');
      const section = document.querySelector('.reveal .slides section');
      const slideContent = document.querySelector('.slide-content');
      const elevatorPitch = document.querySelector('.elevator-pitch');

      const headerRect = header ? header.getBoundingClientRect() : null;
      const sectionRect = section ? section.getBoundingClientRect() : null;
      const contentRect = slideContent ? slideContent.getBoundingClientRect() : null;
      const pitchRect = elevatorPitch ? elevatorPitch.getBoundingClientRect() : null;

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        header: headerRect ? { height: headerRect.height, bottom: headerRect.bottom } : null,
        section: sectionRect ? { top: sectionRect.top, height: sectionRect.height } : null,
        content: contentRect ? { top: contentRect.top, height: contentRect.height } : null,
        pitch: pitchRect ? { top: pitchRect.top, height: pitchRect.height } : null,
        whitespaceGap: headerRect && pitchRect ? pitchRect.top - headerRect.bottom : null
      };
    });

    // Analyze whitespace
    console.log('\n📊 Layout Analysis:');
    console.log(`Viewport: ${measurements.viewport.width}x${measurements.viewport.height}`);

    if (measurements.header) {
      console.log(`Header height: ${measurements.header.height}px`);
      console.log(`Header bottom: ${measurements.header.bottom}px`);
    }

    if (measurements.pitch) {
      console.log(`Elevator pitch starts at: ${measurements.pitch.top}px`);
    }

    if (measurements.whitespaceGap !== null) {
      console.log(`\n🎯 WHITESPACE GAP: ${measurements.whitespaceGap}px`);

      if (measurements.whitespaceGap > 50) {
        console.log('❌ SIGNIFICANT WHITESPACE DETECTED');
        console.log(`   Gap represents ${(measurements.whitespaceGap / measurements.viewport.height * 100).toFixed(1)}% of screen`);
      } else if (measurements.whitespaceGap > 20) {
        console.log('⚠️  MINOR WHITESPACE DETECTED');
      } else {
        console.log('✅ MINIMAL WHITESPACE - GOOD');
      }
    }

    // Check applied styles
    const appliedStyles = await page.evaluate(() => {
      const section = document.querySelector('.reveal .slides section');
      if (!section) return null;

      const styles = window.getComputedStyle(section);
      return {
        top: styles.top,
        paddingTop: styles.paddingTop,
        marginTop: styles.marginTop,
        height: styles.height,
        display: styles.display,
        justifyContent: styles.justifyContent
      };
    });

    console.log('\n🎨 Applied CSS Styles:');
    if (appliedStyles) {
      Object.entries(appliedStyles).forEach(([prop, value]) => {
        console.log(`  ${prop}: ${value}`);
      });
    }

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    if (errors.length > 0) {
      console.log('\n🚨 Console Errors:');
      errors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\n✅ No console errors detected');
    }

    return {
      screenshotPath,
      measurements,
      appliedStyles,
      errors
    };

  } catch (error) {
    console.error('❌ Error during visual analysis:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  takeScreenshotAndAnalyze()
    .then(result => {
      console.log('\n🎯 Visual analysis complete!');
      console.log(`Screenshot: ${result.screenshotPath}`);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { takeScreenshotAndAnalyze };
