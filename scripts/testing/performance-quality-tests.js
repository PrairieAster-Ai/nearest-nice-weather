/**
 * PERFORMANCE QUALITY TESTING - Centralized Performance Requirements Validation
 *
 * Tests frontend performance using the centralized requirements from
 * /apps/web/src/config/PERFORMANCE-REQUIREMENTS.json
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Load performance requirements from centralized config
const PERF_CONFIG = JSON.parse(fs.readFileSync('./apps/web/src/config/PERFORMANCE-REQUIREMENTS.json', 'utf8'));

// Quick access to common thresholds
const PERF_THRESHOLDS = {
  INSTANT_FEEDBACK: PERF_CONFIG.componentRequirements.FabFilterSystem.uiFeedbackTime.max,
  FILTER_DEBOUNCE: PERF_CONFIG.componentRequirements.FilterManager.debounceDelay.target,
  PAGE_LOAD: PERF_CONFIG.globalRequirements.pageLoadTime.max,
  TIME_TO_INTERACTIVE: PERF_CONFIG.globalRequirements.timeToInteractive.max,
  API_TIMEOUT: PERF_CONFIG.globalRequirements.apiResponseTime.max,
  POI_API_TIMEOUT: PERF_CONFIG.apiEndpoints['/api/poi-locations-with-weather'].responseTime.max,
  MARKER_RENDER: PERF_CONFIG.componentRequirements.MapComponent.markerRenderTime.max,
  MAP_ANIMATION: PERF_CONFIG.componentRequirements.MapComponent.panAnimationDuration.max
};

// Helper to generate performance reports
function getPerformanceReport(measured, targetThreshold, maxThreshold) {
  const status = measured <= targetThreshold ? '✅ EXCELLENT' :
                 measured <= maxThreshold ? '⚠️ ACCEPTABLE' :
                 '❌ FAILED';
  return `${status}: ${measured}ms (target: ${targetThreshold}ms, max: ${maxThreshold}ms)`;
}

/**
 * P0 CRITICAL BUSINESS RULES - System Failure Prevention
 */
async function testP0CriticalRules(page) {
  console.log('🚨 Testing P0 CRITICAL business rules (system failure prevention)...');

  const results = [];

  // P0-1: Page Load Performance
  console.log('   Testing P0-1: Page must load within 3.5 seconds');
  const pageStart = performance.now();

  try {
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: PERF_THRESHOLDS.TIME_TO_INTERACTIVE
    });
    const pageTime = performance.now() - pageStart;

    const passed = pageTime <= PERF_THRESHOLDS.TIME_TO_INTERACTIVE;
    const report = getPerformanceReport(
      Math.round(pageTime),
      PERF_CONFIG.globalRequirements.timeToInteractive.target,
      PERF_THRESHOLDS.TIME_TO_INTERACTIVE
    );

    results.push({
      test: 'P0-1: Page Load Performance',
      passed,
      metric: Math.round(pageTime),
      report
    });

    console.log(`      ${report}`);

  } catch (error) {
    results.push({
      test: 'P0-1: Page Load Performance',
      passed: false,
      metric: 'TIMEOUT',
      report: `❌ FAILED: ${error.message}`
    });
  }

  // P0-2: Location Detection Fallback
  console.log('   Testing P0-2: Location must resolve within 10 seconds');
  const locationStart = performance.now();

  try {
    // Wait for any location marker (user location or POI markers)
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const locationTime = performance.now() - locationStart;

    const passed = locationTime <= 10000;
    const report = getPerformanceReport(Math.round(locationTime), 5000, 10000);

    results.push({
      test: 'P0-2: Location Detection',
      passed,
      metric: Math.round(locationTime),
      report
    });

    console.log(`      ${report}`);

  } catch (error) {
    results.push({
      test: 'P0-2: Location Detection',
      passed: false,
      metric: 'TIMEOUT',
      report: '❌ FAILED: No location markers appeared within 10 seconds'
    });
  }

  // P0-3: Filter UI Responsiveness
  console.log('   Testing P0-3: Filter must respond within 100ms');

  try {
    await page.waitForSelector('.MuiFab-root', { timeout: 5000 });

    const filterStart = performance.now();
    await page.click('.MuiFab-root');

    // Wait for visual change (animation or state change)
    await page.waitForFunction(() => {
      const fab = document.querySelector('.MuiFab-root');
      return fab && (fab.style.transform || fab.getAttribute('aria-expanded') === 'true');
    }, { timeout: PERF_THRESHOLDS.INSTANT_FEEDBACK });

    const filterTime = performance.now() - filterStart;

    const passed = filterTime <= PERF_THRESHOLDS.INSTANT_FEEDBACK;
    const report = getPerformanceReport(
      Math.round(filterTime),
      PERF_CONFIG.componentRequirements.FabFilterSystem.uiFeedbackTime.target,
      PERF_THRESHOLDS.INSTANT_FEEDBACK
    );

    results.push({
      test: 'P0-3: Filter Responsiveness',
      passed,
      metric: Math.round(filterTime),
      report
    });

    console.log(`      ${report}`);

  } catch (error) {
    results.push({
      test: 'P0-3: Filter Responsiveness',
      passed: false,
      metric: 'TIMEOUT',
      report: '❌ FAILED: Filter did not respond within 100ms'
    });
  }

  return results;
}

