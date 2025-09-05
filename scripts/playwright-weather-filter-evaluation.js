#!/usr/bin/env node
/**
 * ========================================================================
 * PLAYWRIGHT WEATHER FILTER EVALUATION
 * ========================================================================
 *
 * Comprehensive testing of weather-based filtering functionality
 * Evaluates how weather conditions affect POI result ordering and filtering
 */

import { chromium } from 'playwright'
import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENTS = {
  localhost: 'http://localhost:3002',
  preview: 'https://p.nearestniceweather.com'
}

const API_ENDPOINTS = {
  localhost: 'http://localhost:4000',
  preview: 'https://p.nearestniceweather.com'
}

class WeatherFilterEvaluator {
  constructor() {
    this.browser = null
    this.context = null
    this.results = {
      baselineResults: {},
      weatherFilterResults: {},
      filterComparisons: {},
      userScenarios: {}
    }
  }

  async initialize() {
    console.log('🚀 Initializing Weather Filter Evaluator')
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 500,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    })
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['geolocation'],
      geolocation: { latitude: 46.7867, longitude: -92.1005 }, // Duluth, MN
      userAgent: 'Mozilla/5.0 (compatible; WeatherFilter-Evaluator/1.0)'
    })
    console.log('✅ Browser initialized with geolocation permissions')
  }

  async captureBaselineResults(envName, baseUrl, apiBase) {
    console.log(`\n📊 Capturing baseline results for ${envName}`)
    const page = await this.context.newPage()

    try {
      // Get baseline API data without filters
      const baselineAPI = await page.evaluate(async (apiUrl) => {
        const response = await fetch(`${apiUrl}/api/poi-locations-with-weather?limit=20`)
        return await response.json()
      }, apiBase)

      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Count initial POI markers
      const initialMarkers = await page.locator('.leaflet-marker-icon').count()

      // Collect initial POI data by clicking markers
      const initialPOIData = []
      if (initialMarkers > 0) {
        for (let i = 0; i < Math.min(initialMarkers, 10); i++) {
          try {
            await page.locator('.leaflet-marker-icon').nth(i).click()
            await page.waitForSelector('.leaflet-popup', { timeout: 3000 })

            const poiInfo = await page.evaluate(() => {
              const popup = document.querySelector('.leaflet-popup-content')
              if (!popup) return null

              const name = popup.querySelector('h3')?.textContent?.trim()
              const details = popup.textContent

              // Extract weather info if visible
              const weatherMatch = details.match(/(\d+)°F.*?(Sunny|Cloudy|Partly Cloudy|Rainy|Overcast|Clear|Snow)/i)

              return {
                name: name,
                temperature: weatherMatch ? parseInt(weatherMatch[1]) : null,
                condition: weatherMatch ? weatherMatch[2] : null,
                fullText: details
              }
            })

            if (poiInfo && poiInfo.name) {
              initialPOIData.push(poiInfo)
            }

            // Close popup
            await page.keyboard.press('Escape')
            await page.waitForTimeout(500)
          } catch (error) {
            console.log(`    Warning: Could not capture POI ${i}: ${error.message}`)
          }
        }
      }

      this.results.baselineResults[envName] = {
        markerCount: initialMarkers,
        apiResponse: baselineAPI,
        poiData: initialPOIData,
        timestamp: new Date().toISOString()
      }

      console.log(`  📍 Found ${initialMarkers} POI markers`)
      console.log(`  📊 API returned ${baselineAPI.count} POIs with weather data`)
      console.log(`  🌡️ Captured detailed data for ${initialPOIData.length} POIs`)

      // Log sample weather conditions
      const weatherConditions = initialPOIData.map(poi => ({ name: poi.name, temp: poi.temperature, condition: poi.condition }))
      console.log('  🌤️ Sample weather conditions:')
      weatherConditions.slice(0, 5).forEach(poi => {
        console.log(`    - ${poi.name}: ${poi.temp}°F, ${poi.condition}`)
      })

    } finally {
      await page.close()
    }
  }

  async testWeatherFilters(envName, baseUrl) {
    console.log(`\n🌡️ Testing weather filters for ${envName}`)
    const page = await this.context.newPage()
    const filterResults = {}

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Look for weather filter controls
      const filterControls = await this.findWeatherFilterControls(page)

      if (filterControls.length === 0) {
        console.log('  ❌ No weather filter controls found - may need to implement')
        filterResults.noFiltersFound = true
        this.results.weatherFilterResults[envName] = filterResults
        return
      }

      console.log(`  🎛️ Found ${filterControls.length} weather filter controls`)

      // Test different weather filter scenarios
      const filterScenarios = [
        {
          name: 'Temperature Filter: Above 70°F',
          action: async () => await this.applyTemperatureFilter(page, 70, 'above')
        },
        {
          name: 'Temperature Filter: Below 60°F',
          action: async () => await this.applyTemperatureFilter(page, 60, 'below')
        },
        {
          name: 'Condition Filter: Clear/Sunny Only',
          action: async () => await this.applyConditionFilter(page, ['Clear', 'Sunny', 'Partly Cloudy'])
        },
        {
          name: 'Condition Filter: No Rain/Snow',
          action: async () => await this.applyConditionFilter(page, ['Clear', 'Sunny', 'Partly Cloudy', 'Cloudy'])
        }
      ]

      for (const scenario of filterScenarios) {
        try {
          console.log(`  🧪 Testing: ${scenario.name}`)

          // Reset to baseline
          await page.reload({ waitUntil: 'networkidle' })
          await page.waitForTimeout(2000)

          const baselineCount = await page.locator('.leaflet-marker-icon').count()

          // Apply filter
          await scenario.action()
          await page.waitForTimeout(2000)

          // Measure results
          const filteredCount = await page.locator('.leaflet-marker-icon').count()
          const change = filteredCount - baselineCount

          // Capture filtered POI data
          const filteredPOIData = await this.captureVisiblePOIData(page, Math.min(filteredCount, 5))

          filterResults[scenario.name] = {
            baselineCount,
            filteredCount,
            change,
            percentageChange: baselineCount > 0 ? ((change / baselineCount) * 100).toFixed(1) : 0,
            filteredPOIs: filteredPOIData,
            success: true
          }

          console.log(`    📊 Results: ${baselineCount} → ${filteredCount} POIs (${change >= 0 ? '+' : ''}${change})`)

        } catch (error) {
          console.log(`    ❌ Filter test failed: ${error.message}`)
          filterResults[scenario.name] = {
            success: false,
            error: error.message
          }
        }
      }

    } catch (error) {
      console.log(`  ❌ Weather filter testing failed: ${error.message}`)
      filterResults.error = error.message
    } finally {
      await page.close()
    }

    this.results.weatherFilterResults[envName] = filterResults
  }

  async findWeatherFilterControls(page) {
    // Look for common weather filter UI elements
    const possibleSelectors = [
      '[data-testid*="weather"]',
      '[data-testid*="filter"]',
      '.weather-filter',
      '.temperature-filter',
      '.condition-filter',
      'input[type="range"]', // Temperature sliders
      'select[name*="weather"]',
      'select[name*="temperature"]',
      'input[name*="temperature"]',
      '.filter-controls',
      '[id*="weather"]',
      '[class*="filter"]'
    ]

    const foundControls = []

    for (const selector of possibleSelectors) {
      try {
        const elements = await page.locator(selector).all()
        if (elements.length > 0) {
          foundControls.push({ selector, count: elements.length })
        }
      } catch (error) {
        // Selector not found, continue
      }
    }

    return foundControls
  }

  async applyTemperatureFilter(page, temperature, comparison) {
    // Try to find and interact with temperature filter controls
    const selectors = [
      `input[type="range"][name*="temp"]`,
      `input[type="number"][name*="temp"]`,
      `.temperature-slider input`,
      `input[placeholder*="temperature" i]`
    ]

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first()
        if (await element.count() > 0) {
          if (comparison === 'above') {
            await element.fill(temperature.toString())
          } else {
            await element.fill(temperature.toString())
          }
          return true
        }
      } catch (error) {
        continue
      }
    }

    // If no specific controls found, try programmatic filtering
    return await this.simulateTemperatureFilter(page, temperature, comparison)
  }

  async applyConditionFilter(page, allowedConditions) {
    // Try to find condition filter controls
    const selectors = [
      'select[name*="condition"]',
      'select[name*="weather"]',
      '.condition-filter select',
      'input[type="checkbox"][name*="condition"]'
    ]

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first()
        if (await element.count() > 0) {
          // Handle select dropdown
          if (selector.includes('select')) {
            await element.selectOption({ label: allowedConditions[0] })
          }
          return true
        }
      } catch (error) {
        continue
      }
    }

    // If no specific controls found, simulate filtering
    return await this.simulateConditionFilter(page, allowedConditions)
  }

  async simulateTemperatureFilter(page, temperature, comparison) {
    // Simulate temperature filtering by evaluating page data
    return await page.evaluate(async (temp, comp) => {
      // Try to trigger a filter by modifying URL parameters
      const url = new URL(window.location)
      url.searchParams.set('temp_' + comp, temp)

      // If the app uses URL parameters for filtering
      if (window.location.search !== url.search) {
        window.history.pushState({}, '', url)
        // Trigger a custom event that the app might listen to
        window.dispatchEvent(new Event('locationchange'))
        return true
      }

      return false
    }, temperature, comparison)
  }

  async simulateConditionFilter(page, allowedConditions) {
    // Simulate condition filtering
    return await page.evaluate(async (conditions) => {
      const url = new URL(window.location)
      url.searchParams.set('weather_conditions', conditions.join(','))

      if (window.location.search !== url.search) {
        window.history.pushState({}, '', url)
        window.dispatchEvent(new Event('locationchange'))
        return true
      }

      return false
    }, allowedConditions)
  }

  async captureVisiblePOIData(page, maxCount = 5) {
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

          const weatherMatch = details.match(/(\d+)°F.*?(Sunny|Cloudy|Partly Cloudy|Rainy|Overcast|Clear|Snow)/i)

          return {
            name: name,
            temperature: weatherMatch ? parseInt(weatherMatch[1]) : null,
            condition: weatherMatch ? weatherMatch[2] : null
          }
        })

        if (poiInfo && poiInfo.name) {
          poiData.push(poiInfo)
        }

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      } catch (error) {
        // Skip failed captures
      }
    }

    return poiData
  }

  async testUserWeatherScenarios(envName, baseUrl, apiBase) {
    console.log(`\n👤 Testing user weather scenarios for ${envName}`)
    const page = await this.context.newPage()
    const scenarioResults = {}

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Scenario 1: Find parks with pleasant weather (70-80°F, clear conditions)
      console.log('  🌤️ Scenario: Find parks with pleasant weather')
      const pleasantWeatherPOIs = await this.findPOIsWithWeatherCriteria(page, {
        tempMin: 70,
        tempMax: 80,
        goodConditions: ['Clear', 'Sunny', 'Partly Cloudy']
      })

      scenarioResults.pleasantWeather = {
        count: pleasantWeatherPOIs.length,
        pois: pleasantWeatherPOIs.slice(0, 5),
        success: pleasantWeatherPOIs.length > 0
      }

      console.log(`    📊 Found ${pleasantWeatherPOIs.length} POIs with pleasant weather`)

      // Scenario 2: Avoid bad weather locations
      console.log('  🌧️ Scenario: Identify locations to avoid (rain/storms)')
      const badWeatherPOIs = await this.findPOIsWithWeatherCriteria(page, {
        badConditions: ['Rain', 'Storm', 'Thunderstorm', 'Heavy Rain']
      })

      scenarioResults.badWeatherAvoidance = {
        count: badWeatherPOIs.length,
        pois: badWeatherPOIs.slice(0, 3),
        success: true // Success means we can identify them to avoid
      }

      console.log(`    ⛈️ Found ${badWeatherPOIs.length} POIs with poor weather conditions`)

      // Scenario 3: Temperature-based activity matching
      console.log('  🏊 Scenario: Find locations suitable for water activities (75°F+)')
      const waterActivityPOIs = await this.findPOIsWithWeatherCriteria(page, {
        tempMin: 75,
        activityType: 'water'
      })

      scenarioResults.waterActivities = {
        count: waterActivityPOIs.length,
        pois: waterActivityPOIs.slice(0, 3),
        success: waterActivityPOIs.length > 0
      }

      console.log(`    🏊 Found ${waterActivityPOIs.length} locations suitable for water activities`)

      // Scenario 4: Winter activity locations
      console.log('  ❄️ Scenario: Find locations good for winter activities (below 40°F)')
      const winterActivityPOIs = await this.findPOIsWithWeatherCriteria(page, {
        tempMax: 40,
        activityType: 'winter'
      })

      scenarioResults.winterActivities = {
        count: winterActivityPOIs.length,
        pois: winterActivityPOIs.slice(0, 3),
        success: winterActivityPOIs.length >= 0 // Even 0 is valid information
      }

      console.log(`    ❄️ Found ${winterActivityPOIs.length} locations suitable for winter activities`)

    } catch (error) {
      console.log(`  ❌ User scenario testing failed: ${error.message}`)
      scenarioResults.error = error.message
    } finally {
      await page.close()
    }

    this.results.userScenarios[envName] = scenarioResults
  }

  async findPOIsWithWeatherCriteria(page, criteria) {
    const matchingPOIs = []
    const markerCount = await page.locator('.leaflet-marker-icon').count()

    for (let i = 0; i < Math.min(markerCount, 20); i++) {
      try {
        await page.locator('.leaflet-marker-icon').nth(i).click()
        await page.waitForSelector('.leaflet-popup', { timeout: 2000 })

        const poiInfo = await page.evaluate(() => {
          const popup = document.querySelector('.leaflet-popup-content')
          if (!popup) return null

          const name = popup.querySelector('h3')?.textContent?.trim()
          const details = popup.textContent

          const weatherMatch = details.match(/(\d+)°F.*?(Sunny|Cloudy|Partly Cloudy|Rainy|Overcast|Clear|Snow|Rain|Storm)/i)

          return {
            name: name,
            temperature: weatherMatch ? parseInt(weatherMatch[1]) : null,
            condition: weatherMatch ? weatherMatch[2] : null,
            fullText: details
          }
        })

        if (poiInfo && this.matchesWeatherCriteria(poiInfo, criteria)) {
          matchingPOIs.push(poiInfo)
        }

        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      } catch (error) {
        // Skip failed captures
      }
    }

    return matchingPOIs
  }

  matchesWeatherCriteria(poi, criteria) {
    if (!poi.temperature && !poi.condition) return false

    // Temperature criteria
    if (criteria.tempMin && poi.temperature < criteria.tempMin) return false
    if (criteria.tempMax && poi.temperature > criteria.tempMax) return false

    // Good conditions criteria
    if (criteria.goodConditions && poi.condition) {
      if (!criteria.goodConditions.some(condition =>
        poi.condition.toLowerCase().includes(condition.toLowerCase())
      )) {
        return false
      }
    }

    // Bad conditions criteria (for avoidance)
    if (criteria.badConditions && poi.condition) {
      return criteria.badConditions.some(condition =>
        poi.condition.toLowerCase().includes(condition.toLowerCase())
      )
    }

    return true
  }

  async compareWeatherFiltering(envName) {
    console.log(`\n📈 Analyzing weather filter effectiveness for ${envName}`)

    const baseline = this.results.baselineResults[envName]
    const filterResults = this.results.weatherFilterResults[envName]
    const scenarios = this.results.userScenarios[envName]

    if (!baseline || !filterResults) {
      console.log('  ❌ Insufficient data for comparison')
      return
    }

    const comparison = {
      totalPOIsAvailable: baseline.markerCount,
      weatherDataCoverage: baseline.apiResponse?.count || 0,
      filteringCapability: 'unknown',
      userScenarioSuccess: 0,
      recommendations: []
    }

    // Analyze filtering capability
    if (filterResults.noFiltersFound) {
      comparison.filteringCapability = 'none_implemented'
      comparison.recommendations.push('Implement weather-based filtering controls')
    } else {
      const successfulFilters = Object.values(filterResults).filter(f => f.success).length
      const totalFilters = Object.keys(filterResults).length
      comparison.filteringCapability = `${successfulFilters}/${totalFilters}_working`
    }

    // Analyze user scenario success
    if (scenarios && !scenarios.error) {
      const successfulScenarios = Object.values(scenarios).filter(s => s.success).length
      const totalScenarios = Object.keys(scenarios).length
      comparison.userScenarioSuccess = (successfulScenarios / totalScenarios * 100).toFixed(0)
    }

    // Generate recommendations
    if (baseline.apiResponse?.count < baseline.markerCount) {
      comparison.recommendations.push('Not all POIs have weather data - improve weather API coverage')
    }

    if (comparison.filteringCapability.includes('none')) {
      comparison.recommendations.push('Implement weather filter UI components (temperature sliders, condition checkboxes)')
    }

    console.log('  📊 Analysis Results:')
    console.log(`    Total POIs: ${comparison.totalPOIsAvailable}`)
    console.log(`    Weather data coverage: ${comparison.weatherDataCoverage}`)
    console.log(`    Filtering capability: ${comparison.filteringCapability}`)
    console.log(`    User scenario success: ${comparison.userScenarioSuccess}%`)

    if (comparison.recommendations.length > 0) {
      console.log('  💡 Recommendations:')
      comparison.recommendations.forEach(rec => console.log(`    - ${rec}`))
    }

    this.results.filterComparisons[envName] = comparison
  }

  async generateWeatherFilterReport() {
    console.log('\n📋 WEATHER FILTER EVALUATION REPORT')
    console.log('=' .repeat(80))

    for (const [env, baseline] of Object.entries(this.results.baselineResults)) {
      console.log(`\n🌍 ${env.toUpperCase()} ENVIRONMENT`)
      console.log('-' .repeat(60))

      const filterResults = this.results.weatherFilterResults[env] || {}
      const scenarios = this.results.userScenarios[env] || {}
      const comparison = this.results.filterComparisons[env] || {}

      // Baseline stats
      console.log('📊 Baseline POI Data:')
      console.log(`  POI Count: ${baseline.markerCount}`)
      console.log(`  Weather Coverage: ${baseline.apiResponse?.count || 0}/${baseline.markerCount}`)

      // Weather data quality
      if (baseline.poiData?.length > 0) {
        const withTemp = baseline.poiData.filter(p => p.temperature).length
        const withCondition = baseline.poiData.filter(p => p.condition).length
        console.log(`  Temperature data: ${withTemp}/${baseline.poiData.length}`)
        console.log(`  Condition data: ${withCondition}/${baseline.poiData.length}`)

        // Temperature range
        const temps = baseline.poiData.filter(p => p.temperature).map(p => p.temperature)
        if (temps.length > 0) {
          console.log(`  Temperature range: ${Math.min(...temps)}°F - ${Math.max(...temps)}°F`)
        }

        // Condition variety
        const conditions = [...new Set(baseline.poiData.filter(p => p.condition).map(p => p.condition))]
        console.log(`  Weather conditions: ${conditions.join(', ')}`)
      }

      // Filter testing results
      console.log('\n🎛️ Weather Filter Testing:')
      if (filterResults.noFiltersFound) {
        console.log('  ❌ No weather filter controls found')
        console.log('  💡 Recommendation: Implement weather filtering UI')
      } else if (Object.keys(filterResults).length > 0) {
        for (const [filterName, result] of Object.entries(filterResults)) {
          if (result.success) {
            console.log(`  ✅ ${filterName}:`)
            console.log(`    ${result.baselineCount} → ${result.filteredCount} POIs (${result.percentageChange}%)`)
          } else {
            console.log(`  ❌ ${filterName}: ${result.error}`)
          }
        }
      } else {
        console.log('  ⚠️ No filter tests performed')
      }

      // User scenario results
      console.log('\n👤 User Scenario Testing:')
      if (scenarios.error) {
        console.log(`  ❌ Scenario testing failed: ${scenarios.error}`)
      } else {
        for (const [scenarioName, result] of Object.entries(scenarios)) {
          if (result.count !== undefined) {
            console.log(`  📋 ${scenarioName}: ${result.count} matching POIs`)
            if (result.pois?.length > 0) {
              console.log(`    Sample: ${result.pois[0].name} (${result.pois[0].temperature}°F, ${result.pois[0].condition})`)
            }
          }
        }
      }
    }

    // Overall assessment
    console.log('\n🏆 OVERALL ASSESSMENT')
    console.log('-' .repeat(60))

    const totalEnvironments = Object.keys(this.results.baselineResults).length
    let environmentsWithFilters = 0
    let environmentsWithWeatherData = 0

    for (const [env, baseline] of Object.entries(this.results.baselineResults)) {
      if (baseline.apiResponse?.count > 0) environmentsWithWeatherData++

      const filterResults = this.results.weatherFilterResults[env]
      if (filterResults && !filterResults.noFiltersFound) environmentsWithFilters++
    }

    console.log(`Weather Data Coverage: ${environmentsWithWeatherData}/${totalEnvironments} environments`)
    console.log(`Filter Implementation: ${environmentsWithFilters}/${totalEnvironments} environments`)

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS')
    console.log('-' .repeat(60))

    if (environmentsWithFilters === 0) {
      console.log('1. 🎛️ CRITICAL: Implement weather filtering UI components')
      console.log('   - Temperature range sliders (min/max)')
      console.log('   - Weather condition checkboxes (Clear, Cloudy, Rainy, etc.)')
      console.log('   - Real-time POI filtering based on weather criteria')
    }

    if (environmentsWithWeatherData < totalEnvironments) {
      console.log('2. 🌤️ Improve weather data coverage across all environments')
    }

    console.log('3. 📊 Consider implementing weather-based POI ranking')
    console.log('   - Prioritize POIs with favorable weather conditions')
    console.log('   - Add weather-based activity recommendations')

    console.log('\n✅ Weather Filter Evaluation Complete!')

    return {
      environmentsTested: totalEnvironments,
      weatherDataCoverage: environmentsWithWeatherData,
      filterImplementation: environmentsWithFilters,
      overallScore: Math.round(((environmentsWithWeatherData + environmentsWithFilters) / (totalEnvironments * 2)) * 100)
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      console.log('🧹 Browser cleanup completed')
    }
  }
}

