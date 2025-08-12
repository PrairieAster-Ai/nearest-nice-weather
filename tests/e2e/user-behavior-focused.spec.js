/**
 * ========================================================================
 * USER BEHAVIOR FOCUSED TESTING - PLAYWRIGHT BEST PRACTICES
 * ========================================================================
 * 
 * @PURPOSE: Demonstrates user behavior testing vs implementation detail testing
 * @FOLLOWS: Playwright best practices - test what users do, not how it works
 * 
 * This example refactors implementation-focused tests to be user-focused
 * 
 * ========================================================================
 */

import { test, expect } from '@playwright/test'
import { MapPage } from './pages/MapPage.js'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.describe('User Behavior Focus - Best Practices', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all state for complete test independence
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

    // Set up fresh geolocation for each test
    await context.setGeolocation({ latitude: 44.9537, longitude: -93.0900 })
    await context.grantPermissions(['geolocation'])

    await page.goto(BASE_URL)
  })

  test('@smoke User can view outdoor locations on map', async ({ page }) => {
    console.log('🧪 Testing user can discover outdoor locations')
    
    // ✅ GOOD: Focus on what user sees and does
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // User should see outdoor locations
    const poiCount = await mapPage.expectPOIMarkersVisible()
    expect(poiCount).toBeGreaterThan(0)
    
    console.log(`✅ User can view ${poiCount} outdoor locations`)
    
    // ❌ AVOID: Testing implementation details like:
    // - Specific marker image sources (aster-marker.svg)
    // - CSS class names (.leaflet-marker-icon)
    // - Internal state variables
    // - Library-specific DOM structures
  })

  test('@critical User can get location details and directions', async ({ page }) => {
    console.log('🧪 Testing user can get location information')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    const poiCount = await mapPage.getPOICount()
    if (poiCount > 0) {
      // ✅ GOOD: Test user behavior - clicking on locations
      const { popup, content } = await mapPage.clickFirstPOI()
      
      // User should see location details
      await expect(popup).toBeVisible()
      const popupText = await content.textContent()
      expect(popupText).toBeTruthy()
      
      // User should be able to get directions
      const directionsUrl = await mapPage.getDirectionsURL()
      expect(directionsUrl).toBeTruthy()
      
      // User should see directions link (regardless of platform)
      // ✅ GOOD: Test that directions are available, not specific URL format
      expect(directionsUrl).toMatch(/maps|geo:|openstreetmap/)
      
      console.log('✅ User can access location details and directions')
      
      // ❌ AVOID: Testing implementation details like:
      // - Exact URL formats for different platforms
      // - Internal URL generation logic
      // - UserAgent string parsing
      // - Platform detection algorithms
    } else {
      console.log('ℹ️ No POIs available to test')
    }
  })

  test('User can interact with map controls', async ({ page }) => {
    console.log('🧪 Testing user map interactions')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // ✅ GOOD: Test user-visible behaviors
    
    // User can pan the map
    await mapPage.panMap(100, 100)
    
    // User can zoom the map
    await mapPage.zoomIn()
    
    // Map remains functional after interactions
    const mapState = await mapPage.validateMapState()
    expect(mapState.mapVisible).toBe(true)
    
    console.log('✅ User can interact with map controls')
    
    // ❌ AVOID: Testing implementation details like:
    // - Leaflet internal state
    // - Exact coordinate calculations
    // - Browser event handling details
    // - Third-party library internals
  })

  test('User receives appropriate feedback for actions', async ({ page }) => {
    console.log('🧪 Testing user feedback mechanisms')
    
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // ✅ GOOD: Test that users get feedback for their actions
    const poiCount = await mapPage.getPOICount()
    
    if (poiCount > 0) {
      // User clicks on location
      await mapPage.clickFirstPOI()
      
      // User gets immediate feedback (popup appears)
      await mapPage.expectPopupVisible()
      
      // User can dismiss feedback
      await mapPage.closePopup()
      await mapPage.expectPopupHidden()
      
      console.log('✅ User receives appropriate feedback for actions')
    }
    
    // ❌ AVOID: Testing internal feedback mechanisms like:
    // - Console logging
    // - Analytics tracking calls
    // - Error handling code paths
    // - Internal state changes
  })
})

/**
 * EXAMPLE: How to refactor implementation-detail tests
 * 
 * ❌ IMPLEMENTATION-FOCUSED (BAD):
 * - Test marker image src contains 'aster-marker.svg'
 * - Test exact URL format for different platforms
 * - Test internal state variables
 * - Test CSS class names and DOM structure
 * - Test third-party library internals
 * 
 * ✅ USER-BEHAVIOR FOCUSED (GOOD):
 * - Test user can see outdoor locations
 * - Test user can get directions (any working format)
 * - Test user receives visual feedback for actions
 * - Test user can accomplish their goals
 * - Test accessibility and usability
 */