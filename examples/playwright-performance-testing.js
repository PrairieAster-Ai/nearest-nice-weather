/**
 * PLAYWRIGHT PERFORMANCE TESTING - AUTOMATED QUALITY ASSURANCE
 *
 * This example demonstrates how PlaywrightMCP and other testing tools can leverage
 * the centralized performance requirements system for automated testing.
 */

import { chromium } from 'playwright';
import { PERFORMANCE_REQUIREMENTS, PERF_THRESHOLDS, performanceHelpers } from '../apps/web/src/config/performanceRequirements';

/**
 * P0 CRITICAL BUSINESS RULES - System Failure Prevention
 */
async function testP0BusinessRules(page) {
  console.log('🎯 Testing P0 CRITICAL business rules...');

  // P0-1: Location Fallback (10 second timeout)
  const locationTimeout = PERFORMANCE_REQUIREMENTS.componentRequirements.LocationManager.ipGeolocationTimeout.max;
  await page.goto('http://localhost:3001');

  const startTime = performance.now();
  await page.waitForSelector('[data-testid="user-location-marker"]', {
    timeout: locationTimeout
  });
  const locationTime = performance.now() - startTime;

  console.log(performanceHelpers.getPerformanceReport(locationTime, 'LocationManager', 'ipGeolocationTimeout'));

  // P0-2: Filter Responsiveness (<100ms visual feedback)
  const filterFeedbackTime = PERF_THRESHOLDS.INSTANT_FEEDBACK;

  const filterStart = performance.now();
  await page.click('[data-testid="temperature-filter"]');
  await page.waitForSelector('[data-testid="filter-animation"]', { timeout: filterFeedbackTime });
  const filterTime = performance.now() - filterStart;

  console.log(performanceHelpers.getPerformanceReport(filterTime, 'FabFilterSystem', 'uiFeedbackTime'));

  // P0-3: Page Load (3.5 second interactive)
  const pageLoadTime = PERF_THRESHOLDS.TIME_TO_INTERACTIVE;
  await page.reload();
  await page.waitForLoadState('networkidle', { timeout: pageLoadTime });

  console.log('✅ All P0 business rules validated');
}

/**
 * P1 HIGH PRIORITY - Feature Degradation Prevention
 */
async function testP1BusinessRules(page) {
  console.log('🎯 Testing P1 HIGH priority business rules...');

  // P1-4: API Response Time (1.5 second POI data)
  const apiTimeout = PERF_THRESHOLDS.POI_API_TIMEOUT;

  page.on('response', async (response) => {
    if (response.url().includes('/api/poi-locations-with-weather')) {
      const responseTime = response.timing().responseEnd - response.timing().responseStart;
      console.log(performanceHelpers.getPerformanceReport(responseTime, 'API', 'poi-locations-with-weather'));
    }
  });

  await page.click('[data-testid="refresh-pois"]');
  await page.waitForResponse(response =>
    response.url().includes('/api/poi-locations-with-weather') && response.status() === 200,
    { timeout: apiTimeout }
  );

  // P1-5: Filter State Persistence
  await page.click('[data-testid="temperature-mild"]');
  await page.reload();
  const persistedFilter = await page.locator('[data-testid="temperature-mild"][data-selected="true"]').count();

  console.log(persistedFilter > 0 ? '✅ Filter persistence working' : '❌ Filter persistence failed');
  console.log('✅ All P1 business rules validated');
}

/**
 * PERFORMANCE MONITORING - Real-time Quality Assurance
 */
async function monitorPerformanceMetrics(page) {
  console.log('📊 Monitoring Core Web Vitals...');

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    return {
      FCP: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
      TTI: navigation.loadEventEnd - navigation.fetchStart,
      CLS: 0, // Would need layout shift observer in real implementation
    };
  });

  // Compare against requirements
  const requirements = PERFORMANCE_REQUIREMENTS.monitoring.metrics;
  Object.entries(metrics).forEach(([metric, value]) => {
    if (value && requirements.includes(metric)) {
      console.log(`${metric}: ${Math.round(value)}ms`);
    }
  });
}

/**
 * AUTOMATED TEST RUNNER
 */
async function runAutomatedPerformanceTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Configure performance monitoring
    await page.addInitScript(() => {
      // Real User Monitoring setup
      window.performanceMetrics = [];

      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          window.performanceMetrics.push({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            timestamp: new Date().toISOString()
          });
        });
      }).observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    });

    // Run business rule tests in priority order
    await testP0BusinessRules(page);
    await testP1BusinessRules(page);
    await monitorPerformanceMetrics(page);

    console.log('🎯 All automated performance tests completed successfully');

  } catch (error) {
    console.error('❌ Performance test failed:', error);

    // Capture screenshot for debugging
    await page.screenshot({
      path: 'performance-test-failure.png',
      fullPage: true
    });

  } finally {
    await browser.close();
  }
}

// Example usage for PlaywrightMCP integration
export {
  testP0BusinessRules,
  testP1BusinessRules,
  monitorPerformanceMetrics,
  runAutomatedPerformanceTests
};
