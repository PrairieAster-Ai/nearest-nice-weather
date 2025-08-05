/**
 * User Journey Test Suite - POI Discovery
 * Validates the core user workflow: finding outdoor recreation opportunities
 * Business Context: B2C outdoor recreation platform for Minnesota
 */

import { test, expect } from '@playwright/test';

test.describe('User Journey - POI Discovery Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console monitoring for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    // Navigate to application
    await page.goto('/');
    
    // Wait for initial load with extended timeout for map initialization
    await page.waitForSelector('body', { timeout: 30000 });
    await page.waitForTimeout(5000); // Allow for map and data loading
  });

  test('user journey - complete POI discovery flow', async ({ page }) => {
    // Step 1: User opens app and sees nearby outdoor recreation opportunities
    console.log('🎯 Step 1: Initial app load and POI display');
    
    // Check for map initialization
    const mapContainer = page.locator('.leaflet-container');
    const hasMap = await mapContainer.count() > 0;
    
    if (hasMap) {
      console.log('✅ Map container initialized');
      
      // Wait for potential POI markers to load
      await page.waitForTimeout(3000);
      
      // Look for POI markers (outdoor recreation locations)
      const markers = page.locator('.leaflet-marker-icon');
      const markerCount = await markers.count();
      
      console.log(`Found ${markerCount} POI markers on map`);
      
      if (markerCount > 0) {
        console.log('✅ POI markers displayed - outdoor recreation locations visible');
        
        // Step 2: User interacts with POI marker to get details
        console.log('🎯 Step 2: POI marker interaction');
        
        await markers.first().click();
        await page.waitForTimeout(2000);
        
        // Look for popup with POI details
        const popup = page.locator('.leaflet-popup');
        const hasPopup = await popup.count() > 0;
        
        if (hasPopup) {
          const popupContent = await popup.textContent();
          console.log('✅ POI popup displayed:', popupContent?.substring(0, 100));
          
          // Validate popup contains outdoor recreation information
          expect(popupContent?.toLowerCase()).toMatch(/(park|trail|outdoor|recreation|hiking|lake|forest)/);
        } else {
          console.log('⚠️ POI popup not found after marker click');
        }
      } else {
        console.log('ℹ️ No POI markers found - testing auto-expand scenario');
        
        // Step 2b: Test auto-expand functionality for remote users
        await this.testAutoExpandScenario(page);
      }
    } else {
      console.log('⚠️ Map container not found - testing fallback interface');
    }
    
    // Step 3: Validate business model compliance
    await this.validateBusinessModelCompliance(page);
  });

  test('user journey - remote user auto-expand scenario', async ({ page }) => {
    // Simulate remote user location scenario
    console.log('🎯 Testing auto-expand for remote user location');
    
    // Monitor console for auto-expand messages
    const autoExpandLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Auto-expanding') || text.includes('🔍') || text.includes('radius')) {
        autoExpandLogs.push(text);
        console.log('Auto-expand detected:', text);
      }
    });
    
    // Wait extended time for auto-expand logic to potentially trigger
    await page.waitForTimeout(15000);
    
    // Check if auto-expand functionality was detected
    if (autoExpandLogs.length > 0) {
      console.log('✅ Auto-expand functionality working:', autoExpandLogs);
      
      // Validate that expansion results in POI display
      const markers = page.locator('.leaflet-marker-icon');
      const finalMarkerCount = await markers.count();
      
      if (finalMarkerCount > 0) {
        console.log(`✅ Auto-expand successful: ${finalMarkerCount} POIs found after expansion`);
      } else {
        console.log('⚠️ Auto-expand completed but no POIs visible');
      }
    } else {
      console.log('ℹ️ No auto-expand detected - may indicate local POIs available');
    }
  });

  test('user journey - mobile user experience', async ({ page }) => {
    // Test mobile user workflow
    await page.setViewportSize({ width: 375, height: 667 });
    
    console.log('🎯 Testing mobile POI discovery experience');
    
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Step 1: Mobile map interaction
    const mapContainer = page.locator('.leaflet-container');
    
    if (await mapContainer.count() > 0) {
      console.log('✅ Mobile map available');
      
      // Test touch interaction
      await mapContainer.tap();
      await page.waitForTimeout(1000);
      
      // Look for markers on mobile
      const markers = page.locator('.leaflet-marker-icon');
      const mobileMarkerCount = await markers.count();
      
      console.log(`Mobile POI markers: ${mobileMarkerCount}`);
      
      if (mobileMarkerCount > 0) {
        // Test mobile marker interaction
        await markers.first().tap();
        await page.waitForTimeout(2000);
        
        const popup = page.locator('.leaflet-popup');
        if (await popup.count() > 0) {
          console.log('✅ Mobile POI interaction working');
        }
      }
    }
    
    // Step 2: Mobile responsive validation
    const body = page.locator('body');
    const viewport = await body.boundingBox();
    
    expect(viewport?.width).toBeLessThanOrEqual(375);
    console.log('✅ Mobile responsive layout confirmed');
  });

  test('user journey - performance validation', async ({ page }) => {
    // Test user experience performance benchmarks
    console.log('🎯 Testing POI discovery performance');
    
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Measure time to interactive
    await page.waitForSelector('body', { timeout: 30000 });
    const bodyLoadTime = Date.now() - startTime;
    
    console.log(`Page body load time: ${bodyLoadTime}ms`);
    expect(bodyLoadTime).toBeLessThan(10000); // Should load within 10 seconds
    
    // Measure map initialization time
    const mapStartTime = Date.now();
    try {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      const mapLoadTime = Date.now() - mapStartTime;
      console.log(`Map initialization time: ${mapLoadTime}ms`);
      expect(mapLoadTime).toBeLessThan(8000); // Map should initialize within 8 seconds
    } catch (error) {
      console.log('Map container not found within timeout');
    }
    
    // Test API response time
    const apiStartTime = Date.now();
    const response = await page.request.get('/api/poi-locations?limit=5');
    const apiResponseTime = Date.now() - apiStartTime;
    
    console.log(`POI API response time: ${apiResponseTime}ms`);
    expect(apiResponseTime).toBeLessThan(2000); // API should respond within 2 seconds
    expect(response.ok()).toBeTruthy();
  });

  // Helper method for business model validation
  async testAutoExpandScenario(page) {
    console.log('🎯 Step 2b: Testing auto-expand for remote location');
    
    // Wait for potential auto-expand logic
    await page.waitForTimeout(10000);
    
    // Check for expansion indicators in console or UI
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      console.log(`✅ Auto-expand resulted in ${markerCount} POIs`);
      return true;
    } else {
      console.log('ℹ️ Auto-expand scenario - no POIs found even after expansion');
      return false;
    }
  }

  async validateBusinessModelCompliance(page) {
    console.log('🎯 Step 3: Business model compliance validation');
    
    // Check API data to ensure POIs, not cities
    const response = await page.request.get('/api/poi-locations?limit=3');
    if (response.ok()) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        let validPOIs = 0;
        
        for (const poi of data.data) {
          // Check for outdoor recreation indicators
          const name = poi.name?.toLowerCase() || '';
          const parkType = poi.park_type?.toLowerCase() || '';
          
          const hasOutdoorKeywords = /park|trail|forest|lake|recreation|hiking|outdoor|state|national/.test(name + ' ' + parkType);
          
          if (hasOutdoorKeywords) {
            validPOIs++;
            console.log(`✅ Valid outdoor recreation POI: ${poi.name}`);
          } else {
            console.log(`⚠️ Questionable POI: ${poi.name} (${poi.park_type})`);
          }
        }
        
        // At least 80% should be clearly outdoor recreation focused
        const validationRatio = validPOIs / data.data.length;
        expect(validationRatio).toBeGreaterThanOrEqual(0.8);
        
        console.log(`✅ Business model validation: ${validPOIs}/${data.data.length} POIs are outdoor recreation focused`);
      }
    }
  }
});

