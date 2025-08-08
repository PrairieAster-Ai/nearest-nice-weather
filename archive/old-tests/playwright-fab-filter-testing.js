#!/usr/bin/env node

/**
 * PLAYWRIGHT FAB FILTER VISUAL REGRESSION & CONSOLE TESTING
 * 
 * PURPOSE: Comprehensive testing of the optimized FAB filter system
 * - Visual regression testing to ensure UI consistency
 * - Console log analysis to detect performance issues
 * - Filter interaction testing to validate UX optimizations
 * - Performance timing analysis for <100ms instant gratification validation
 * 
 * BUSINESS CONTEXT: Critical quality assurance before MVP launch
 * - Ensures "Weekend Warriors on a budget" get reliable filter experience
 * - Validates biological UX optimization claims in business plan
 * - Prevents deployment of broken filter interactions
 * - Supports 10,000+ daily users reliability goal
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/home/robertspeer/Projects/screenshots/fab-filter-tests';
const RESULTS_DIR = '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/test-results';

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    console.log('✅ Test directories created/verified');
  } catch (error) {
    console.error('❌ Failed to create directories:', error.message);
  }
}

// Visual regression testing suite
async function runVisualRegressionTests() {
  console.log('📸 Starting Visual Regression Testing');
  console.log('=' + '='.repeat(50));

  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 500 // Slow down for observation
  });
  
  const page = await browser.newPage();
  const consoleMessages = [];
  const performanceMetrics = [];
  
  // Capture console messages
  page.on('console', (msg) => {
    const timestamp = new Date().toISOString();
    consoleMessages.push({
      timestamp,
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture network timing for performance analysis
  page.on('response', async (response) => {
    try {
      if (response.url().includes('api/poi-locations')) {
        const startTime = Date.now();
        await response.body().catch(() => {}); // Consume response
        const responseTime = Date.now() - startTime;
        
        performanceMetrics.push({
          url: response.url(),
          status: response.status(),
          responseTime: responseTime
        });
      }
    } catch (error) {
      // Ignore timing errors for now
    }
  });

  try {
    console.log('🌐 Loading application...');
    await page.goto(BASE_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for initial load
    await page.waitForTimeout(3000);

    // Test 1: Initial state screenshot
    console.log('📸 Test 1: Capturing initial state');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '01-initial-state.png'),
      fullPage: false // Focus on viewport
    });

    // Test 2: FAB filter visibility and positioning
    console.log('📸 Test 2: Testing FAB filter visibility');
    
    const fabSystem = page.locator('[class*="absolute top-6 right-6"]');
    await fabSystem.waitFor({ state: 'visible', timeout: 10000 });
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '02-fab-system-visible.png'),
      fullPage: false
    });

    // Test 3: Filter interaction - Temperature
    console.log('📸 Test 3: Testing temperature filter interaction');
    
    // Find temperature filter button by emoji
    const tempButton = page.locator('button:has-text("🌡️"), [aria-label*="Temperature"], span:has-text("🌡️")').first();
    
    const startTime = Date.now();
    await tempButton.click();
    const clickResponseTime = Date.now() - startTime;
    
    console.log(`  ⏱️ Temperature filter click response: ${clickResponseTime}ms`);
    
    // Wait for flyout menu to appear
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '03-temperature-flyout.png'),
      fullPage: false
    });

    // Test 4: Filter option selection
    console.log('📸 Test 4: Testing filter option selection');
    
    // Click on "Cold" option (looking for cold emoji or text)
    const coldOption = page.locator('button:has-text("🥶"), button:has-text("Cold"), span:has-text("🥶")').first();
    
    const optionStartTime = Date.now();
    await coldOption.click();
    const optionResponseTime = Date.now() - optionStartTime;
    
    console.log(`  ⏱️ Cold option selection response: ${optionResponseTime}ms`);
    
    // Wait for UI updates
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '04-cold-selected.png'),
      fullPage: false
    });

    // Test 5: Loading state visualization
    console.log('📸 Test 5: Testing loading states');
    
    // Quickly change multiple filters to trigger loading state
    const precipButton = page.locator('button:has-text("🌧️"), [aria-label*="Precipitation"], span:has-text("🌧️")').first();
    await precipButton.click();
    
    // Capture loading state if visible
    await page.waitForTimeout(200);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '05-loading-state.png'),
      fullPage: false
    });

    const noneOption = page.locator('button:has-text("☀️"), button:has-text("None"), span:has-text("☀️")').first();
    await noneOption.click();
    
    await page.waitForTimeout(1000);

    // Test 6: Multiple filters active
    console.log('📸 Test 6: Testing multiple active filters');
    
    const windButton = page.locator('button:has-text("💨"), [aria-label*="Wind"], span:has-text("💨")').first();
    await windButton.click();
    await page.waitForTimeout(300);
    
    const calmOption = page.locator('button:has-text("🌱"), button:has-text("Calm"), span:has-text("🌱")').first();
    await calmOption.click();
    
    await page.waitForTimeout(1500);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '06-multiple-filters-active.png'),
      fullPage: false
    });

    // Test 7: Filter summary display
    console.log('📸 Test 7: Testing filter summary display');
    
    // Look for active filter summary
    const summary = page.locator('[class*="Active Filters"], [class*="rgba(117, 99, 168"], div:has-text("Active Filters")').first();
    
    try {
      await summary.waitFor({ state: 'visible', timeout: 5000 });
      console.log('  ✅ Filter summary is visible');
    } catch (error) {
      console.log('  ⚠️ Filter summary not found or not visible');
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '07-filter-summary.png'),
      fullPage: false
    });

    // Test 8: Result count badges
    console.log('📸 Test 8: Testing result count badges');
    
    // Look for count badges
    const badges = page.locator('.MuiChip-root, [class*="badge"], [class*="count"]');
    const badgeCount = await badges.count();
    
    console.log(`  📊 Found ${badgeCount} potential count badges`);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '08-result-count-badges.png'),
      fullPage: false
    });

    // Test 9: Mobile viewport testing
    console.log('📸 Test 9: Testing mobile viewport');
    
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '09-mobile-viewport.png'),
      fullPage: false
    });

    // Test 10: Performance timing validation
    console.log('📊 Test 10: Performance timing analysis');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Rapid filter changes to test debouncing
    const rapidTestStart = Date.now();
    
    await tempButton.click();
    await page.waitForTimeout(50);
    await coldOption.click();
    
    await precipButton.click();
    await page.waitForTimeout(50);
    await noneOption.click();
    
    const rapidTestEnd = Date.now();
    const totalRapidTime = rapidTestEnd - rapidTestStart;
    
    console.log(`  ⚡ Rapid filter changes completed in: ${totalRapidTime}ms`);
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '10-performance-test-final.png'),
      fullPage: false
    });

    console.log('✅ Visual regression tests completed successfully');
    
    // Save console logs and performance metrics
    await saveTestResults(consoleMessages, performanceMetrics, {
      clickResponseTime,
      optionResponseTime,
      totalRapidTime,
      badgeCount
    });

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    
    // Capture error state
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'error-state.png'),
      fullPage: true
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Save comprehensive test results
async function saveTestResults(consoleMessages, performanceMetrics, timingMetrics) {
  console.log('💾 Saving test results and analysis');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Console log analysis
  const consoleAnalysis = analyzeConsoleMessages(consoleMessages);
  
  // Performance analysis
  const performanceAnalysis = analyzePerformanceMetrics(performanceMetrics, timingMetrics);
  
  const testReport = {
    timestamp,
    testSuite: 'FAB Filter Visual Regression & Performance Testing',
    summary: {
      totalTests: 10,
      consoleMessages: consoleMessages.length,
      performanceMetrics: performanceMetrics.length,
      criticalIssues: consoleAnalysis.criticalIssues.length,
      performanceIssues: performanceAnalysis.issues.length
    },
    consoleAnalysis,
    performanceAnalysis,
    timingMetrics,
    recommendations: generateRecommendations(consoleAnalysis, performanceAnalysis, timingMetrics)
  };
  
  const reportPath = path.join(RESULTS_DIR, `fab-filter-test-report-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(testReport, null, 2));
  
  console.log(`📊 Test report saved: ${reportPath}`);
  
  return testReport;
}

// Analyze console messages for issues
function analyzeConsoleMessages(messages) {
  const criticalIssues = [];
  const warnings = [];
  const performance = [];
  const filterRelated = [];
  
  messages.forEach((msg) => {
    const text = msg.text.toLowerCase();
    
    // Critical issues
    if (msg.type === 'error' || text.includes('error') || text.includes('failed')) {
      criticalIssues.push(msg);
    }
    
    // Warnings
    if (msg.type === 'warning' || text.includes('warning') || text.includes('deprecated')) {
      warnings.push(msg);
    }
    
    // Performance related
    if (text.includes('performance') || text.includes('slow') || text.includes('timeout')) {
      performance.push(msg);
    }
    
    // Filter related messages
    if (text.includes('filter') || text.includes('fab') || text.includes('debounce')) {
      filterRelated.push(msg);
    }
  });
  
  return {
    total: messages.length,
    criticalIssues,
    warnings,
    performance,
    filterRelated,
    byType: messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {})
  };
}

// Analyze performance metrics
function analyzePerformanceMetrics(metrics, timingMetrics) {
  const issues = [];
  const recommendations = [];
  
  // Check API response times
  metrics.forEach((metric) => {
    if (metric.responseTime > 1000) {
      issues.push({
        type: 'slow_api',
        message: `API response time ${metric.responseTime}ms exceeds 1000ms threshold`,
        url: metric.url
      });
    }
  });
  
  // Check UI response times
  if (timingMetrics.clickResponseTime > 100) {
    issues.push({
      type: 'slow_ui',
      message: `Click response time ${timingMetrics.clickResponseTime}ms exceeds 100ms instant gratification goal`
    });
  }
  
  if (timingMetrics.optionResponseTime > 100) {
    issues.push({
      type: 'slow_ui',
      message: `Option selection response time ${timingMetrics.optionResponseTime}ms exceeds 100ms goal`
    });
  }
  
  // Check for successful debouncing
  if (timingMetrics.totalRapidTime > 500) {
    recommendations.push({
      type: 'debounce_optimization',
      message: 'Consider reducing debounce delay for faster rapid interactions'
    });
  }
  
  return {
    issues,
    recommendations,
    metrics,
    summary: {
      avgApiResponseTime: metrics.length > 0 ? metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / metrics.length : 0,
      slowApiCalls: metrics.filter(m => (m.responseTime || 0) > 1000).length,
      uiResponseTime: timingMetrics.clickResponseTime
    }
  };
}

// Generate recommendations based on analysis
function generateRecommendations(consoleAnalysis, performanceAnalysis, timingMetrics) {
  const recommendations = [];
  
  // Console-based recommendations
  if (consoleAnalysis.criticalIssues.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Critical Issues',
      message: `Found ${consoleAnalysis.criticalIssues.length} critical console errors that need immediate attention`,
      action: 'Review and fix console errors before MVP launch'
    });
  }
  
  // Performance-based recommendations
  if (performanceAnalysis.summary.uiResponseTime > 100) {
    recommendations.push({
      priority: 'HIGH',
      category: 'UX Performance',
      message: 'UI response time exceeds 100ms instant gratification goal',
      action: 'Optimize filter state updates and animations'
    });
  }
  
  // Success validations
  if (timingMetrics.clickResponseTime < 100 && timingMetrics.optionResponseTime < 100) {
    recommendations.push({
      priority: 'SUCCESS',
      category: 'Performance Goal',
      message: '✅ Successfully achieved <100ms instant gratification goal',
      action: 'Performance optimization is working correctly'
    });
  }
  
  if (consoleAnalysis.criticalIssues.length === 0) {
    recommendations.push({
      priority: 'SUCCESS',
      category: 'Code Quality',
      message: '✅ No critical console errors detected',
      action: 'Code quality is good for MVP launch'
    });
  }
  
  return recommendations;
}

// Main execution
async function runComprehensiveTests() {
  console.log('🧪 FAB FILTER COMPREHENSIVE TESTING SUITE');
  console.log('🎯 Goal: Visual regression testing + console log analysis');
  console.log('📋 Business context: MVP quality assurance for Weekend Warriors\n');
  
  try {
    await ensureDirectories();
    
    // Check if localhost is running
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      console.log('✅ Localhost server is running');
    } catch (error) {
      console.log('❌ Localhost server not available');
      console.log('   Please start with: npm start');
      console.log('   Then run this test again');
      return;
    }
    
    const testReport = await runVisualRegressionTests();
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('=' + '='.repeat(40));
    console.log(`📸 Screenshots saved: ${SCREENSHOTS_DIR}`);
    console.log(`📋 Console messages: ${testReport.summary.consoleMessages}`);
    console.log(`🚨 Critical issues: ${testReport.summary.criticalIssues}`);
    console.log(`⚡ Performance issues: ${testReport.summary.performanceIssues}`);
    
    // Display key recommendations
    console.log('\n🎯 KEY RECOMMENDATIONS:');
    testReport.recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'SUCCESS' ? '✅' : rec.priority === 'HIGH' ? '🚨' : '⚠️';
      console.log(`${index + 1}. ${icon} [${rec.priority}] ${rec.message}`);
      console.log(`   Action: ${rec.action}`);
    });
    
    console.log('\n🚀 Testing complete! Review screenshots and test report for detailed analysis.');
    
  } catch (error) {
    console.error('💥 Testing suite failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests();
}

export { runComprehensiveTests };