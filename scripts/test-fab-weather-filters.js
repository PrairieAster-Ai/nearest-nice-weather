#!/usr/bin/env node
/**
 * ========================================================================
 * TEST FAB WEATHER FILTERS - Real User Interaction Testing
 * ========================================================================
 *
 * Tests the actual FAB weather filters found in the UI to understand
 * the puzzling behavior mentioned by the user.
 */

import { chromium } from 'playwright'
import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENTS = {
  localhost: 'http://localhost:3002',
  preview: 'https://p.nearestniceweather.com'
}

class FABWeatherFilterTester {
  constructor() {
    this.browser = null
    this.context = null
    this.results = {
      environments: {},
      puzzlingBehaviors: []
    }
  }

  async initialize() {
    console.log('🚀 Initializing FAB Weather Filter Tester')
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1500, // Slower for visual inspection
      devtools: true
    })
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['geolocation'],
      geolocation: { latitude: 44.9778, longitude: -93.2650 }, // Minneapolis
    })

    // Enable console logging
    this.context.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`  [${msg.type().toUpperCase()}]:`, msg.text())
      }
    })

    console.log('✅ Browser initialized with slower interaction speed')
  }

  async testFABWeatherFilters(envName, baseUrl) {
    console.log(`\n🧪 Testing FAB weather filters in ${envName}`)
    const page = await this.context.newPage()

    const envResults = {
      baselineState: null,
      filterTests: [],
      puzzlingObservations: []
    }

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(5000)

      // Capture baseline state
      const baseline = await this.captureBaselineState(page)
      envResults.baselineState = baseline

      console.log(`  📊 Baseline: ${baseline.poiCount} POIs visible`)
      console.log(`  🗺️ Map bounds: ${JSON.stringify(baseline.mapBounds)}`)

      // Test each weather filter type
      const filterTests = [
        {
          name: 'Temperature Filter - Cold',
          action: async () => await this.testTemperatureFilter(page, 'cold')
        },
        {
          name: 'Temperature Filter - Warm',
          action: async () => await this.testTemperatureFilter(page, 'warm')
        },
        {
          name: 'Wind Speed Filter - Low',
          action: async () => await this.testWindSpeedFilter(page, 'low')
        },
        {
          name: 'Wind Speed Filter - High',
          action: async () => await this.testWindSpeedFilter(page, 'high')
        },
        {
          name: 'Precipitation Filter - None',
          action: async () => await this.testPrecipitationFilter(page, 'none')
        },
        {
          name: 'Precipitation Filter - Light',
          action: async () => await this.testPrecipitationFilter(page, 'light')
        }
      ]

      for (const test of filterTests) {
        console.log(`\n  🔍 ${test.name}:`)

        try {
          // Reset to baseline
          await page.reload({ waitUntil: 'networkidle' })
          await page.waitForTimeout(3000)

          const beforeState = await this.captureCurrentState(page)
          console.log(`    Before: ${beforeState.poiCount} POIs`)

          // Apply the filter
          const filterResult = await test.action()
          await page.waitForTimeout(3000) // Wait for filter to apply

          const afterState = await this.captureCurrentState(page)
          console.log(`    After: ${afterState.poiCount} POIs`)

          const change = afterState.poiCount - beforeState.poiCount
          const puzzling = this.analyzeFilterResults(beforeState, afterState, test.name)

          const testResult = {
            testName: test.name,
            before: beforeState,
            after: afterState,
            change: change,
            percentageChange: beforeState.poiCount > 0 ? ((change / beforeState.poiCount) * 100).toFixed(1) : 0,
            filterApplied: filterResult.success,
            puzzling: puzzling,
            observations: []
          }

          // Check for puzzling behaviors
          if (puzzling.length > 0) {
            console.log(`    🤔 Puzzling behavior detected:`)
            puzzling.forEach(p => console.log(`      - ${p}`))
            envResults.puzzlingObservations.push(...puzzling)
          }

          // Additional analysis
          if (Math.abs(change) > 0) {
            console.log(`    📈 POI count changed by ${change >= 0 ? '+' : ''}${change} (${testResult.percentageChange}%)`)
          } else {
            console.log(`    🟡 No change in POI count - filter may not be working`)
            testResult.observations.push('No POI count change detected')
          }

          envResults.filterTests.push(testResult)

          // Capture screenshot for this filter state
          await this.captureFilterScreenshot(page, `${envName}-${test.name.replace(/\s+/g, '-').toLowerCase()}`)

        } catch (error) {
          console.log(`    ❌ Filter test failed: ${error.message}`)
          envResults.filterTests.push({
            testName: test.name,
            error: error.message,
            failed: true
          })
        }
      }

    } finally {
      await page.close()
    }

    this.results.environments[envName] = envResults
    return envResults
  }

  async captureBaselineState(page) {
    const poiCount = await page.locator('.leaflet-marker-icon').count()
    const mapBounds = await page.evaluate(() => {
      if (window.map && window.map.getBounds) {
        const bounds = window.map.getBounds()
        return {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        }
      }
      return null
    })

    // Get sample POI data
    const samplePOIs = await this.captureSamplePOIData(page, 3)

    return {
      poiCount,
      mapBounds,
      samplePOIs,
      timestamp: new Date().toISOString()
    }
  }

  async captureCurrentState(page) {
    const poiCount = await page.locator('.leaflet-marker-icon').count()
    const samplePOIs = await this.captureSamplePOIData(page, 2)

    return {
      poiCount,
      samplePOIs,
      timestamp: new Date().toISOString()
    }
  }

  async captureSamplePOIData(page, maxCount = 3) {
    const poiData = []
    const markerCount = await page.locator('.leaflet-marker-icon').count()
    const actualCount = Math.min(markerCount, maxCount)

    for (let i = 0; i < actualCount; i++) {
      try {
        await page.locator('.leaflet-marker-icon').nth(i).click()
        await page.waitForSelector('.leaflet-popup', { timeout: 2000 })

        const poiInfo = await page.evaluate(() => {
          const popup = document.querySelector('.leaflet-popup-content')
          if (!popup) return null

          const name = popup.querySelector('h3')?.textContent?.trim()
          const details = popup.textContent

          // Extract weather info
          const weatherMatch = details.match(/(\\d+)°F.*?(Sunny|Cloudy|Partly Cloudy|Rainy|Overcast|Clear|Snow)/i)

          return {
            name: name,
            temperature: weatherMatch ? parseInt(weatherMatch[1]) : null,
            condition: weatherMatch ? weatherMatch[2] : null,
            hasWeatherData: !!weatherMatch
          }
        })

        if (poiInfo && poiInfo.name) {
          poiData.push(poiInfo)
        }

        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
      } catch (error) {
        // Skip failed captures
      }
    }

    return poiData
  }

  async testTemperatureFilter(page, preference) {
    console.log(`    🌡️ Testing temperature filter: ${preference}`)

    try {
      // Look for the FAB panel - it should be on the right side based on screenshots
      const fabPanel = await page.locator('[class*="MuiFab"], .weather-filter-panel, [class*="fab"]').first()

      if (await fabPanel.count() > 0) {
        console.log('    ✅ Found FAB panel')
        await fabPanel.click()
        await page.waitForTimeout(1000)

        // Look for temperature options
        const tempOptions = await page.locator(`text=/.*temp.*${preference}.*/i`).first()
        if (await tempOptions.count() > 0) {
          await tempOptions.click()
          console.log(`    ✅ Applied temperature filter: ${preference}`)
          return { success: true, method: 'fab_panel_click' }
        }
      }

      // Fallback: Try keyboard navigation from screenshots
      await page.keyboard.press('Tab')
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement
          return {
            text: el?.textContent?.toLowerCase(),
            ariaLabel: el?.getAttribute('aria-label')?.toLowerCase(),
          }
        })

        if (focusedElement.text?.includes('temperature') ||
            focusedElement.ariaLabel?.includes('temperature')) {
          await page.keyboard.press('Enter')
          await page.waitForTimeout(500)

          // Try to select the preference
          if (preference === 'cold') {
            await page.keyboard.press('ArrowUp')
          } else {
            await page.keyboard.press('ArrowDown')
          }
          await page.keyboard.press('Enter')

          console.log(`    ✅ Applied temperature filter via keyboard: ${preference}`)
          return { success: true, method: 'keyboard_navigation' }
        }
      }

      console.log('    ⚠️ Could not find temperature filter controls')
      return { success: false, reason: 'controls_not_found' }

    } catch (error) {
      console.log(`    ❌ Temperature filter failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async testWindSpeedFilter(page, preference) {
    console.log(`    💨 Testing wind speed filter: ${preference}`)

    try {
      // Similar approach to temperature but looking for wind-related controls
      const fabPanel = await page.locator('[class*="MuiFab"], .weather-filter-panel, [class*="fab"]').first()

      if (await fabPanel.count() > 0) {
        await fabPanel.click()
        await page.waitForTimeout(1000)

        const windOptions = await page.locator(`text=/.*wind.*${preference}.*/i`).first()
        if (await windOptions.count() > 0) {
          await windOptions.click()
          console.log(`    ✅ Applied wind speed filter: ${preference}`)
          return { success: true, method: 'fab_panel_click' }
        }
      }

      // Keyboard fallback for wind
      await page.keyboard.press('Tab')
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement
          return {
            text: el?.textContent?.toLowerCase(),
            ariaLabel: el?.getAttribute('aria-label')?.toLowerCase(),
          }
        })

        if (focusedElement.text?.includes('wind') ||
            focusedElement.ariaLabel?.includes('wind')) {
          await page.keyboard.press('Enter')
          console.log(`    ✅ Applied wind filter via keyboard: ${preference}`)
          return { success: true, method: 'keyboard_navigation' }
        }
      }

      console.log('    ⚠️ Could not find wind speed filter controls')
      return { success: false, reason: 'controls_not_found' }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async testPrecipitationFilter(page, preference) {
    console.log(`    🌧️ Testing precipitation filter: ${preference}`)

    try {
      const fabPanel = await page.locator('[class*="MuiFab"], .weather-filter-panel, [class*="fab"]').first()

      if (await fabPanel.count() > 0) {
        await fabPanel.click()
        await page.waitForTimeout(1000)

        const precipOptions = await page.locator(`text=/.*precip.*${preference}.*/i, text=/.*rain.*${preference}.*/i`).first()
        if (await precipOptions.count() > 0) {
          await precipOptions.click()
          console.log(`    ✅ Applied precipitation filter: ${preference}`)
          return { success: true, method: 'fab_panel_click' }
        }
      }

      // Keyboard fallback for precipitation
      await page.keyboard.press('Tab')
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement
          return {
            text: el?.textContent?.toLowerCase(),
            ariaLabel: el?.getAttribute('aria-label')?.toLowerCase(),
          }
        })

        if (focusedElement.text?.includes('precip') ||
            focusedElement.text?.includes('rain') ||
            focusedElement.ariaLabel?.includes('precip')) {
          await page.keyboard.press('Enter')
          console.log(`    ✅ Applied precipitation filter via keyboard: ${preference}`)
          return { success: true, method: 'keyboard_navigation' }
        }
      }

      console.log('    ⚠️ Could not find precipitation filter controls')
      return { success: false, reason: 'controls_not_found' }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  analyzeFilterResults(beforeState, afterState, filterName) {
    const puzzling = []

    // Check for unexpected behaviors
    if (beforeState.poiCount === afterState.poiCount) {
      puzzling.push(`No change in POI count despite applying ${filterName}`)
    }

    if (afterState.poiCount > beforeState.poiCount) {
      puzzling.push(`POI count increased after applying restrictive filter ${filterName}`)
    }

    // Check for weather data consistency
    const beforeWithWeather = beforeState.samplePOIs.filter(poi => poi.hasWeatherData).length
    const afterWithWeather = afterState.samplePOIs.filter(poi => poi.hasWeatherData).length

    if (beforeWithWeather > 0 && afterWithWeather === 0) {
      puzzling.push(`Lost weather data in POIs after applying ${filterName}`)
    }

    // Check for logical inconsistencies
    if (filterName.includes('Cold') && afterState.samplePOIs.some(poi => poi.temperature > 75)) {
      puzzling.push(`Cold filter showing warm temperature POIs (${afterState.samplePOIs.filter(poi => poi.temperature > 75).length})`)
    }

    if (filterName.includes('Warm') && afterState.samplePOIs.some(poi => poi.temperature < 50)) {
      puzzling.push(`Warm filter showing cold temperature POIs`)
    }

    return puzzling
  }

  async captureFilterScreenshot(page, filename) {
    const screenshotPath = `/home/robertspeer/Projects/screenshots/${filename}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`    📸 Screenshot saved: ${filename}.png`)
  }

  async generateAnalysisReport() {
    console.log('\n📋 FAB WEATHER FILTER ANALYSIS REPORT')
    console.log('=' .repeat(80))

    for (const [env, results] of Object.entries(this.results.environments)) {
      console.log(`\n🌍 ${env.toUpperCase()} ENVIRONMENT`)
      console.log('-' .repeat(60))

      if (results.baselineState) {
        console.log(`📊 Baseline State:`)
        console.log(`  POI Count: ${results.baselineState.poiCount}`)
        console.log(`  Sample POIs: ${results.baselineState.samplePOIs.length}`)

        if (results.baselineState.samplePOIs.length > 0) {
          console.log(`  Weather Data: ${results.baselineState.samplePOIs.filter(p => p.hasWeatherData).length}/${results.baselineState.samplePOIs.length} POIs`)

          const temps = results.baselineState.samplePOIs.filter(p => p.temperature).map(p => p.temperature)
          if (temps.length > 0) {
            console.log(`  Temperature Range: ${Math.min(...temps)}°F - ${Math.max(...temps)}°F`)
          }
        }
      }

      console.log(`\n🧪 Filter Test Results:`)
      const successfulTests = results.filterTests.filter(t => !t.failed && !t.error)
      const failedTests = results.filterTests.filter(t => t.failed || t.error)

      console.log(`  Successful Tests: ${successfulTests.length}`)
      console.log(`  Failed Tests: ${failedTests.length}`)

      successfulTests.forEach(test => {
        console.log(`  ✅ ${test.testName}: ${test.change >= 0 ? '+' : ''}${test.change} POIs (${test.percentageChange}%)`)
        if (test.puzzling && test.puzzling.length > 0) {
          test.puzzling.forEach(p => console.log(`      🤔 ${p}`))
        }
      })

      failedTests.forEach(test => {
        console.log(`  ❌ ${test.testName}: ${test.error || 'Failed to execute'}`)
      })

      if (results.puzzlingObservations.length > 0) {
        console.log(`\n🤔 Puzzling Behaviors Detected:`)
        results.puzzlingObservations.forEach(obs => console.log(`  - ${obs}`))
      }
    }

    // Overall assessment
    const allPuzzling = []
    for (const results of Object.values(this.results.environments)) {
      allPuzzling.push(...(results.puzzlingObservations || []))
    }

    console.log('\n🎯 CONCLUSIONS')
    console.log('-' .repeat(60))

    if (allPuzzling.length > 0) {
      console.log(`🤔 ${allPuzzling.length} puzzling behaviors identified across all environments`)
      console.log('This matches the user\'s observation that FAB filter results are puzzling')

      // Group similar puzzling behaviors
      const grouped = {}
      allPuzzling.forEach(p => {
        const key = p.split('POI')[0].trim() // Group by main issue type
        grouped[key] = (grouped[key] || 0) + 1
      })

      console.log('\nMost common puzzling behaviors:')
      Object.entries(grouped)
        .sort(([,a], [,b]) => b - a)
        .forEach(([behavior, count]) => {
          console.log(`  ${count}x: ${behavior}`)
        })
    } else {
      console.log('✅ No puzzling behaviors detected - filters appear to be working as expected')
    }

    return {
      totalEnvironments: Object.keys(this.results.environments).length,
      totalPuzzlingBehaviors: allPuzzling.length,
      summary: allPuzzling.length > 0 ? 'PUZZLING_BEHAVIORS_CONFIRMED' : 'FILTERS_WORKING_NORMALLY'
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      console.log('🧹 Browser cleanup completed')
    }
  }
}

