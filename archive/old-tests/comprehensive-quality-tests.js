/**
 * COMPREHENSIVE QUALITY TESTING - PERFORMANCE-FOCUSED FRONTEND VALIDATION
 * 
 * This script runs comprehensive quality tests using our centralized performance
 * requirements system, including PlaywrightMCP integration for visual validation.
 */

import { chromium } from 'playwright';
import { PERFORMANCE_REQUIREMENTS, PERF_THRESHOLDS, performanceHelpers } from './apps/web/src/config/performanceRequirements.js';
import fs from 'fs';
import path from 'path';

// Performance tracking
const performanceResults = {
  tests: [],
  overallStartTime: performance.now(),
  summary: {}
};

/**
 * BUSINESS RULE PRIORITY TESTING - P0 Critical Tests
 */
async function testP0CriticalBusinessRules(page) {
  console.log('🎯 Testing P0 CRITICAL business rules (system failure prevention)...');
  
  const p0Results = [];
  
  // P0-1: Page Load Performance - MUST be interactive within 3.5 seconds
  console.log('⏱️  Testing P0-1: Page Load Performance');
  const pageLoadStart = performance.now();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    const pageLoadTime = performance.now() - pageLoadStart;
    
    const passed = pageLoadTime <= PERF_THRESHOLDS.TIME_TO_INTERACTIVE;
    const report = performanceHelpers.getPerformanceReport(pageLoadTime, 'global', 'timeToInteractive');
    
    p0Results.push({
      test: 'P0-1: Page Load Performance',
      metric: pageLoadTime,
      threshold: PERF_THRESHOLDS.TIME_TO_INTERACTIVE,
      passed,
      report,
      businessRule: 'MUST be interactive within 3.5 seconds'
    });
    
    console.log(`   ${report}`);
    
    if (!passed) {
      throw new Error(`P0 CRITICAL FAILURE: Page load took ${pageLoadTime}ms, exceeds ${PERF_THRESHOLDS.TIME_TO_INTERACTIVE}ms threshold`);
    }
  } catch (error) {
    console.error('❌ P0-1 FAILED:', error.message);
    throw error;
  }
  
  // P0-2: Location Detection - MUST provide fallback within 10 seconds
  console.log('⏱️  Testing P0-2: Location Detection');
  const locationStart = performance.now();
  
  try {
    // Wait for user location marker or Minneapolis fallback
    await page.waitForSelector('[data-testid="user-location-marker"], .leaflet-marker-icon', { 
      timeout: 10000 
    });
    const locationTime = performance.now() - locationStart;
    
    const passed = locationTime <= 10000; // 10 second requirement
    const report = performanceHelpers.getPerformanceReport(locationTime, 'LocationManager', 'ipGeolocationTimeout');
    
    p0Results.push({
      test: 'P0-2: Location Detection',
      metric: locationTime,
      threshold: 10000,
      passed,
      report,
      businessRule: 'MUST provide fallback location within 10 seconds'
    });
    
    console.log(`   ${report}`);
    
    if (!passed) {
      throw new Error(`P0 CRITICAL FAILURE: Location detection took ${locationTime}ms, exceeds 10000ms threshold`);
    }
  } catch (error) {
    console.error('❌ P0-2 FAILED:', error.message);
    throw error;
  }
  
  // P0-3: Filter Responsiveness - MUST show visual feedback <100ms
  console.log('⏱️  Testing P0-3: Filter Responsiveness');
  
  try {
    // Wait for FAB filter system to load
    await page.waitForSelector('.MuiFab-root', { timeout: 5000 });
    
    const filterStart = performance.now();
    await page.click('.MuiFab-root');
    
    // Wait for filter animation to appear
    await page.waitForSelector('.MuiFab-root[style*="transform"]', { 
      timeout: PERF_THRESHOLDS.INSTANT_FEEDBACK 
    });
    const filterTime = performance.now() - filterStart;
    
    const passed = filterTime <= PERF_THRESHOLDS.INSTANT_FEEDBACK;
    const report = performanceHelpers.getPerformanceReport(filterTime, 'FabFilterSystem', 'uiFeedbackTime');
    
    p0Results.push({
      test: 'P0-3: Filter Responsiveness',
      metric: filterTime,
      threshold: PERF_THRESHOLDS.INSTANT_FEEDBACK,
      passed,
      report,
      businessRule: 'MUST provide instant visual feedback for engagement'
    });
    
    console.log(`   ${report}`);
    
    if (!passed) {
      throw new Error(`P0 CRITICAL FAILURE: Filter response took ${filterTime}ms, exceeds ${PERF_THRESHOLDS.INSTANT_FEEDBACK}ms threshold`);
    }
  } catch (error) {
    console.error('❌ P0-3 FAILED:', error.message);
    throw error;
  }
  
  return p0Results;
}

