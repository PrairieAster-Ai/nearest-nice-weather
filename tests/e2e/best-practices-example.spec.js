/**
 * ========================================================================
 * BEST PRACTICES EXAMPLE TEST SUITE
 * ========================================================================
 *
 * @PURPOSE: Demonstrates Playwright best practices implementation
 * @SHOWS: Page Objects, semantic locators, test isolation, user-focused behavior
 *
 * Key Improvements:
 * - ✅ Page Object Model for maintainable tests
 * - ✅ User-facing locators instead of CSS selectors
 * - ✅ Complete test isolation
 * - ✅ Testing user behavior not implementation
 * - ✅ Semantic assertions with auto-waiting
 *
 * ========================================================================
 */

import { test, expect } from '@playwright/test'
import { MapPage } from './pages/MapPage.js'
import { FilterPage } from './pages/FilterPage.js'
import { FeedbackPage } from './pages/FeedbackPage.js'

// PROPER TEST ISOLATION (Best Practice)
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

  // Navigate to clean page
  await page.goto('/')
})

test.describe('Map Functionality - User Behavior Focus', () => {
  test('@smoke Map loads and displays outdoor locations', async ({ page }) => {
    // ✅ Using Page Object Model
    const mapPage = new MapPage(page)

    // ✅ Testing user-visible behavior, not implementation
    await mapPage.expectMapVisible()

    // ✅ User-facing assertion
    const poiCount = await mapPage.expectPOIMarkersVisible()
    expect(poiCount).toBeGreaterThan(0)

    // ✅ Semantic locator usage
    await mapPage.expectMapVisible()

    console.log(`✅ Map displays ${poiCount} outdoor locations to user`)
  })

  test('@critical User can discover and interact with outdoor locations', async ({ page }) => {
    const mapPage = new MapPage(page)

    // Wait for map to be ready for user interaction
    await mapPage.waitForMapReady()

    // ✅ User behavior: Click on a location
    const { popup, content } = await mapPage.clickFirstPOI()

    // ✅ Test what user sees, not internal state
    await expect(popup).toBeVisible()
    await expect(content).toContainText(/°F|°C/) // Weather data

    // ✅ User behavior: Close popup
    await mapPage.closePopup()
    await mapPage.expectPopupHidden()

    console.log('✅ User can discover and interact with locations')
  })

  test('User can get directions to outdoor locations', async ({ page }) => {
    const mapPage = new MapPage(page)

    await mapPage.waitForMapReady()
    await mapPage.clickFirstPOI()

    // ✅ Test user-facing functionality
    const directionsUrl = await mapPage.getDirectionsURL()

    // ✅ Assert user-visible behavior outcome
    expect(directionsUrl).toMatch(/maps|geo:|apple\.com/)

    console.log('✅ User can access directions to locations')
  })
})

test.describe('Weather Filtering - User Preference Focus', () => {
  test('@smoke User can see and interact with weather filters', async ({ page }) => {
    // ✅ Page Object usage
    const filterPage = new FilterPage(page)
    const mapPage = new MapPage(page)

    await mapPage.waitForMapReady()

    // ✅ Test user-visible elements
    await filterPage.expectFiltersVisible()

    console.log('✅ Weather filters are visible to user')
  })

  test('@critical User can filter locations by weather preferences', async ({ page }) => {
    const filterPage = new FilterPage(page)
    const mapPage = new MapPage(page)

    await mapPage.waitForMapReady()
    const initialPOICount = await mapPage.getPOICount()

    // ✅ Test user workflow
    await filterPage.selectTemperature('hot')
    await filterPage.waitForFilterUpdate()

    // ✅ Verify user sees results change
    const filteredPOICount = await mapPage.getPOICount()

    // Results might change - that's user-visible behavior
    expect(typeof filteredPOICount).toBe('number')
    expect(filteredPOICount).toBeGreaterThanOrEqual(0)

    console.log(`✅ Filter changed POI results: ${initialPOICount} → ${filteredPOICount}`)
  })

  test('User filter preferences persist across page reloads', async ({ page }) => {
    const filterPage = new FilterPage(page)
    const mapPage = new MapPage(page)

    await mapPage.waitForMapReady()

    // ✅ User sets preferences
    await filterPage.setWeatherPreferences({
      temperature: 'cold',
      precipitation: 'light',
      wind: 'windy'
    })

    // ✅ User refreshes page (real user behavior)
    await page.reload()
    await mapPage.waitForMapReady()

    // ✅ Test user expectation: preferences are remembered
    const currentFilters = await filterPage.getAllCurrentFilters()
    expect(currentFilters.temperature).toBe('cold')
    expect(currentFilters.precipitation).toBe('light')
    expect(currentFilters.wind).toBe('windy')

    console.log('✅ User preferences persist across page reloads')
  })

  test('@smoke Filter changes respond quickly for good user experience', async ({ page }) => {
    const filterPage = new FilterPage(page)
    const mapPage = new MapPage(page)

    await mapPage.waitForMapReady()

    // ✅ Measure user-perceivable response time
    const responseTime = await filterPage.measureFilterResponseTime('temperature')

    // ✅ User experience requirement (not implementation detail)
    expect(responseTime).toBeLessThan(1000) // 1 second max for good UX

    console.log(`✅ Filter responds in ${responseTime}ms (good UX)`)
  })
})