async function main() {
  const tester = new FABWeatherFilterTester()

  try {
    await tester.initialize()

    for (const [envName, baseUrl] of Object.entries(ENVIRONMENTS)) {
      if (envName === 'localhost') {
        // Check if localhost is running
        try {
          const response = await fetch('http://localhost:3002')
          if (!response.ok) {
            console.log(`⚠️ Localhost not running on port 3002`)
            continue
          }
        } catch (error) {
          console.log(`⚠️ Localhost not accessible`)
          continue
        }
      }

      console.log(`\n🔍 TESTING FAB WEATHER FILTERS: ${envName.toUpperCase()}`)
      console.log('=' .repeat(70))

      await tester.testFABWeatherFilters(envName, baseUrl)
    }

    const reportStats = await tester.generateAnalysisReport()

    console.log('\n🎉 FAB Weather Filter Testing Complete!')
    console.log(`📊 Found ${reportStats.totalPuzzlingBehaviors} puzzling behaviors`)

    if (reportStats.summary === 'PUZZLING_BEHAVIORS_CONFIRMED') {
      console.log('🤔 The user\'s observation about puzzling FAB filter results is CONFIRMED')
      console.log('💡 These behaviors need debugging to improve filter effectiveness')
    }

  } catch (error) {
    console.error('❌ FAB filter testing failed:', error)
    process.exit(1)
  } finally {
    await tester.cleanup()
  }
}

main()