/**
 * P1 HIGH PRIORITY RULES - Feature Degradation Prevention
 */
async function testP1HighPriorityRules(page) {
  console.log('⚠️  Testing P1 HIGH priority rules (feature degradation prevention)...');

  const results = [];

  // P1-4: API Response Time
  console.log('   Testing P1-4: POI API must respond within 1.5 seconds');

  let apiResponseTime = null;
  const responseStart = performance.now();

  const responsePromise = new Promise((resolve) => {
    page.on('response', async (response) => {
      if (response.url().includes('poi-locations') || response.url().includes('weather-locations')) {
        apiResponseTime = performance.now() - responseStart;
        resolve(apiResponseTime);
      }
    });
  });

  try {
    // Trigger API call by refreshing or interacting
    await page.reload({ waitUntil: 'networkidle' });

    // Wait for API response or timeout
    await Promise.race([
      responsePromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), PERF_THRESHOLDS.POI_API_TIMEOUT)
      )
    ]);

    if (apiResponseTime) {
      const passed = apiResponseTime <= PERF_THRESHOLDS.POI_API_TIMEOUT;
      const report = getPerformanceReport(
        Math.round(apiResponseTime),
        PERF_CONFIG.apiEndpoints['/api/poi-locations-with-weather'].responseTime.target,
        PERF_THRESHOLDS.POI_API_TIMEOUT
      );

      results.push({
        test: 'P1-4: POI API Response Time',
        passed,
        metric: Math.round(apiResponseTime),
        report
      });

      console.log(`      ${report}`);
    }

  } catch (error) {
    results.push({
      test: 'P1-4: POI API Response Time',
      passed: false,
      metric: 'TIMEOUT',
      report: '❌ FAILED: API request exceeded 1.5 second timeout'
    });
  }

  return results;
}

/**
 * VISUAL VALIDATION TESTS
 */