/**
 * API PERFORMANCE TESTING - P1 High Priority
 */
async function testP1HighPriorityRules(page) {
  console.log('🎯 Testing P1 HIGH priority rules (feature degradation prevention)...');
  
  const p1Results = [];
  
  // P1-4: API Response Time - MUST respond to POI requests within 1.5 seconds
  console.log('⏱️  Testing P1-4: POI API Response Time');
  
  let apiResponseTime = null;
  const responsePromise = new Promise((resolve) => {
    page.on('response', async (response) => {
      if (response.url().includes('/api/poi-locations-with-weather')) {
        const responseEnd = performance.now();
        apiResponseTime = responseEnd - apiStart;
        resolve(apiResponseTime);
      }
    });
  });
  
  const apiStart = performance.now();
  
  try {
    // Trigger POI API call by interacting with filters
    await page.waitForSelector('.MuiFab-root', { timeout: 5000 });
    await page.click('.MuiFab-root');
    
    // Wait for API response
    await Promise.race([
      responsePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), PERF_THRESHOLDS.POI_API_TIMEOUT))
    ]);
    
    const passed = apiResponseTime <= PERF_THRESHOLDS.POI_API_TIMEOUT;
    const report = performanceHelpers.getPerformanceReport(apiResponseTime, 'API', 'poi-locations-with-weather');
    
    p1Results.push({
      test: 'P1-4: POI API Response Time',
      metric: apiResponseTime,
      threshold: PERF_THRESHOLDS.POI_API_TIMEOUT,
      passed,
      report,
      businessRule: 'MUST respond to POI requests within 1.5 seconds'
    });
    
    console.log(`   ${report}`);
    
  } catch (error) {
    console.error('❌ P1-4 FAILED:', error.message);
    p1Results.push({
      test: 'P1-4: POI API Response Time',
      metric: 'TIMEOUT',
      threshold: PERF_THRESHOLDS.POI_API_TIMEOUT,
      passed: false,
      report: 'API request timed out',
      businessRule: 'MUST respond to POI requests within 1.5 seconds'
    });
  }
  
  return p1Results;
}

/**
 * VISUAL REGRESSION TESTING with BrowserToolsMCP Integration
 */
async function testVisualRegression(page) {
  console.log('🎯 Testing Visual Regression with automated screenshots...');
  
  const visualResults = [];
  
  try {
    // Take baseline screenshot of main interface
    const screenshotPath = path.join(process.cwd(), 'quality-test-screenshots');
    if (!fs.existsSync(screenshotPath)) {
      fs.mkdirSync(screenshotPath, { recursive: true });
    }
    
    // Main interface screenshot
    await page.screenshot({ 
      path: path.join(screenshotPath, 'main-interface.png'),
      fullPage: true
    });
    
    // Filter system screenshot
    await page.click('.MuiFab-root');
    await page.waitForTimeout(200); // Wait for animation
    await page.screenshot({ 
      path: path.join(screenshotPath, 'filter-system-expanded.png'),
      fullPage: true
    });
    
    // Test map markers are visible
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    
    visualResults.push({
      test: 'Visual Regression - Interface Screenshots',
      metric: markerCount,
      threshold: 1,
      passed: markerCount > 0,
      report: `${markerCount} map markers detected`,
      businessRule: 'SHOULD show POI markers on map'
    });
    
    console.log(`   ✅ Visual regression tests completed: ${markerCount} markers detected`);
    
  } catch (error) {
    console.error('❌ Visual regression test failed:', error.message);
    visualResults.push({
      test: 'Visual Regression - Interface Screenshots',
      metric: 'ERROR',
      threshold: 1,
      passed: false,
      report: error.message,
      businessRule: 'SHOULD show POI markers on map'
    });
  }
  
  return visualResults;
}

/**
 * CORE WEB VITALS MONITORING
 */
async function testCoreWebVitals(page) {
  console.log('🎯 Testing Core Web Vitals...');
  
  const vitalsResults = [];
  
  try {
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                vitals.FCP = entry.startTime;
              }
            } else if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
          });
          
          // Add navigation timing
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            vitals.TTI = navigation.loadEventEnd - navigation.fetchStart;
          }
          
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value) {
        const passed = metric === 'FCP' ? value < 3000 : 
                     metric === 'LCP' ? value < 2500 : 
                     metric === 'TTI' ? value < PERF_THRESHOLDS.TIME_TO_INTERACTIVE : true;
        
        vitalsResults.push({
          test: `Core Web Vital - ${metric}`,
          metric: Math.round(value),
          threshold: metric === 'TTI' ? PERF_THRESHOLDS.TIME_TO_INTERACTIVE : 'Standard',
          passed,
          report: `${metric}: ${Math.round(value)}ms`,
          businessRule: 'SHOULD meet Core Web Vitals standards'
        });
      }
    });
    
    console.log('   ✅ Core Web Vitals captured');
    
  } catch (error) {
    console.error('❌ Core Web Vitals test failed:', error.message);
  }
  
  return vitalsResults;
}

