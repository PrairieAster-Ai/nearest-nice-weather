/**
 * FIXED PERFORMANCE TESTS - Updated for actual FabFilterSystem behavior
 */

import { chromium } from 'playwright';
import fs from 'fs';

// Load performance requirements
const PERF_CONFIG = JSON.parse(fs.readFileSync('./apps/web/src/config/PERFORMANCE-REQUIREMENTS.json', 'utf8'));

const PERF_THRESHOLDS = {
  INSTANT_FEEDBACK: PERF_CONFIG.componentRequirements.FabFilterSystem.uiFeedbackTime.max,
  PAGE_LOAD: PERF_CONFIG.globalRequirements.pageLoadTime.max,
  TIME_TO_INTERACTIVE: PERF_CONFIG.globalRequirements.timeToInteractive.max,
  POI_API_TIMEOUT: PERF_CONFIG.apiEndpoints['/api/poi-locations-with-weather'].responseTime.max,
};

function getPerformanceReport(measured, targetThreshold, maxThreshold) {
  const status = measured <= targetThreshold ? '✅ EXCELLENT' :
                 measured <= maxThreshold ? '⚠️ ACCEPTABLE' :
                 '❌ FAILED';
  return `${status}: ${measured}ms (target: ${targetThreshold}ms, max: ${maxThreshold}ms)`;
}

/**
 * P0 CRITICAL TESTS - Fixed implementation
 */
async function testP0CriticalRules(page) {
  console.log('🚨 Testing P0 CRITICAL business rules...');
  
  const results = [];
  
  // P0-1: Page Load Performance
  console.log('   Testing P0-1: Page Load Performance');
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
    
    results.push({ test: 'P0-1: Page Load Performance', passed, metric: Math.round(pageTime), report });
    console.log(`      ${report}`);
    
  } catch (error) {
    results.push({ test: 'P0-1: Page Load Performance', passed: false, metric: 'TIMEOUT', report: `❌ FAILED: ${error.message}` });
  }
  
  // P0-2: Location Detection
  console.log('   Testing P0-2: Location Detection');
  const locationStart = performance.now();
  
  try {
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 });
    const locationTime = performance.now() - locationStart;
    
    const passed = locationTime <= 10000;
    const report = getPerformanceReport(Math.round(locationTime), 5000, 10000);
    
    results.push({ test: 'P0-2: Location Detection', passed, metric: Math.round(locationTime), report });
    console.log(`      ${report}`);
    
  } catch (error) {
    results.push({ test: 'P0-2: Location Detection', passed: false, metric: 'TIMEOUT', report: '❌ FAILED: No markers within 10 seconds' });
  }
  
  // P0-3: Filter UI Responsiveness - FIXED TEST
  console.log('   Testing P0-3: Filter UI Responsiveness (FIXED)');
  
  try {
    // Wait for FAB system to load
    await page.waitForSelector('.MuiFab-root', { timeout: 5000 });
    
    // Get initial FAB count
    const initialFabCount = await page.locator('.MuiFab-root').count();
    console.log(`      Initial FAB count: ${initialFabCount}`);
    
    // Click first FAB and measure response time
    const filterStart = performance.now();
    await page.click('.MuiFab-root:first-child');
    
    // Wait for slide-out animation to appear (our FAB system shows additional options)
    try {
      await page.waitForFunction(() => {
        const slideContainer = document.querySelector('[class*="right-full"]');
        if (slideContainer) {
          const fabs = slideContainer.querySelectorAll('.MuiFab-root');
          return fabs.length > 0;
        }
        return false;
      }, { timeout: PERF_THRESHOLDS.INSTANT_FEEDBACK });
      
      const filterTime = performance.now() - filterStart;
      const passed = filterTime <= PERF_THRESHOLDS.INSTANT_FEEDBACK;
      const report = getPerformanceReport(
        Math.round(filterTime),
        PERF_CONFIG.componentRequirements.FabFilterSystem.uiFeedbackTime.target,
        PERF_THRESHOLDS.INSTANT_FEEDBACK
      );
      
      results.push({ test: 'P0-3: Filter UI Responsiveness', passed, metric: Math.round(filterTime), report });
      console.log(`      ${report}`);
      
    } catch (timeoutError) {
      // Alternative: Check if FAB state changed (color, etc.)
      const newFabCount = await page.locator('.MuiFab-root').count();
      console.log(`      FAB count after click: ${newFabCount} (was ${initialFabCount})`);
      
      if (newFabCount > initialFabCount) {
        const filterTime = performance.now() - filterStart;
        const passed = filterTime <= PERF_THRESHOLDS.INSTANT_FEEDBACK;
        const report = getPerformanceReport(Math.round(filterTime), 50, PERF_THRESHOLDS.INSTANT_FEEDBACK);
        results.push({ test: 'P0-3: Filter UI Responsiveness', passed, metric: Math.round(filterTime), report });
        console.log(`      ${report} (via FAB expansion)`);
      } else {
        results.push({ 
          test: 'P0-3: Filter UI Responsiveness', 
          passed: false, 
          metric: 'NO_RESPONSE', 
          report: '❌ FAILED: No visual response detected' 
        });
      }
    }
    
  } catch (error) {
    results.push({ 
      test: 'P0-3: Filter UI Responsiveness', 
      passed: false, 
      metric: 'ERROR', 
      report: `❌ FAILED: ${error.message}` 
    });
  }
  
  return results;
}

