#!/usr/bin/env node

/**
 * Simple No Results Behavior Test
 * Tests for no results messaging when filters are applied
 */

import { chromium } from '@playwright/test'

async function testNoResults() {
  console.log('🎭 Testing no results behavior...')

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    // Navigate to localhost
    await page.goto('http://localhost:3001')

    // Wait for page to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Check initial markers
    const initialMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Initial markers: ${initialMarkers}`)

    // Try to click a filter FAB (dismiss any tooltips first)
    console.log('🔘 Clicking temperature filter...')
    await page.click('body') // Dismiss any tooltips
    await page.waitForTimeout(500)

    // Click temperature filter FAB
    await page.click('[data-testid="filter-temperature"]')
    await page.waitForTimeout(1000)

    // Check if options are visible
    const coldOption = page.locator('[data-testid="temperature-cold"]')
    const mildOption = page.locator('[data-testid="temperature-mild"]')
    const hotOption = page.locator('[data-testid="temperature-hot"]')

    console.log(`🔘 Cold option visible: ${await coldOption.isVisible()}`)
    console.log(`🔘 Mild option visible: ${await mildOption.isVisible()}`)
    console.log(`🔘 Hot option visible: ${await hotOption.isVisible()}`)

    // Click cold option if visible
    if (await coldOption.isVisible()) {
      console.log('❄️ Selecting cold temperature...')
      await coldOption.click()
      await page.waitForTimeout(2000)

      // Check markers after filtering
      const filteredMarkers = await page.locator('.leaflet-marker-icon').count()
      console.log(`📍 Markers after cold filter: ${filteredMarkers}`)

      // Try adding more restrictive filters
      console.log('🌧️ Adding precipitation filter...')
      await page.click('[data-testid="filter-precipitation"]')
      await page.waitForTimeout(1000)

      // Try to click heavy precipitation
      const heavyPrecip = page.locator('[data-testid="precipitation-heavy"]')
      if (await heavyPrecip.isVisible()) {
        await heavyPrecip.click()
        await page.waitForTimeout(2000)

        const doubleFilteredMarkers = await page.locator('.leaflet-marker-icon').count()
        console.log(`📍 Markers after cold + heavy precipitation: ${doubleFilteredMarkers}`)
      }
    }

    // Check for "no results" messaging in various places
    console.log('\n🔍 Checking for no results messaging...')

    // Check for the specific no results text
    const noResultsText1 = await page.locator('text=No locations match your weather preferences').count()
    const noResultsText2 = await page.locator('text=Try adjusting your weather filters').count()
    const noResultsText3 = await page.locator('text=No locations found').count()
    const noResultsText4 = await page.locator('text=No results').count()

    console.log(`💬 "No locations match your weather preferences": ${noResultsText1 > 0 ? 'FOUND' : 'NOT FOUND'}`)
    console.log(`💬 "Try adjusting your weather filters": ${noResultsText2 > 0 ? 'FOUND' : 'NOT FOUND'}`)
    console.log(`💬 "No locations found": ${noResultsText3 > 0 ? 'FOUND' : 'NOT FOUND'}`)
    console.log(`💬 "No results": ${noResultsText4 > 0 ? 'FOUND' : 'NOT FOUND'}`)

    // Check if the results panel exists and what it contains
    const resultsPanel = page.locator('[role="tabpanel"]').first()
    if (await resultsPanel.isVisible()) {
      const panelText = await resultsPanel.textContent()
      console.log(`📋 Results panel content: "${panelText?.substring(0, 200)}..."`)
    } else {
      console.log('📋 Results panel not visible')
    }

    // Check all text content on page for debugging
    const bodyText = await page.locator('body').textContent()
    const hasNoMatchText = bodyText.includes('No locations match') || bodyText.includes('no results') || bodyText.includes('No results')
    console.log(`🔍 Page contains any "no results" text: ${hasNoMatchText ? 'YES' : 'NO'}`)

    // Take screenshot for analysis
    await page.screenshot({
      path: 'documentation/Branding/no-results-behavior-test.png',
      fullPage: true
    })
    console.log('📸 Screenshot saved: documentation/Branding/no-results-behavior-test.png')

    // Final marker count
    const finalMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Final marker count: ${finalMarkers}`)

    if (finalMarkers === 0) {
      console.log('⚠️ Zero markers found - this should trigger no results messaging!')
    } else {
      console.log('ℹ️ Markers still visible - filters may not be restrictive enough')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)

    // Take error screenshot
    await page.screenshot({
      path: 'documentation/Branding/no-results-error.png',
      fullPage: true
    })
    console.log('📸 Error screenshot saved')
  } finally {
    await browser.close()
  }
}

testNoResults()