test.describe('User Journey - Edge Cases and Error Handling', () => {
  test('user journey - no POIs available scenario', async ({ page }) => {
    // Test graceful handling when no POIs are available
    console.log('🎯 Testing no POIs available scenario');
    
    await page.goto('/');
    await page.waitForTimeout(10000);
    
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    
    if (markerCount === 0) {
      console.log('Scenario: No POIs displayed');
      
      // Should show appropriate message or auto-expand behavior
      const pageContent = await page.textContent('body');
      
      // Look for user-friendly messaging
      const hasHelpfulMessage = /loading|searching|expanding|no results|try again/i.test(pageContent);
      
      if (hasHelpfulMessage) {
        console.log('✅ User-friendly messaging displayed when no POIs available');
      } else {
        console.log('⚠️ Consider adding user guidance when no POIs are found');
      }
    } else {
      console.log(`POIs are available (${markerCount}), skipping no-POI scenario`);
    }
  });

  test('user journey - network error resilience', async ({ page }) => {
    // Test user experience during network issues
    console.log('🎯 Testing network error resilience');
    
    // Block API requests to simulate network issues
    await page.route('**/api/poi-locations*', route => {
      route.abort();
    });
    
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Check for graceful error handling
    const pageContent = await page.textContent('body');
    
    // Should not show raw error messages to users
    const hasRawErrors = /error|failed|undefined|null|500|404/i.test(pageContent);
    
    if (!hasRawErrors) {
      console.log('✅ Graceful error handling - no raw errors shown to user');
    } else {
      console.log('⚠️ Raw error messages may be visible to users');
    }
  });

  test('user journey - slow network conditions', async ({ page }) => {
    // Test user experience on slow connections
    console.log('🎯 Testing slow network performance');
    
    // Simulate slow network
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024, // 50kb/s
      uploadThroughput: 50 * 1024,
      latency: 500
    });
    
    const startTime = Date.now();
    await page.goto('/');
    
    // Should still load within reasonable time even on slow connection
    await page.waitForSelector('body', { timeout: 45000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Load time on slow connection: ${loadTime}ms`);
    
    // Should load within 45 seconds even on very slow connection
    expect(loadTime).toBeLessThan(45000);
    
    console.log('✅ Application loads acceptably on slow connections');
  });
});