/**
 * API PERFORMANCE TEST - With better timeout handling
 */
async function testAPIPerformance(page) {
  console.log('⚠️  Testing P1 HIGH priority: API Performance');
  
  const results = [];
  let apiResponseTime = null;
  
  // Set up API monitoring BEFORE triggering any requests
  const responsePromise = new Promise((resolve) => {
    const startTime = performance.now();
    page.on('response', async (response) => {
      if (response.url().includes('poi-locations') || response.url().includes('weather')) {
        const endTime = performance.now();
        apiResponseTime = endTime - startTime;
        console.log(`      API Response detected: ${response.url()} in ${Math.round(apiResponseTime)}ms`);
        resolve(apiResponseTime);
      }
    });
  });
  
  try {
    // Refresh page to trigger API calls
    console.log('      Triggering API calls via page refresh...');
    const apiStart = performance.now();
    await page.reload({ waitUntil: 'networkidle', timeout: PERF_THRESHOLDS.POI_API_TIMEOUT + 2000 });
    
    // Wait for API response with reasonable timeout
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
      
      results.push({ test: 'P1-4: POI API Response', passed, metric: Math.round(apiResponseTime), report });
      console.log(`      ${report}`);
    }
    
  } catch (error) {
    console.log(`      API test error: ${error.message}`);
    results.push({ 
      test: 'P1-4: POI API Response', 
      passed: false, 
      metric: 'TIMEOUT', 
      report: '❌ FAILED: API exceeded 1.5s timeout' 
    });
  }
  
  return results;
}

/**
 * VISUAL VALIDATION TEST
 */
async function testVisualValidation(page) {
  console.log('📸 Testing Visual Validation...');
  
  const results = [];
  
  try {
    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ 
      path: `./quality-screenshots/performance-test-${timestamp}.png`,
      fullPage: true
    });
    
    // Validate core elements
    const mapExists = await page.locator('.leaflet-container').count() > 0;
    const fabExists = await page.locator('.MuiFab-root').count() > 0;
    const markersExist = await page.locator('.leaflet-marker-icon').count() > 0;
    
    const passed = mapExists && fabExists && markersExist;
    const report = `UI Elements: Map=${mapExists}, FAB=${fabExists}, Markers=${markersExist}`;
    
    results.push({ 
      test: 'Visual Validation', 
      passed, 
      metric: `${mapExists + fabExists + markersExist}/3`, 
      report: passed ? `✅ ${report}` : `❌ ${report}` 
    });
    
    console.log(`   ${passed ? '✅' : '❌'} ${report}`);
    
  } catch (error) {
    results.push({ test: 'Visual Validation', passed: false, metric: 'ERROR', report: `❌ ${error.message}` });
  }
  
  return results;
}

/**
 * MAIN TEST RUNNER
 */
async function runFixedPerformanceTests() {
  console.log('🚀 Running FIXED Performance Quality Tests');
  console.log(`📋 Performance config: ${PERF_CONFIG.version} (${PERF_CONFIG.lastUpdated})`);
  console.log('');
  
  const testStart = performance.now();
  let browser;
  let allResults = [];
  
  try {
    browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    
    // Create screenshots directory
    if (!fs.existsSync('./quality-screenshots')) {
      fs.mkdirSync('./quality-screenshots', { recursive: true });
    }
    
    // Run tests
    console.log('=' .repeat(70));
    const p0Results = await testP0CriticalRules(page);
    allResults = allResults.concat(p0Results);
    
    console.log('\n' + '='.repeat(70));
    const apiResults = await testAPIPerformance(page);
    allResults = allResults.concat(apiResults);
    
    console.log('\n' + '='.repeat(70));
    const visualResults = await testVisualValidation(page);
    allResults = allResults.concat(visualResults);
    
  } catch (error) {
    console.error('💥 Test suite error:', error);
  } finally {
    if (browser) await browser.close();
  }
  
  // Generate final report
  const totalTime = performance.now() - testStart;
  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.passed).length;
  const p0Failures = allResults.filter(r => r.test.startsWith('P0') && !r.passed).length;
  
  console.log('\n' + '🎯 FIXED PERFORMANCE TEST REPORT'.padStart(50, '=').padEnd(80, '='));
  console.log(`⏱️  Completed in ${Math.round(totalTime)}ms`);
  console.log(`📊 Results: ${passedTests}/${totalTests} passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  // Show all results
  allResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}: ${result.report}`);
  });
  
  if (p0Failures === 0) {
    console.log('\n🎉 ALL P0 CRITICAL TESTS PASSED! Deployment approved.');
  } else {
    console.log(`\n🚫 ${p0Failures} P0 test(s) failed. Fix before deployment.`);
  }
  
  console.log('\n📊 Performance requirements: /apps/web/src/config/PERFORMANCE-REQUIREMENTS.json');
  
  return { passedTests, totalTests, p0Failures, results: allResults };
}

runFixedPerformanceTests()
  .then((results) => {
    process.exit(results.p0Failures === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });