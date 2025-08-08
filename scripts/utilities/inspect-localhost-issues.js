#!/usr/bin/env node

/**
 * LOCALHOST INSPECTION - CONSOLE ERRORS & LOCATION AVATAR INVESTIGATION
 * 
 * PURPOSE: Diagnose specific issues reported by user:
 * 1. Console errors analysis
 * 2. Missing location avatar (user marker) investigation
 * 3. Visual inspection of current UI state
 * 4. Identify and provide fixes for found issues
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/home/robertspeer/Projects/screenshots';
const ANALYSIS_FILE = '/home/robertspeer/Projects/GitRepo/nearest-nice-weather/localhost-inspection-report.json';

async function inspectLocalhost() {
  console.log('🔍 LOCALHOST INSPECTION - Console Errors & Location Avatar');
  console.log('=' + '='.repeat(60));

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // Collect all console messages
  const consoleMessages = [];
  const errors = [];
  const warnings = [];
  
  page.on('console', (msg) => {
    const timestamp = new Date().toISOString();
    const messageData = {
      timestamp,
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    
    consoleMessages.push(messageData);
    
    if (msg.type() === 'error') {
      errors.push(messageData);
      console.log(`❌ ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(messageData);
      console.log(`⚠️  WARNING: ${msg.text()}`);
    }
  });

  // Collect page errors
  page.on('pageerror', (error) => {
    const errorData = {
      timestamp: new Date().toISOString(),
      type: 'pageerror',
      message: error.message,
      stack: error.stack
    };
    errors.push(errorData);
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('🌐 Loading localhost frontend...');
    await page.goto(BASE_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // Wait for initial React render
    console.log('⏱️ Waiting for React app to initialize...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'localhost-initial-state.png'),
      fullPage: false
    });
    console.log('📸 Initial screenshot captured');

    // Inspect for location avatar/marker
    console.log('\n👤 LOCATION AVATAR INVESTIGATION:');
    console.log('=' + '='.repeat(40));
    
    // Look for user location marker elements
    const userMarkerSelectors = [
      '[class*="user-marker"]',
      '[class*="location-marker"]', 
      'img[src*="user"]',
      'img[src*="location"]',
      '[aria-label*="user"]',
      '[aria-label*="location"]',
      'div:has-text("😎")', // Cool guy emoji from code
      '[class*="leaflet-marker"]'
    ];
    
    let userMarkerFound = false;
    
    for (const selector of userMarkerSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} potential user marker(s) with selector: ${selector}`);
          userMarkerFound = true;
          
          // Take screenshot of found markers
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `user-markers-found-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
            fullPage: false
          });
        }
      } catch (error) {
        // Selector not found, continue
      }
    }
    
    if (!userMarkerFound) {
      console.log('❌ No user location markers found with standard selectors');
    }

    // Check for map container
    console.log('\n🗺️ MAP CONTAINER INVESTIGATION:');
    const mapContainer = page.locator('.leaflet-container, [class*="map"], #map');
    const mapExists = await mapContainer.count() > 0;
    
    if (mapExists) {
      console.log('✅ Map container found');
      const mapRect = await mapContainer.first().boundingBox();
      console.log(`   Map dimensions: ${mapRect?.width}x${mapRect?.height}`);
    } else {
      console.log('❌ No map container found');
    }

    // Check for FAB filter system
    console.log('\n🎛️ FAB FILTER SYSTEM CHECK:');
    const fabSystem = page.locator('[class*="absolute top-6 right-6"]');
    const fabExists = await fabSystem.count() > 0;
    
    if (fabExists) {
      console.log('✅ FAB filter system found');
      
      // Check for filter buttons
      const filterButtons = page.locator('button:has-text("🌡️"), button:has-text("🌧️"), button:has-text("💨")');
      const buttonCount = await filterButtons.count();
      console.log(`   Filter buttons found: ${buttonCount}`);
    } else {
      console.log('❌ FAB filter system not found');
    }

    // Check for location permission/prompt
    console.log('\n📍 LOCATION PERMISSION CHECK:');
    const locationPrompts = page.locator('[class*="location"], div:has-text("location"), div:has-text("drag"), div:has-text("marker")');
    const promptCount = await locationPrompts.count();
    
    if (promptCount > 0) {
      console.log(`✅ Found ${promptCount} location-related UI elements`);
      
      // Get text content of location elements
      for (let i = 0; i < Math.min(promptCount, 3); i++) {
        const text = await locationPrompts.nth(i).textContent();
        console.log(`   Location element ${i + 1}: "${text?.substring(0, 100)}..."`);
      }
    } else {
      console.log('❌ No location-related UI elements found');
    }

    // Check browser location API
    console.log('\n🛰️ GEOLOCATION API CHECK:');
    const hasGeolocation = await page.evaluate(() => {
      return {
        hasNavigator: typeof navigator !== 'undefined',
        hasGeolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
        userAgent: navigator.userAgent
      };
    });
    
    console.log(`   Navigator available: ${hasGeolocation.hasNavigator}`);
    console.log(`   Geolocation API available: ${hasGeolocation.hasGeolocation}`);

    // Take final screenshot
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'localhost-inspection-complete.png'),
      fullPage: false
    });

    // Analyze console messages
    console.log('\n📊 CONSOLE ANALYSIS SUMMARY:');
    console.log('=' + '='.repeat(40));
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 TOP ERRORS:');
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error.text || error.message}`);
        if (error.location) {
          console.log(`   Location: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ TOP WARNINGS:');
      warnings.slice(0, 3).forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.text}`);
      });
    }

    // Save detailed analysis
    const analysis = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      summary: {
        consoleMessages: consoleMessages.length,
        errors: errors.length,
        warnings: warnings.length,
        userMarkerFound,
        mapExists,
        fabExists
      },
      errors: errors.slice(0, 10), // Top 10 errors
      warnings: warnings.slice(0, 5), // Top 5 warnings
      geolocationSupport: hasGeolocation,
      issues: []
    };
    
    // Identify specific issues
    if (!userMarkerFound) {
      analysis.issues.push({
        type: 'missing_user_marker',
        severity: 'high',
        description: 'User location marker/avatar not visible on map',
        possibleCauses: [
          'User location not set or detected',
          'Marker creation failing',
          'CSS positioning issues',
          'Icon loading problems'
        ]
      });
    }
    
    if (errors.length > 10) {
      analysis.issues.push({
        type: 'excessive_console_errors',
        severity: 'high',
        description: `High number of console errors (${errors.length})`,
        possibleCauses: [
          'React rendering issues',
          'API connection problems',
          'JavaScript syntax errors',
          'Dependency conflicts'
        ]
      });
    }
    
    if (!mapExists) {
      analysis.issues.push({
        type: 'map_not_loading',
        severity: 'critical',
        description: 'Map container not found',
        possibleCauses: [
          'Leaflet library not loading',
          'Component rendering failure',
          'CSS styling issues'
        ]
      });
    }
    
    await fs.writeFile(ANALYSIS_FILE, JSON.stringify(analysis, null, 2));
    console.log(`\n📋 Detailed analysis saved to: ${ANALYSIS_FILE}`);
    
    return analysis;

  } catch (error) {
    console.error('💥 Inspection failed:', error.message);
    
    // Capture error state
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'localhost-error-state.png'),
      fullPage: true
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run inspection
inspectLocalhost()
  .then((analysis) => {
    console.log('\n🎯 INSPECTION COMPLETE');
    console.log('=' + '='.repeat(40));
    console.log(`Issues found: ${analysis.issues.length}`);
    
    if (analysis.issues.length > 0) {
      console.log('\n🔧 ISSUES TO RESOLVE:');
      analysis.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
      });
      
      console.log('\n📸 Screenshots saved to:', SCREENSHOTS_DIR);
      console.log('📋 Full analysis in:', ANALYSIS_FILE);
      
      console.log('\n💡 NEXT STEPS:');
      console.log('1. Review console errors in analysis report');
      console.log('2. Check user location initialization code');
      console.log('3. Verify marker creation and positioning');
      console.log('4. Test geolocation API functionality');
    } else {
      console.log('\n✅ No critical issues found!');
    }
  })
  .catch((error) => {
    console.error('💥 Inspection script failed:', error.message);
    process.exit(1);
  });