async function testVisualValidation(page) {
  console.log('📸 Testing Visual Validation...');

  const results = [];

  try {
    // Create screenshots directory
    const screenshotDir = path.join(process.cwd(), 'quality-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Take main interface screenshot
    await page.screenshot({
      path: path.join(screenshotDir, `main-interface-${Date.now()}.png`),
      fullPage: true
    });

    // Validate core UI elements are present
    const mapExists = await page.locator('.leaflet-container').count() > 0;
    const fabExists = await page.locator('.MuiFab-root').count() > 0;
    const markersExist = await page.locator('.leaflet-marker-icon').count() > 0;

    results.push({
      test: 'Visual Validation - Core UI Elements',
      passed: mapExists && fabExists,
      metric: `Map: ${mapExists}, FAB: ${fabExists}, Markers: ${markersExist}`,
      report: `✅ Core UI elements: Map=${mapExists}, FAB=${fabExists}, Markers=${markersExist}`
    });

    console.log(`   ✅ Screenshots saved to: ${screenshotDir}/`);
    console.log(`   📊 UI Elements: Map=${mapExists}, FAB=${fabExists}, Markers=${markersExist}`);

  } catch (error) {
    results.push({
      test: 'Visual Validation - Core UI Elements',
      passed: false,
      metric: 'ERROR',
      report: `❌ FAILED: ${error.message}`
    });
  }

  return results;
}

/**
 * COMPREHENSIVE TEST RUNNER
 */
async function runPerformanceQualityTests() {
  console.log('🚀 Starting Performance-Focused Quality Testing');
  console.log(`📋 Using performance requirements from: ${PERF_CONFIG.description}`);
  console.log(`📅 Config last updated: ${PERF_CONFIG.lastUpdated}`);
  console.log('');

  let browser;
  let allResults = [];
  const testStart = performance.now();

  try {
    // Launch browser with performance monitoring
    browser = await chromium.launch({
      headless: false,
      slowMo: 50,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = [];
    });

    // Run test suites in priority order
    console.log('=' .repeat(70));
    const p0Results = await testP0CriticalRules(page);
    allResults = allResults.concat(p0Results);

    console.log('\n' + '='.repeat(70));
    const p1Results = await testP1HighPriorityRules(page);
    allResults = allResults.concat(p1Results);

    console.log('\n' + '='.repeat(70));
    const visualResults = await testVisualValidation(page);
    allResults = allResults.concat(visualResults);

  } catch (error) {
    console.error('💥 CRITICAL TEST FAILURE:', error);
    throw error;

  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate comprehensive report
  const totalTime = performance.now() - testStart;

  console.log('\n' + '🎯 PERFORMANCE QUALITY TEST REPORT'.padStart(50, '=').padEnd(80, '='));
  console.log(`⏱️  Test suite completed in ${Math.round(totalTime)}ms`);
  console.log(`📊 Performance config: ${PERF_CONFIG.version} (${PERF_CONFIG.lastUpdated})`);
  console.log('');

  // Analyze results by priority
  const p0Tests = allResults.filter(r => r.test.startsWith('P0'));
  const p1Tests = allResults.filter(r => r.test.startsWith('P1'));
  const otherTests = allResults.filter(r => !r.test.startsWith('P0') && !r.test.startsWith('P1'));

  // P0 Critical Results
  console.log('🚨 P0 CRITICAL TESTS (System Failure Prevention):');
  p0Tests.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.test}`);
    console.log(`           ${result.report}`);
  });

  // P1 High Priority Results
  if (p1Tests.length > 0) {
    console.log('\n⚠️  P1 HIGH PRIORITY TESTS (Feature Degradation Prevention):');
    p1Tests.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${result.test}`);
      console.log(`           ${result.report}`);
    });
  }

  // Other Tests
  if (otherTests.length > 0) {
    console.log('\n📊 ADDITIONAL QUALITY TESTS:');
    otherTests.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${result.test}`);
      console.log(`           ${result.report}`);
    });
  }

  // Final Summary
  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const p0Failures = p0Tests.filter(r => !r.passed).length;
  const p1Failures = p1Tests.filter(r => !r.passed).length;

  console.log('\n' + '📋 FINAL SUMMARY'.padStart(30, '=').padEnd(50, '='));
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`❌ Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);

  // Deployment decision logic
  if (p0Failures > 0) {
    console.log(`\n🚫 DEPLOYMENT BLOCKED: ${p0Failures} P0 critical test(s) failed`);
    console.log('   Fix P0 issues before deployment to prevent system failures');
  } else if (p1Failures > 0) {
    console.log(`\n⚠️  DEPLOYMENT WARNING: ${p1Failures} P1 high priority test(s) failed`);
    console.log('   Consider fixing P1 issues to prevent feature degradation');
  } else {
    console.log('\n🎉 DEPLOYMENT APPROVED: All critical and high priority tests passed!');
  }

  console.log('\n📁 Screenshots: ./quality-screenshots/');
  console.log('📊 Performance Config: ./apps/web/src/config/PERFORMANCE-REQUIREMENTS.json');
  console.log('📚 Business Rules: ./apps/web/src/config/BUSINESS-RULES.md');

  return {
    totalTests,
    passedTests,
    failedTests,
    p0Failures,
    p1Failures,
    deploymentApproved: p0Failures === 0,
    results: allResults
  };
}

// Run the tests
runPerformanceQualityTests()
  .then((results) => {
    process.exit(results.deploymentApproved ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