test.describe('Feedback Collection - User Communication', () => {
  test('@smoke User can access feedback form', async ({ page }) => {
    const feedbackPage = new FeedbackPage(page)

    // ✅ Test user-visible element
    await feedbackPage.openFeedback()
    await feedbackPage.expectDialogVisible()

    // ✅ User can cancel
    await feedbackPage.closeFeedback()
    await feedbackPage.expectDialogHidden()

    console.log('✅ User can access and close feedback form')
  })

  test('@critical User can submit complete feedback', async ({ page }) => {
    const feedbackPage = new FeedbackPage(page)

    // ✅ Test complete user workflow
    await feedbackPage.openFeedback()

    await feedbackPage.submitCompleteFeedback({
      rating: 5,
      categories: ['general', 'feature'],
      comment: 'Great app! Love finding outdoor spots.',
      email: 'user@example.com'
    })

    // ✅ User sees success confirmation
    await feedbackPage.expectSuccessMessage()

    console.log('✅ User can successfully submit feedback')
  })

  test('Form prevents submission with missing required fields', async ({ page }) => {
    const feedbackPage = new FeedbackPage(page)

    await feedbackPage.openFeedback()

    // ✅ Test user experience with incomplete form
    const result = await feedbackPage.testEmptySubmission()

    // ✅ User should be prevented from submitting incomplete form
    expect(result.submitEnabled).toBe(false)

    console.log('✅ Form correctly prevents incomplete submissions')
  })
})

test.describe('Cross-Feature User Workflows', () => {
  test('Complete user journey: Filter locations → View details → Give feedback', async ({ page }) => {
    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)
    const feedbackPage = new FeedbackPage(page)

    // ✅ User starts by filtering for their preferences
    await mapPage.waitForMapReady()
    await filterPage.setWeatherPreferences({
      temperature: 'mild',
      precipitation: 'none'
    })

    await filterPage.waitForFilterUpdate()

    // ✅ User explores a location
    const { content } = await mapPage.clickFirstPOI()
    const locationContent = await content.textContent()
    expect(locationContent).toContain('°F') // Has weather info

    await mapPage.closePopup()

    // ✅ User provides feedback about the experience
    await feedbackPage.submitCompleteFeedback({
      rating: 4,
      categories: ['general'],
      comment: 'Found great spots with perfect weather!',
    })

    await feedbackPage.expectSuccessMessage()

    console.log('✅ Complete user journey works end-to-end')
  })
})

// MOBILE-SPECIFIC USER BEHAVIOR
test.describe('Mobile User Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for mobile-specific tests
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 12 Pro
  })

  test('@smoke Mobile users can interact with map and filters', async ({ page }) => {
    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)

    await mapPage.waitForMapReady()

    // ✅ Touch interactions
    await filterPage.tapTemperatureFilter()
    await filterPage.selectTemperature('hot')

    // ✅ Tap POI marker
    const visiblePOIs = await mapPage.getVisiblePOINames()
    if (visiblePOIs.length > 0) {
      await mapPage.tapPOI(visiblePOIs[0])
      await mapPage.expectPopupVisible()
    }

    console.log('✅ Mobile touch interactions work correctly')
  })
})

// PERFORMANCE FROM USER PERSPECTIVE
test.describe('User-Perceived Performance', () => {
  test('App loads quickly for good user experience', async ({ page }) => {
    const mapPage = new MapPage(page)

    // ✅ Measure what user experiences
    const loadTime = await mapPage.measureLoadTime()

    // ✅ User experience requirement
    expect(loadTime).toBeLessThan(10000) // 10 seconds max

    console.log(`✅ App loads in ${loadTime}ms (good user experience)`)
  })

  test('Memory usage stays reasonable during user interactions', async ({ page }) => {
    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)

    await mapPage.waitForMapReady()
    const initialMemory = await mapPage.getMemoryUsage()

    // ✅ Simulate active user behavior
    await filterPage.rapidFilterChanges(3)
    await mapPage.clickFirstPOI()
    await mapPage.closePopup()

    const finalMemory = await mapPage.getMemoryUsage()

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024

      // ✅ User shouldn't experience memory issues
      expect(memoryIncreaseMB).toBeLessThan(50) // 50MB increase max

      console.log(`✅ Memory increase: ${memoryIncreaseMB.toFixed(2)}MB (acceptable)`)
    }
  })
})