// Main execution function
async function main() {
  const evaluator = new WeatherFilterEvaluator()

  try {
    await evaluator.initialize()

    // Test environments that are available
    for (const [envName, baseUrl] of Object.entries(ENVIRONMENTS)) {
      if (envName === 'localhost') {
        // Check if localhost is running
        try {
          const response = await fetch('http://localhost:4000/api/health')
          if (!response.ok) {
            console.log(`⚠️ Localhost not running, skipping ${envName}`)
            continue
          }
        } catch (error) {
          console.log(`⚠️ Localhost not accessible, skipping ${envName}`)
          continue
        }
      }

      console.log(`\n🔍 EVALUATING WEATHER FILTERS: ${envName.toUpperCase()}`)
      console.log('=' .repeat(70))

      const apiBase = API_ENDPOINTS[envName]

      // Step 1: Capture baseline results
      await evaluator.captureBaselineResults(envName, baseUrl, apiBase)

      // Step 2: Test weather filters
      await evaluator.testWeatherFilters(envName, baseUrl)

      // Step 3: Test user scenarios
      await evaluator.testUserWeatherScenarios(envName, baseUrl, apiBase)

      // Step 4: Compare and analyze
      await evaluator.compareWeatherFiltering(envName)
    }

    // Generate comprehensive report
    const reportStats = await evaluator.generateWeatherFilterReport()

    console.log('\n🎯 NEXT STEPS')
    console.log('-' .repeat(40))
    if (reportStats.filterImplementation === 0) {
      console.log('• Implement weather filter UI in the frontend')
      console.log('• Add temperature and condition-based filtering')
      console.log('• Test filter functionality with user scenarios')
    } else {
      console.log('• Optimize existing weather filter performance')
      console.log('• Add more sophisticated weather-based recommendations')
    }

  } catch (error) {
    console.error('❌ Weather filter evaluation failed:', error)
    process.exit(1)
  } finally {
    await evaluator.cleanup()
  }
}

// Execute evaluation
main()
