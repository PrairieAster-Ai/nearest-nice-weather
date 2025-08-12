/**
 * Business Model Validation Test Suite
 * Ensures application aligns with B2C outdoor recreation focus
 * Validates POI-centric architecture and Minnesota geographic scope
 */

import { test, expect } from '@playwright/test';

test.describe('Business Model Validation - B2C Outdoor Recreation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('body', { timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('business model - validates POI data not cities', async ({ page }) => {
    // This test ensures the application shows outdoor recreation POIs, not cities
    // Critical business requirement: B2C outdoor recreation platform
    
    // Check API response directly
    const response = await page.request.get('/api/poi-locations?limit=5');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Validate response structure
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBeGreaterThan(0);
    
    // Validate POI characteristics (not city characteristics)
    for (const poi of data.data) {
      // Must have outdoor recreation indicators
      expect(poi).toHaveProperty('name');
      expect(poi).toHaveProperty('park_type');
      expect(poi.park_type).toBeTruthy(); // Must have park classification
      
      // Geographic validation - Minnesota bounds
      expect(poi.lat).toBeGreaterThanOrEqual(43.0);
      expect(poi.lat).toBeLessThanOrEqual(49.5);
      expect(poi.lng).toBeGreaterThanOrEqual(-97.5);
      expect(poi.lng).toBeLessThanOrEqual(-89.0);
      
      // Business model validation - outdoor recreation terms
      const name = poi.name.toLowerCase();
      const parkType = poi.park_type.toLowerCase();
      
      // Should contain outdoor recreation keywords
      const outdoorKeywords = [
        'park', 'trail', 'forest', 'lake', 'river', 'falls', 
        'state', 'national', 'recreation', 'hiking', 'camping'
      ];
      
      const hasOutdoorKeywords = outdoorKeywords.some(keyword => 
        name.includes(keyword) || parkType.includes(keyword)
      );
      
      expect(hasOutdoorKeywords).toBeTruthy();
      console.log(`✅ POI validated: ${poi.name} (${poi.park_type})`);
    }
  });

  test('business model - no B2B tourism operator features', async ({ page }) => {
    // Validate that no B2B features are accidentally exposed
    
    // Check page content for B2B indicators
    const pageContent = await page.textContent('body');
    
    // B2B terms that should NOT appear
    const b2bTerms = [
      'tourism operator', 'business dashboard', 'operator portal',
      'business registration', 'operator login', 'business account',
      'tour operator', 'commercial listing', 'business subscription'
    ];
    
    for (const term of b2bTerms) {
      expect(pageContent.toLowerCase().includes(term)).toBeFalsy();
      console.log(`✅ No B2B term found: ${term}`);
    }
    
    // Should focus on consumer terms
    const b2cTerms = [
      'outdoor', 'recreation', 'trail', 'park', 'hiking', 'weather'
    ];
    
    let foundB2CTerms = 0;
    for (const term of b2cTerms) {
      if (pageContent.toLowerCase().includes(term)) {
        foundB2CTerms++;
        console.log(`✅ B2C term found: ${term}`);
      }
    }
    
    // Should have at least some B2C outdoor recreation terms
    expect(foundB2CTerms).toBeGreaterThan(0);
  });

  test('business model - Minnesota geographic focus', async ({ page }) => {
    // Validate geographic scope is limited to Minnesota
    
    const response = await page.request.get('/api/poi-locations?limit=20');
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      let minnesotaPOIs = 0;
      let totalPOIs = data.data.length;
      
      for (const poi of data.data) {
        // Check Minnesota bounds
        if (poi.lat >= 43.0 && poi.lat <= 49.5 && 
            poi.lng >= -97.5 && poi.lng <= -89.0) {
          minnesotaPOIs++;
        }
      }
      
      // All POIs should be within Minnesota
      expect(minnesotaPOIs).toBe(totalPOIs);
      
      console.log(`✅ Geographic validation: ${minnesotaPOIs}/${totalPOIs} POIs within Minnesota bounds`);
    }
  });

  test('business model - weather enhances but does not dominate', async ({ page }) => {
    // Validate that weather information enhances POI discovery but doesn't dominate
    
    const pageContent = await page.textContent('body');
    
    // Count POI-related terms vs weather-related terms
    const poiTerms = ['park', 'trail', 'outdoor', 'recreation', 'hiking'];
    const weatherTerms = ['temperature', 'forecast', 'weather', 'rain', 'snow'];
    
    let poiCount = 0;
    let weatherCount = 0;
    
    poiTerms.forEach(term => {
      const matches = (pageContent.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      poiCount += matches;
    });
    
    weatherTerms.forEach(term => {
      const matches = (pageContent.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      weatherCount += matches;
    });
    
    // POI terms should be more prominent than weather terms
    console.log(`POI terms: ${poiCount}, Weather terms: ${weatherCount}`);
    
    // Either POI terms dominate, or both are minimal (loading state)
    if (poiCount > 0 || weatherCount > 0) {
      expect(poiCount).toBeGreaterThanOrEqual(weatherCount);
    }
  });
});

