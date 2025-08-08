#!/usr/bin/env node

/**
 * Playwright Pagination Inspection
 * ================================
 * 
 * Inspects localhost to verify 30-mile distance results pagination is functioning correctly.
 * 
 * Features tested:
 * 1. POI loading and distance filtering (30-mile radius)
 * 2. Pagination controls and navigation
 * 3. Result count accuracy
 * 4. API request patterns
 * 5. Console error monitoring
 */

import { chromium } from 'playwright';

async function inspectPagination() {
  console.log('🔍 INSPECTING PAGINATION FUNCTIONALITY');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000  // Slow down for better observation
  });
  
  const page = await browser.newPage();
  
  // Monitor console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    const timestamp = new Date().toISOString();
    consoleMessages.push({
      timestamp,
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    
    // Log POI-related messages in real-time
    if (msg.text().includes('POI') || msg.text().includes('30mi') || msg.text().includes('pagination')) {
      console.log(`📋 ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });
  
  // Monitor network requests
  const apiRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('poi-locations') || request.url().includes('weather')) {
      const timestamp = new Date().toISOString();
      apiRequests.push({
        timestamp,
        url: request.url(),
        method: request.method()
      });
      console.log(`📤 API REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', (response) => {
    if (response.url().includes('poi-locations') || response.url().includes('weather')) {
      console.log(`📥 API RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌐 Loading localhost frontend...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for initial POI loading
    console.log('⏱️ Waiting for POI data to load...');
    await page.waitForTimeout(5000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'pagination-initial.png',
      fullPage: true 
    });
    console.log('📸 Initial screenshot saved: pagination-initial.png');
    
    // Check for pagination controls
    console.log('🔍 Looking for pagination controls...');
    const paginationElements = await page.$$('[class*="pagination"], [class*="MuiPagination"], .pagination, button[aria-label*="page"]');
    console.log(`📄 Found ${paginationElements.length} potential pagination elements`);
    
    // Check for result count displays
    const resultCountElements = await page.$$('text=/\\d+.*total|\\d+.*results|\\d+.*POI|\\d+.*within.*30mi/');
    console.log(`🔢 Found ${resultCountElements.length} result count displays`);
    
    for (let i = 0; i < resultCountElements.length; i++) {
      const text = await resultCountElements[i].textContent();
      console.log(`📊 Result Count ${i+1}: "${text}"`);
    }
    
    // Look for distance-related text
    const distanceElements = await page.$$('text=/30.*mi|mile|distance/');
    console.log(`📏 Found ${distanceElements.length} distance-related elements`);
    
    // Check map markers
    const markers = await page.$$('.leaflet-marker-icon, [class*="marker"]');
    console.log(`📍 Found ${markers.length} map markers`);
    
    // Test filter interaction to trigger pagination
    console.log('🎛️ Testing filter changes to trigger pagination...');
    
    // Look for filter buttons
    const filterButtons = await page.$$('button[aria-label*="filter"], button[data-testid*="filter"], .fab button');
    if (filterButtons.length > 0) {
      console.log(`🔘 Found ${filterButtons.length} filter buttons, testing interaction...`);
      
      // Click first filter button
      await filterButtons[0].click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after filter interaction
      await page.screenshot({ 
        path: 'pagination-after-filter.png',
        fullPage: true 
      });
      console.log('📸 Filter interaction screenshot saved: pagination-after-filter.png');
    }
    
    // Wait for any additional API calls
    console.log('⏱️ Monitoring for 10 seconds to capture pagination behavior...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error during inspection:', error.message);
  } finally {
    // Take final screenshot
    await page.screenshot({ 
      path: 'pagination-final.png',
      fullPage: true 
    });
    console.log('📸 Final screenshot saved: pagination-final.png');
    
    await browser.close();
  }
  
  // Analyze results
  console.log('\n📊 PAGINATION INSPECTION SUMMARY');
  console.log('===============================');
  
  console.log(`\n📋 Console Messages: ${consoleMessages.length} total`);
  const poiMessages = consoleMessages.filter(m => 
    m.text.includes('POI') || 
    m.text.includes('30mi') || 
    m.text.includes('locations') ||
    m.text.includes('pagination')
  );
  console.log(`📋 POI/Pagination Messages: ${poiMessages.length}`);
  
  poiMessages.forEach(msg => {
    console.log(`   ${msg.type}: ${msg.text}`);
  });
  
  console.log(`\n📤 API Requests: ${apiRequests.length} total`);
  apiRequests.forEach(req => {
    console.log(`   ${req.method} ${req.url}`);
  });
  
  // Check for errors
  const errors = consoleMessages.filter(m => m.type === 'error');
  if (errors.length > 0) {
    console.log(`\n❌ Console Errors: ${errors.length}`);
    errors.forEach(error => {
      console.log(`   ERROR: ${error.text}`);
    });
  } else {
    console.log('\n✅ No console errors detected');
  }
  
  console.log('\n🎯 PAGINATION INSPECTION COMPLETE');
  console.log('=================================');
}

// Run the inspection
inspectPagination().catch(console.error);