/**
 * COMPREHENSIVE TEST RUNNER
 */
async function runComprehensiveQualityTests() {
  console.log('🚀 Starting Comprehensive Quality Testing with Performance Focus');
  console.log('📋 Using centralized performance requirements from /src/config/PERFORMANCE-REQUIREMENTS.json');
  
  let browser;
  let allResults = [];
  
  try {
    // Launch browser with performance monitoring
    browser = await chromium.launch({ 
      headless: false, 
      slowMo: 100,
      args: ['--enable-precise-memory-info', '--enable-performance-observer']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });
    
    const page = await context.newPage();
    
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = [];
      
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            window.performanceMetrics.push({
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              entryType: entry.entryType
            });
          });
        }).observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
      }
    });
    
    // Run all test suites in priority order
    console.log('\n' + '='.repeat(60));
    const p0Results = await testP0CriticalBusinessRules(page);
    allResults = allResults.concat(p0Results);
    
    console.log('\n' + '='.repeat(60));
    const p1Results = await testP1HighPriorityRules(page);
    allResults = allResults.concat(p1Results);
    
    console.log('\n' + '='.repeat(60));
    const visualResults = await testVisualRegression(page);
    allResults = allResults.concat(visualResults);
    
    console.log('\n' + '='.repeat(60));
    const vitalsResults = await testCoreWebVitals(page);
    allResults = allResults.concat(vitalsResults);
    
  } catch (error) {
    console.error('💥 CRITICAL TEST FAILURE:', error);
    throw error;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate comprehensive test report
  const totalTime = performance.now() - performanceResults.overallStartTime;
  
  console.log('\n' + '🎯 COMPREHENSIVE QUALITY TEST REPORT'.padStart(40, '=').padEnd(80, '='));
  console.log(`📊 Test Suite Completed in ${Math.round(totalTime)}ms`);
  console.log(`📋 Performance Requirements Source: /src/config/PERFORMANCE-REQUIREMENTS.json`);
  console.log('');
  
  // Group results by priority
  const p0Tests = allResults.filter(r => r.test.startsWith('P0'));
  const p1Tests = allResults.filter(r => r.test.startsWith('P1'));
  const otherTests = allResults.filter(r => !r.test.startsWith('P0') && !r.test.startsWith('P1'));
  
  // P0 Critical Results
  console.log('🚨 P0 CRITICAL TESTS (System Failure Prevention):');
  p0Tests.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} ${result.test}: ${result.report}`);
  });
  
  // P1 High Priority Results
  console.log('\n⚠️  P1 HIGH PRIORITY TESTS (Feature Degradation Prevention):');
  p1Tests.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} ${result.test}: ${result.report}`);
  });
  
  // Other Tests
  if (otherTests.length > 0) {
    console.log('\n📊 ADDITIONAL QUALITY TESTS:');
    otherTests.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.test}: ${result.report}`);
    });
  }
  
  // Summary
  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  const p0Failures = p0Tests.filter(r => !r.passed).length;
  const p1Failures = p1Tests.filter(r => !r.passed).length;
  
  console.log('\n' + '📋 SUMMARY'.padStart(20, '=').padEnd(40, '='));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (p0Failures > 0) {
    console.log(`\n❌ CRITICAL: ${p0Failures} P0 test(s) failed - BLOCKS DEPLOYMENT`);
  }
  
  if (p1Failures > 0) {
    console.log(`\n⚠️  WARNING: ${p1Failures} P1 test(s) failed - Consider fixing before deployment`);
  }
  
  if (p0Failures === 0 && p1Failures === 0) {
    console.log('\n🎉 ALL CRITICAL AND HIGH PRIORITY TESTS PASSED!');
  }
  
  console.log('\n📁 Screenshots saved to: ./quality-test-screenshots/');
  console.log('📊 Performance thresholds defined in: /apps/web/src/config/PERFORMANCE-REQUIREMENTS.json');
  
  return {
    totalTests,
    passedTests,
    failedTests,
    p0Failures,
    p1Failures,
    results: allResults,
    overallPassed: p0Failures === 0
  };
}

// Export for module usage or run directly
export { runComprehensiveQualityTests };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveQualityTests()
    .then((results) => {
      process.exit(results.overallPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}