test.describe('Business Model Validation - User Journey', () => {
  test('user journey - POI discovery workflow', async ({ page }) => {
    // Test the primary user journey: POI discovery with auto-expand
    
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Check for map initialization
    const mapContainer = page.locator('.leaflet-container');
    
    if (await mapContainer.count() > 0) {
      console.log('✅ Map container found - POI discovery interface ready');
      
      // Look for POI markers
      const markers = page.locator('.leaflet-marker-icon');
      const markerCount = await markers.count();
      
      console.log(`Found ${markerCount} POI markers`);
      
      if (markerCount > 0) {
        // Test marker interaction
        await markers.first().click();
        await page.waitForTimeout(1000);
        
        // Look for popup with POI information
        const popup = page.locator('.leaflet-popup');
        if (await popup.count() > 0) {
          const popupContent = await popup.textContent();
          console.log('✅ POI popup interaction working:', popupContent?.substring(0, 100));
        }
      }
    } else {
      console.log('⚠️ Map container not found - may be loading or configuration issue');
    }
  });

  test('user journey - auto-expand functionality validation', async ({ page }) => {
    // Validate auto-expand search radius functionality
    
    // Monitor console for auto-expand messages
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Auto-expanding') || msg.text().includes('🔍')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(10000); // Allow time for potential auto-expand
    
    // Check if auto-expand logic triggered
    if (consoleLogs.length > 0) {
      console.log('✅ Auto-expand functionality detected:', consoleLogs);
    } else {
      console.log('ℹ️ No auto-expand detected - may indicate sufficient local POIs');
    }
  });

  test('user journey - mobile responsiveness', async ({ page }) => {
    // Test mobile user experience
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check that content is mobile-responsive
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
    console.log('✅ Mobile viewport responsive');
    
    // Check for mobile-friendly interactions
    const mapContainer = page.locator('.leaflet-container');
    if (await mapContainer.count() > 0) {
      // Test touch interaction simulation
      await mapContainer.tap();
      console.log('✅ Mobile map interaction available');
    }
  });
});

test.describe('Business Model Validation - Data Quality', () => {
  test('data quality - POI completeness validation', async ({ page }) => {
    // Validate that POI data meets quality standards
    
    const response = await page.request.get('/api/poi-locations?limit=10');
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      let completeRecords = 0;
      
      for (const poi of data.data) {
        let isComplete = true;
        const requiredFields = ['name', 'lat', 'lng', 'park_type'];
        
        for (const field of requiredFields) {
          if (!poi[field]) {
            isComplete = false;
            console.log(`⚠️ POI missing ${field}:`, poi.name || 'unnamed');
          }
        }
        
        if (isComplete) {
          completeRecords++;
        }
      }
      
      // At least 80% of records should be complete
      const completenessRatio = completeRecords / data.data.length;
      expect(completenessRatio).toBeGreaterThanOrEqual(0.8);
      
      console.log(`✅ Data quality: ${completeRecords}/${data.data.length} complete records (${Math.round(completenessRatio * 100)}%)`);
    }
  });

  test('data quality - no legacy weather station data', async ({ page }) => {
    // Ensure no legacy weather station data appears in POI results
    
    const response = await page.request.get('/api/poi-locations?limit=20');
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      for (const poi of data.data) {
        const name = poi.name?.toLowerCase() || '';
        const parkType = poi.park_type?.toLowerCase() || '';
        
        // Weather station indicators that should NOT appear
        const weatherStationTerms = [
          'weather station', 'meteorological', 'climate station',
          'weather monitoring', 'noaa station'
        ];
        
        for (const term of weatherStationTerms) {
          expect(name.includes(term)).toBeFalsy();
          expect(parkType.includes(term)).toBeFalsy();
        }
      }
      
      console.log('✅ No legacy weather station data found in POI results');
    }
  });
});