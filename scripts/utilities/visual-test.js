#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');

async function visualTest() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone 13 Pro
    deviceScaleFactor: 3
  });

  const page = await context.newPage();

  try {
    console.log('📱 Testing iPhone Portrait (375x812)...');
    await page.goto('http://localhost:3001/presentation/index-reveal.html');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'iphone-portrait-current.png',
      fullPage: true
    });

    // Analyze spacing
    const headerHeight = await page.evaluate(() => {
      const header = document.getElementById('presentation-header');
      return header ? header.offsetHeight : 0;
    });

    const slideTop = await page.evaluate(() => {
      const slide = document.querySelector('.reveal .slides section');
      return slide ? slide.getBoundingClientRect().top : 0;
    });

    const appliedStyles = await page.evaluate(() => {
      const slide = document.querySelector('.reveal .slides section');
      if (!slide) return null;
      const styles = window.getComputedStyle(slide);
      return {
        paddingTop: styles.paddingTop,
        top: styles.top,
        fontSize: styles.fontSize,
        height: styles.height
      };
    });

    console.log('📊 Visual Analysis Results:');
    console.log(`Header Height: ${headerHeight}px`);
    console.log(`Slide Top Position: ${slideTop}px`);
    console.log(`Whitespace Gap: ${slideTop - headerHeight}px`);
    console.log('Applied Styles:', appliedStyles);

    // Check if media query is active
    const mediaQuery = await page.evaluate(() => {
      return window.matchMedia('(max-width: 480px) and (orientation: portrait)').matches;
    });

    console.log(`📱 iPhone Portrait Media Query Active: ${mediaQuery}`);

  } catch (error) {
    console.error('❌ Visual test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  visualTest().catch(console.error);
}

module.exports = { visualTest };
