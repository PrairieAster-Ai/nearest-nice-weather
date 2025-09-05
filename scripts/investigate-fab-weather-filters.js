#!/usr/bin/env node
/**
 * ========================================================================
 * INVESTIGATE FAB WEATHER FILTERS
 * ========================================================================
 *
 * Tests the existing Floating Action Button weather filters:
 * - Temperature Filter
 * - Wind Speed Filter
 * - Precipitation Filter
 */

import { chromium } from 'playwright'
import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENTS = {
  localhost: 'http://localhost:3002',
  preview: 'https://p.nearestniceweather.com'
}

class FABWeatherFilterInvestigator {
  constructor() {
    this.browser = null
    this.context = null
    this.results = {
      fabDiscovery: {},
      filterBehavior: {},
      puzzlingResults: []
    }
  }

  async initialize() {
    console.log('🚀 Initializing FAB Weather Filter Investigation')
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      devtools: true // Enable devtools to inspect elements
    })
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['geolocation'],
      geolocation: { latitude: 44.9778, longitude: -93.2650 }, // Minneapolis
    })

    // Enable console logging
    this.context.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('  [Console]:', msg.text())
      }
    })

    console.log('✅ Browser initialized with devtools')
  }

  async discoverFABElements(envName, baseUrl) {
    console.log(`\n🔍 Discovering FAB weather filter elements in ${envName}`)
    const page = await this.context.newPage()

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Look for FAB elements
      const fabSelectors = [
        // Common FAB selectors
        '[class*="fab"]',
        '[class*="floating"]',
        '[class*="action"]',
        '[data-testid*="fab"]',
        '[aria-label*="filter"]',
        '[aria-label*="weather"]',
        // Material-UI FAB patterns
        '.MuiFab-root',
        '.MuiSpeedDial-root',
        '.MuiSpeedDialAction-fab',
        // Custom FAB patterns
        'button[class*="float"]',
        'button[title*="filter"]',
        'button[title*="weather"]',
        // Mobile-optimized selectors
        '[class*="thumb"]',
        '[class*="flyout"]'
      ]

      const foundElements = []

      for (const selector of fabSelectors) {
        try {
          const elements = await page.locator(selector).all()
          if (elements.length > 0) {
            for (const element of elements) {
              const isVisible = await element.isVisible()
              if (isVisible) {
                const text = await element.textContent().catch(() => '')
                const ariaLabel = await element.getAttribute('aria-label').catch(() => '')
                const title = await element.getAttribute('title').catch(() => '')
                const classes = await element.getAttribute('class').catch(() => '')

                foundElements.push({
                  selector,
                  text: text?.trim() || '',
                  ariaLabel,
                  title,
                  classes,
                  position: await element.boundingBox()
                })
              }
            }
          }
        } catch (error) {
          // Skip if selector doesn't work
        }
      }

      console.log(`  📍 Found ${foundElements.length} potential FAB elements`)

      // Try to identify the three weather FABs
      const weatherFABs = {
        temperature: null,
        windSpeed: null,
        precipitation: null
      }

      // Look for temperature FAB
      const tempPatterns = ['temp', 'temperature', '°', 'degrees', 'heat', 'cold']
      weatherFABs.temperature = foundElements.find(el =>
        tempPatterns.some(pattern =>
          el.text?.toLowerCase().includes(pattern) ||
          el.ariaLabel?.toLowerCase().includes(pattern) ||
          el.title?.toLowerCase().includes(pattern)
        )
      )

      // Look for wind speed FAB
      const windPatterns = ['wind', 'speed', 'mph', 'breeze', 'gust']
      weatherFABs.windSpeed = foundElements.find(el =>
        windPatterns.some(pattern =>
          el.text?.toLowerCase().includes(pattern) ||
          el.ariaLabel?.toLowerCase().includes(pattern) ||
          el.title?.toLowerCase().includes(pattern)
        )
      )

      // Look for precipitation FAB
      const precipPatterns = ['rain', 'precip', 'snow', 'wet', 'dry', 'shower']
      weatherFABs.precipitation = foundElements.find(el =>
        precipPatterns.some(pattern =>
          el.text?.toLowerCase().includes(pattern) ||
          el.ariaLabel?.toLowerCase().includes(pattern) ||
          el.title?.toLowerCase().includes(pattern)
        )
      )

      // If not found by text, look for FAB pattern (usually 3 FABs in a group)
      if (!weatherFABs.temperature && !weatherFABs.windSpeed && !weatherFABs.precipitation) {
        console.log('  🔍 Searching for FAB group pattern...')

        // Look for Material-UI SpeedDial or similar FAB group
        const speedDial = await page.locator('.MuiSpeedDial-root').first()
        if (await speedDial.count() > 0) {
          console.log('  ✅ Found Material-UI SpeedDial')

          // Click to open the speed dial
          await speedDial.click()
          await page.waitForTimeout(1000)

          // Get speed dial actions
          const actions = await page.locator('.MuiSpeedDialAction-fab').all()
          console.log(`  📍 Found ${actions.length} speed dial actions`)

          if (actions.length >= 3) {
            weatherFABs.temperature = { element: actions[0], type: 'speeddial' }
            weatherFABs.windSpeed = { element: actions[1], type: 'speeddial' }
            weatherFABs.precipitation = { element: actions[2], type: 'speeddial' }
          }
        }
      }

      // Try visual inspection for FABs
      await this.captureScreenshot(page, `fab-discovery-${envName}.png`)

      // Store results
      this.results.fabDiscovery[envName] = {
        totalElementsFound: foundElements.length,
        weatherFABs,
        allElements: foundElements
      }

      // Log findings
      if (weatherFABs.temperature || weatherFABs.windSpeed || weatherFABs.precipitation) {
        console.log('  ✅ Weather FABs identified:')
        if (weatherFABs.temperature) console.log('    🌡️ Temperature FAB found')
        if (weatherFABs.windSpeed) console.log('    💨 Wind Speed FAB found')
        if (weatherFABs.precipitation) console.log('    🌧️ Precipitation FAB found')
      } else {
        console.log('  ⚠️ Weather FABs not automatically detected')
        console.log('  📸 Screenshot saved for manual inspection')
      }

    } finally {
      await page.close()
    }
  }

  async testFABFilterBehavior(envName, baseUrl) {
    console.log(`\n🧪 Testing FAB filter behavior in ${envName}`)
    const page = await this.context.newPage()

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Capture baseline POI count
      const baselineMarkers = await page.locator('.leaflet-marker-icon').count()
      console.log(`  📍 Baseline: ${baselineMarkers} POI markers`)

      // Manual FAB interaction (since auto-detection might not work)
      console.log('  🖱️ Attempting manual FAB interaction...')

      // Common FAB positions (bottom-right corner is typical)
      const fabPositions = [
        { x: 1850, y: 900 },  // Bottom-right
        { x: 1850, y: 850 },  // Slightly higher
        { x: 1850, y: 800 },  // Even higher
        { x: 70, y: 900 },    // Bottom-left
        { x: 70, y: 850 },    // Left side higher
      ]

      for (const pos of fabPositions) {
        try {
          console.log(`  🎯 Clicking at position ${pos.x}, ${pos.y}`)
          await page.mouse.click(pos.x, pos.y)
          await page.waitForTimeout(1000)

          // Check if any flyout menu appeared
          const flyoutSelectors = [
            '[class*="flyout"]',
            '[class*="menu"]',
            '[class*="options"]',
            '.MuiSpeedDialAction-fab',
            '[role="menu"]'
          ]

          for (const selector of flyoutSelectors) {
            const flyout = await page.locator(selector).first()
            if (await flyout.count() > 0 && await flyout.isVisible()) {
              console.log(`  ✅ Flyout menu detected: ${selector}`)

              // Try to interact with flyout options
              const options = await page.locator(`${selector} button, ${selector} [role="button"]`).all()
              console.log(`  📋 Found ${options.length} flyout options`)

              // Test each option
              for (let i = 0; i < options.length; i++) {
                const option = options[i]
                const optionText = await option.textContent().catch(() => '')
                console.log(`    🔸 Testing option ${i + 1}: ${optionText}`)

                await option.click()
                await page.waitForTimeout(2000)

                // Check POI count change
                const newMarkerCount = await page.locator('.leaflet-marker-icon').count()
                const change = newMarkerCount - baselineMarkers

                console.log(`      POI count: ${baselineMarkers} → ${newMarkerCount} (${change >= 0 ? '+' : ''}${change})`)

                // Capture the filtered state
                await this.captureFilteredPOIState(page, `filter-${i + 1}`)

                // Reset by clicking the FAB again
                await page.mouse.click(pos.x, pos.y)
                await page.waitForTimeout(1000)
              }

              break // Found flyout, no need to try other selectors
            }
          }
        } catch (error) {
          // Continue trying other positions
        }
      }

      // Test keyboard navigation for FABs
      console.log('  ⌨️ Testing keyboard navigation...')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(500)

      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        // Check if we've focused on a FAB
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement
          return {
            tagName: el?.tagName,
            className: el?.className,
            ariaLabel: el?.getAttribute('aria-label'),
            title: el?.title,
            text: el?.textContent
          }
        })

        if (focusedElement.className?.includes('fab') ||
            focusedElement.className?.includes('Fab') ||
            focusedElement.ariaLabel?.toLowerCase().includes('filter')) {
          console.log(`  🎯 Focused on potential FAB: ${focusedElement.ariaLabel || focusedElement.title}`)

          // Try to activate it
          await page.keyboard.press('Enter')
          await page.waitForTimeout(1000)
        }
      }

    } finally {
      await page.close()
    }
  }

  async captureScreenshot(page, filename) {
    const screenshotPath = `/home/robertspeer/Projects/screenshots/${filename}`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`  📸 Screenshot saved: ${filename}`)
  }

  async captureFilteredPOIState(page, filterName) {
    try {
      // Get current POI data
      const poiData = await page.evaluate(() => {
        const markers = document.querySelectorAll('.leaflet-marker-icon')
        return markers.length
      })

      // Try to get filter state from the page
      const filterState = await page.evaluate(() => {
        // Look for any visible filter indicators
        const filterIndicators = []

        // Check for filter badges, chips, or labels
        const selectors = [
          '[class*="filter"]',
          '[class*="chip"]',
          '[class*="badge"]',
          '[class*="active"]'
        ]

        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            if (el.textContent && el.offsetParent !== null) { // Is visible
              filterIndicators.push(el.textContent.trim())
            }
          })
        })

        return filterIndicators
      })

      this.results.puzzlingResults.push({
        filterName,
        poiCount: poiData,
        activeFilters: filterState,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.log(`  ⚠️ Could not capture filter state: ${error.message}`)
    }
  }

  async investigatePuzzlingBehavior(envName, baseUrl) {
    console.log(`\n🔍 Investigating puzzling FAB filter behavior in ${envName}`)
    const page = await this.context.newPage()

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3000)

      // Enable request interception to monitor API calls
      await page.route('**/api/**', route => {
        const request = route.request()
        console.log(`  🌐 API Call: ${request.method()} ${request.url()}`)
        route.continue()
      })

      // Monitor network activity when filters are applied
      page.on('response', response => {
        if (response.url().includes('api') && response.url().includes('poi')) {
          console.log(`  📡 POI API Response: ${response.status()} - ${response.url()}`)
        }
      })

      // Look for React/Vue/Angular devtools
      const frameworkState = await page.evaluate(() => {
        return {
          react: window.React || window._react,
          vue: window.Vue || window.$vue,
          angular: window.angular || window.ng,
          redux: window.__REDUX_DEVTOOLS_EXTENSION__,
          materialUI: window.MUI || document.querySelector('[class*="Mui"]')
        }
      })

      console.log('  🛠️ Framework detection:')
      if (frameworkState.react) console.log('    ✅ React detected')
      if (frameworkState.vue) console.log('    ✅ Vue detected')
      if (frameworkState.angular) console.log('    ✅ Angular detected')
      if (frameworkState.redux) console.log('    ✅ Redux DevTools detected')
      if (frameworkState.materialUI) console.log('    ✅ Material-UI detected')

      // Try to access component state
      const componentState = await page.evaluate(() => {
        // Try to find weather filter state in various places
        const possibleStatePaths = [
          'window.__REACT_DEVTOOLS_GLOBAL_HOOK__',
          'document.querySelector("#root")._reactRootContainer',
          'window.store?.getState?.()',
          'window.__APP_STATE__',
          'window.__INITIAL_STATE__'
        ]

        const states = {}
        possibleStatePaths.forEach(path => {
          try {
            const state = eval(path)
            if (state) {
              states[path] = typeof state === 'object' ? 'Found state object' : 'Found state'
            }
          } catch (e) {
            // Path doesn't exist
          }
        })

        return states
      })

      if (Object.keys(componentState).length > 0) {
        console.log('  🎯 Found application state:')
        Object.entries(componentState).forEach(([path, value]) => {
          console.log(`    ${path}: ${value}`)
        })
      }

    } finally {
      await page.close()
    }
  }

  async generateReport() {
    console.log('\n📋 FAB WEATHER FILTER INVESTIGATION REPORT')
    console.log('=' .repeat(80))

    for (const [env, discovery] of Object.entries(this.results.fabDiscovery)) {
      console.log(`\n🌍 ${env.toUpperCase()} ENVIRONMENT`)
      console.log('-' .repeat(60))

      console.log(`Total potential FAB elements found: ${discovery.totalElementsFound}`)

      if (discovery.weatherFABs) {
        console.log('\nWeather FABs detected:')
        if (discovery.weatherFABs.temperature) {
          console.log('  🌡️ Temperature FAB: YES')
        }
        if (discovery.weatherFABs.windSpeed) {
          console.log('  💨 Wind Speed FAB: YES')
        }
        if (discovery.weatherFABs.precipitation) {
          console.log('  🌧️ Precipitation FAB: YES')
        }
      }

      if (discovery.allElements?.length > 0) {
        console.log('\nAll FAB-like elements found:')
        discovery.allElements.slice(0, 5).forEach(el => {
          console.log(`  - ${el.selector}: "${el.text || el.ariaLabel || el.title || 'No label'}"`)
        })
      }
    }

    if (this.results.puzzlingResults.length > 0) {
      console.log('\n🤔 PUZZLING FILTER BEHAVIORS')
      console.log('-' .repeat(60))
      this.results.puzzlingResults.forEach(result => {
        console.log(`Filter: ${result.filterName}`)
        console.log(`  POI Count: ${result.poiCount}`)
        console.log(`  Active Filters: ${result.activeFilters.join(', ') || 'None detected'}`)
      })
    }

    console.log('\n💡 RECOMMENDATIONS')
    console.log('-' .repeat(60))
    console.log('1. Check browser console for filter state changes')
    console.log('2. Inspect network requests when filters are applied')
    console.log('3. Look for hidden filter parameters in URL or localStorage')
    console.log('4. Verify filter logic in the application code')

    return this.results
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      console.log('🧹 Browser cleanup completed')
    }
  }
}

async function main() {
  const investigator = new FABWeatherFilterInvestigator()

  try {
    await investigator.initialize()

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

      console.log(`\n🔍 INVESTIGATING ${envName.toUpperCase()} ENVIRONMENT`)
      console.log('=' .repeat(70))

      await investigator.discoverFABElements(envName, baseUrl)
      await investigator.testFABFilterBehavior(envName, baseUrl)
      await investigator.investigatePuzzlingBehavior(envName, baseUrl)
    }

    await investigator.generateReport()

    console.log('\n✅ FAB Weather Filter Investigation Complete!')
    console.log('📸 Check screenshots in /home/robertspeer/Projects/screenshots/')
    console.log('🔍 Review browser DevTools for additional insights')

  } catch (error) {
    console.error('❌ Investigation failed:', error)
    process.exit(1)
  } finally {
    await investigator.cleanup()
  }
}

main()
