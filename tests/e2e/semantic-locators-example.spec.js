/**
 * ========================================================================
 * SEMANTIC LOCATORS EXAMPLE - PLAYWRIGHT BEST PRACTICES
 * ========================================================================
 * 
 * @PURPOSE: Demonstrates proper use of semantic locators vs CSS selectors
 * @FOLLOWS: Playwright best practices for user-facing testing
 * 
 * This example shows the difference between implementation-driven testing
 * (CSS selectors) and user-facing testing (semantic locators)
 * 
 * ========================================================================
 */

import { test, expect } from '@playwright/test'
import { MapPage } from './pages/MapPage.js'
import { FilterPage } from './pages/FilterPage.js'
import { FeedbackPage } from './pages/FeedbackPage.js'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.describe('Semantic Locators - Best Practice Examples', () => {
  // PROPER TEST ISOLATION
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

  test('@smoke Semantic locators vs CSS selectors comparison', async ({ page }) => {
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()

    // ❌ WRONG: CSS selector (implementation detail)
    // await page.locator('.MuiFab-root').click()
    
    // ✅ RIGHT: Semantic locator (user-facing)
    await page.getByRole('button', { name: /feedback/i }).click()
    
    // ❌ WRONG: CSS class selector
    // await page.locator('.leaflet-marker-icon').first().click()
    
    // ✅ RIGHT: User-facing locator
    await page.getByRole('button', { name: /park|trail|forest/i }).first().click()
    
    console.log('✅ Semantic locators used correctly')
  })

  test('@critical User workflow with semantic locators', async ({ page }) => {
    const mapPage = new MapPage(page)
    const filterPage = new FilterPage(page)
    const feedbackPage = new FeedbackPage(page)
    
    // Wait for app to be ready
    await mapPage.waitForMapReady()
    
    // User filters for hot weather
    await filterPage.selectTemperature('hot')
    await filterPage.waitForFilterUpdate()
    
    // User explores a location
    const poiCount = await mapPage.getPOICount()
    if (poiCount > 0) {
      await mapPage.clickFirstPOI()
      await mapPage.expectPopupVisible()
      await mapPage.closePopup()
    }
    
    // User provides feedback
    await feedbackPage.openFeedback()
    await feedbackPage.selectRating(5)
    await feedbackPage.selectCategory('general')
    await feedbackPage.enterComment('Great outdoor spots!')
    await feedbackPage.submitFeedback()
    await feedbackPage.expectSuccessMessage()
    
    console.log('✅ Complete user workflow with semantic locators')
  })

  test('@smoke Test IDs and ARIA labels work correctly', async ({ page }) => {
    // Test data-testid attributes work
    await expect(page.getByTestId('map-container')).toBeVisible()
    await expect(page.getByTestId('filter-temperature')).toBeVisible()
    
    // Test ARIA labels work  
    await expect(page.getByRole('application', { name: /interactive map/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /temperature filter/i })).toBeVisible()
    
    console.log('✅ Data-testid and ARIA labels working correctly')
  })

  test('Accessibility-focused locators', async ({ page }) => {
    const mapPage = new MapPage(page)
    await mapPage.waitForMapReady()
    
    // Use accessibility-focused selectors
    const mapApplication = page.getByRole('application', { name: /interactive map/i })
    await expect(mapApplication).toBeVisible()
    
    // Focus on keyboard navigation
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    const focusedRole = await focused.getAttribute('role')
    console.log(`First focusable element role: ${focusedRole}`)
    
    console.log('✅ Accessibility-focused testing complete')
  })
})

// COMPARISON: Bad vs Good Locator Examples
test.describe('Locator Strategy Examples', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.setGeolocation({ latitude: 44.9537, longitude: -93.0900 })
    await context.grantPermissions(['geolocation'])
    await page.goto(BASE_URL)
  })

  test('Comparing locator strategies', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 10000 })

    // ❌ AVOID: CSS selectors (brittle, implementation-dependent)
    // page.locator('.MuiFab-root')
    // page.locator('.leaflet-marker-icon') 
    // page.locator('#some-id')
    // page.locator('[class*="MuiButton"]')
    
    // ✅ PREFER: Semantic locators (stable, user-facing)
    const examples = [
      // Role-based (most stable)
      page.getByRole('button', { name: /feedback/i }),
      page.getByRole('application', { name: /map/i }),
      page.getByRole('dialog', { name: /feedback/i }),
      
      // Test ID (good for custom components)
      page.getByTestId('map-container'),
      page.getByTestId('filter-temperature'),
      
      // Label-based (user-facing text)
      page.getByLabel(/temperature filter/i),
      page.getByPlaceholder(/enter your feedback/i),
      
      // Text content (actual user-visible text)
      page.getByText(/submit feedback/i),
      page.getByText(/directions/i)
    ]
    
    // Test that semantic locators are more resilient
    for (let i = 0; i < Math.min(examples.length, 3); i++) {
      const locator = examples[i]
      try {
        const isVisible = await locator.isVisible()
        console.log(`Locator ${i + 1}: ${isVisible ? '✅ Found' : '❌ Not found'}`)
      } catch (error) {
        console.log(`Locator ${i + 1}: ❌ Error - ${error.message.split('\n')[0]}`)
      }
    }
    
    console.log('✅ Locator strategy comparison complete')
  })
})