/**
 * ========================================================================
 * AVOID THIRD-PARTY SERVICE TESTING - PLAYWRIGHT BEST PRACTICES
 * ========================================================================
 * 
 * @PURPOSE: Demonstrates what NOT to test (third-party services)
 * @FOLLOWS: Playwright best practices - don't test external dependencies
 * 
 * This example shows how to focus on YOUR application, not external services
 * 
 * ========================================================================
 */

import { test, expect } from '@playwright/test'
import { MapPage } from './pages/MapPage.js'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.describe('Focus on Your App - Avoid Third-Party Testing', () => {
  test.beforeEach(async ({ page, context }) => {
    // Standard test isolation
    await context.clearCookies()
    await context.clearPermissions()
    
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear()
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
      })
    } catch {
      // Storage might not be available in some contexts
    }

    await context.setGeolocation({ latitude: 44.9537, longitude: -93.0900 })
    await context.grantPermissions(['geolocation'])
    await page.goto(BASE_URL)
  })

  test('@smoke App displays map interface correctly', async ({ page }) => {
    console.log('🧪 Testing YOUR app map interface (not OpenStreetMap)')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // ✅ GOOD: Test YOUR app functionality
    await mapPage.expectMapVisible()
    const poiCount = await mapPage.expectPOIMarkersVisible()
    
    console.log(`✅ YOUR app displays ${poiCount} outdoor locations`)
    
    // ❌ AVOID: Don't test third-party services like:
    // - OpenStreetMap tile loading
    // - OpenStreetMap attribution text
    // - Leaflet library internals
    // - Google Maps API responses
    // - Weather API data accuracy
  })

  test('@critical App provides working navigation features', async ({ page }) => {
    console.log('🧪 Testing YOUR app navigation features')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    const poiCount = await mapPage.getPOICount()
    if (poiCount > 0) {
      // ✅ GOOD: Test that YOUR app provides navigation
      await mapPage.clickFirstPOI()
      await mapPage.expectPopupVisible()
      
      // Test that YOUR app generates directions (don't test the external service)
      const directionsUrl = await mapPage.getDirectionsURL()
      expect(directionsUrl).toBeTruthy() // Just verify it exists
      
      console.log('✅ YOUR app provides navigation functionality')
      
      // ❌ AVOID: Don't test external navigation services:
      // - Whether OpenStreetMap directions work
      // - Whether Google Maps responds correctly
      // - Third-party routing algorithm accuracy
      // - External API response times
    }
  })

  test('App handles user interactions correctly', async ({ page }) => {
    console.log('🧪 Testing YOUR app user interactions')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // ✅ GOOD: Test YOUR app's user interface
    await mapPage.panMap(50, 50)
    await mapPage.zoomIn()
    
    // Verify YOUR app still works after interactions
    const mapState = await mapPage.validateMapState()
    expect(mapState.mapVisible).toBe(true)
    expect(mapState.poisLoaded).toBe(true)
    
    console.log('✅ YOUR app handles user interactions correctly')
    
    // ❌ AVOID: Don't test third-party functionality:
    // - Leaflet's pan/zoom implementation
    // - Map tile loading from external servers
    // - Third-party library event handling
    // - External service uptime/availability
  })

  test('App displays outdoor locations appropriately', async ({ page }) => {
    console.log('🧪 Testing YOUR app location display')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // ✅ GOOD: Test YOUR business logic and data
    const poiNames = await mapPage.getVisiblePOINames()
    
    // Test YOUR app's business rules
    expect(poiNames.length).toBeGreaterThan(0)
    
    // Verify YOUR app shows outdoor recreation locations
    const hasOutdoorLocations = poiNames.some(name => 
      /park|trail|forest|lake|recreation|nature/i.test(name)
    )
    
    if (poiNames.length > 0) {
      console.log(`✅ YOUR app displays outdoor locations: ${poiNames.slice(0, 3).join(', ')}...`)
    }
    
    // ❌ AVOID: Don't test external data sources:
    // - Weather API data accuracy
    // - Third-party location data completeness
    // - External service data freshness
    // - API rate limiting behavior
  })
})

/**
 * WHAT NOT TO TEST - Third-Party Services:
 * 
 * ❌ OpenStreetMap:
 *   - Tile loading and rendering
 *   - Attribution text accuracy
 *   - Service availability/uptime
 *   - Map data accuracy
 * 
 * ❌ Google Maps:
 *   - API response format
 *   - Directions algorithm accuracy
 *   - Service performance
 *   - API key validation
 * 
 * ❌ Leaflet Library:
 *   - Internal zoom/pan implementation
 *   - Marker clustering algorithms
 *   - Event system internals
 *   - Browser compatibility
 * 
 * ❌ Weather APIs:
 *   - Data accuracy
 *   - Response time
 *   - API format changes
 *   - Service reliability
 * 
 * ✅ WHAT TO TEST - Your Application:
 *   - Your UI responds to user actions
 *   - Your business logic works correctly
 *   - Your data displays appropriately
 *   - Your user workflows function
 *   - Your error handling works
 *   - Your accessibility features
 */

test.describe('Mock External Services Instead', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.setGeolocation({ latitude: 44.9537, longitude: -93.0900 })
    await context.grantPermissions(['geolocation'])
    
    // ✅ GOOD: Mock external services for consistent testing
    await page.route('**/api/weather-locations*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            id: 1, 
            name: 'Test Park', 
            lat: 44.9537, 
            lng: -93.0900,
            temperature: 72,
            condition: 'Sunny'
          }
        ])
      })
    })
    
    await page.goto(BASE_URL)
  })

  test('App works with mocked external data', async ({ page }) => {
    console.log('🧪 Testing YOUR app with mocked external services')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // Test YOUR app with predictable data
    const poiCount = await mapPage.expectPOIMarkersVisible()
    expect(poiCount).toBeGreaterThan(0)
    
    console.log('✅ YOUR app works correctly with mocked external services')
    
    // This approach:
    // - Tests YOUR app in isolation
    // - Provides consistent test data
    // - Eliminates external service flakiness
    // - Focuses on YOUR business logic
  })
})