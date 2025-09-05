/**
 * ========================================================================
 * PAGE OBJECT MODEL MIGRATION EXAMPLE - PLAYWRIGHT BEST PRACTICES
 * ========================================================================
 *
 * @PURPOSE: Shows how to migrate existing tests to use Page Object Model
 * @FOLLOWS: Playwright best practices for maintainable test suites
 *
 * This example demonstrates before/after test refactoring using Page Objects
 *
 * ========================================================================
 */

import { test, expect } from '@playwright/test'
import { MapPage } from './pages/MapPage.js'
import { FilterPage } from './pages/FilterPage.js'
import { FeedbackPage } from './pages/FeedbackPage.js'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.describe('Page Object Migration Examples', () => {
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

  /**
   * MIGRATION EXAMPLE 1: Map Testing
   *
   * ❌ BEFORE (without Page Objects):
   * - Scattered locators throughout test
   * - Repeated wait logic
   * - Direct DOM manipulation
   * - Hard to maintain
   */
  test('@migration-example Map testing - BEFORE refactor (demo only)', async ({ page }) => {
    // ❌ OLD WAY: Scattered locators and repeated logic
    // await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    // const markers = await page.locator('.leaflet-marker-icon').all()
    // await markers[0].click()
    // await page.waitForSelector('.leaflet-popup')
    // const popup = page.locator('.leaflet-popup')
    // const directionsLink = popup.locator('a[href*="directions"]')
    // await directionsLink.click()

    console.log('🚫 OLD WAY: Scattered locators, hard to maintain')
  })

  test('@migration-example Map testing - AFTER refactor', async ({ page }) => {
    console.log('🧪 Testing map functionality with Page Objects')

    // ✅ NEW WAY: Clean, maintainable Page Object usage
    const mapPage = new MapPage(page)

    await mapPage.waitForMapReady()
    const poiCount = await mapPage.expectPOIMarkersVisible()

    if (poiCount > 0) {
      const { popup } = await mapPage.clickFirstPOI()
      await expect(popup).toBeVisible()

      const directionsUrl = await mapPage.getDirectionsURL()
      expect(directionsUrl).toBeTruthy()

      await mapPage.closePopup()
    }

    console.log('✅ NEW WAY: Clean Page Object usage, highly maintainable')
  })

  /**
   * MIGRATION EXAMPLE 2: Filter Testing
   */
  test('@migration-example Filter testing - AFTER refactor', async ({ page }) => {
    console.log('🧪 Testing weather filters with Page Objects')

    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)

    await mapPage.waitForMapReady()

    // Clean, readable filter interactions
    await filterPage.expectFiltersVisible()
    await filterPage.selectTemperature('hot')
    await filterPage.waitForFilterUpdate()

    // Verify filter state
    const currentTemp = await filterPage.getCurrentTemperature()
    expect(currentTemp).toBe('hot')

    console.log('✅ Filter testing with Page Objects is clean and readable')
  })

  /**
   * MIGRATION EXAMPLE 3: Cross-Component Workflow
   */
  test('@migration-example Complete user workflow', async ({ page }) => {
    console.log('🧪 Testing complete user workflow with Page Objects')

    // Multiple Page Objects work together seamlessly
    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)
    const feedbackPage = new FeedbackPage(page)

    // User journey: Filter → Explore → Feedback
    await mapPage.waitForMapReady()

    // 1. User sets weather preferences
    await filterPage.setWeatherPreferences({
      temperature: 'mild',
      precipitation: 'none'
    })

    // 2. User explores locations
    const poiCount = await mapPage.getPOICount()
    if (poiCount > 0) {
      await mapPage.clickFirstPOI()
      await mapPage.expectPopupVisible()
      await mapPage.closePopup()
    }

    // 3. User provides feedback
    await feedbackPage.openFeedback()
    await feedbackPage.submitCompleteFeedback({
      rating: 5,
      categories: ['general'],
      comment: 'Great outdoor spots!'
    })
    await feedbackPage.expectSuccessMessage()

    console.log('✅ Complete user workflow with Page Objects is elegant and maintainable')
  })

  /**
   * MIGRATION EXAMPLE 4: Error Handling
   */
  test('Error handling with Page Objects', async ({ page }) => {
    console.log('🧪 Testing error handling with Page Objects')

    const mapPage = new MapPage(page)

    // Page Objects handle edge cases gracefully
    await mapPage.waitForMapReady()

    const mapState = await mapPage.validateMapState()
    expect(mapState.mapVisible).toBe(true)

    // If no POIs, Page Object handles it gracefully
    const poiCount = await mapPage.getPOICount()
    if (poiCount === 0) {
      console.log('ℹ️ No POIs available - Page Object handled gracefully')
    } else {
      console.log(`✅ ${poiCount} POIs available`)
    }

    console.log('✅ Error handling with Page Objects is robust')
  })
})

/**
 * MIGRATION BENEFITS DEMONSTRATED:
 *
 * 1. MAINTAINABILITY:
 *    - Locators centralized in Page Objects
 *    - Changes to UI only require Page Object updates
 *    - Tests become more readable and concise
 *
 * 2. REUSABILITY:
 *    - Common actions shared across tests
 *    - Consistent patterns for similar operations
 *    - Less code duplication
 *
 * 3. RELIABILITY:
 *    - Smart waiting built into Page Object methods
 *    - Error handling centralized
 *    - Consistent interaction patterns
 *
 * 4. READABILITY:
 *    - Tests read like user stories
 *    - Business logic clear and separated
 *    - Technical details abstracted away
 */

test.describe('Page Object Best Practices Summary', () => {
  test('Comprehensive Page Object usage example', async ({ page }) => {
    console.log('🎯 Demonstrating comprehensive Page Object usage')

    // Initialize all Page Objects
    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)
    const feedbackPage = new FeedbackPage(page)

    // Step 1: Setup and validation
    await mapPage.goto() // Page Object handles navigation and waiting

    // Step 2: User preferences
    await filterPage.waitForFiltersVisible()
    const initialFilters = await filterPage.getAllCurrentFilters()
    console.log(`Initial filter state:`, initialFilters)

    // Step 3: Map interaction
    const loadTime = await mapPage.measureLoadTime()
    console.log(`Map load time: ${loadTime}ms`)

    // Step 4: Performance validation
    const memoryUsage = await mapPage.getMemoryUsage()
    if (memoryUsage) {
      console.log(`Memory usage: ${(memoryUsage.used / 1024 / 1024).toFixed(2)}MB`)
    }

    // Step 5: Cross-component workflow
    await filterPage.selectTemperature('mild')
    const updatedFilters = await filterPage.getAllCurrentFilters()
    expect(updatedFilters.temperature).toBe('mild')

    // Step 6: User feedback
    const formOpenTime = await feedbackPage.measureFormOpenTime()
    console.log(`Feedback form open time: ${formOpenTime}ms`)

    await feedbackPage.closeFeedback()

    console.log('✅ Comprehensive Page Object demonstration complete')
  })
})
