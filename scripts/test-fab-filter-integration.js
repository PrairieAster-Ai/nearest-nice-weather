#!/usr/bin/env node
/**
 * Test FAB filter integration end-to-end
 * This tests that the FAB filters actually change POI results
 */

import { chromium } from 'playwright'

async function testFABFilterIntegration() {
  console.log('🧪 Testing FAB Filter Integration End-to-End')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000) // Wait for POIs to load

    // Count baseline POI markers
    const baselineCount = await page.locator('.leaflet-marker-icon').count()
    console.log(`📊 Baseline POI count: ${baselineCount}`)

    // Look for FAB weather filters - they should be in the top-right area
    const fabElements = await page.locator('.MuiFab-root').all()
    console.log(`🎯 Found ${fabElements.length} FAB elements`)

    if (fabElements.length > 0) {
      console.log('✅ FAB elements found - testing temperature filter')

      // Click the first FAB (likely temperature)
      await fabElements[0].click()
      await page.waitForTimeout(1000)

      // Look for options that appear
      const options = await page.locator('.MuiFab-root').all()
      console.log(`📋 Available options: ${options.length}`)

      // Try to click a filter option (cold temperature)
      for (let i = 0; i < options.length; i++) {
        const option = options[i]
        const isVisible = await option.isVisible()
        if (isVisible) {
          console.log(`🔍 Clicking option ${i}`)
          await option.click()
          await page.waitForTimeout(3000) // Wait for filtering
          break
        }
      }

      // Count POIs after filter
      const filteredCount = await page.locator('.leaflet-marker-icon').count()
      console.log(`📊 After filter POI count: ${filteredCount}`)

      if (filteredCount !== baselineCount) {
        console.log('✅ SUCCESS: FAB filters are working!')
        console.log(`📈 POI count changed: ${baselineCount} → ${filteredCount}`)
      } else {
        console.log('❌ Issue: POI count did not change')
      }

    } else {
      console.log('❌ No FAB elements found')
    }

    // Take a screenshot for verification
    await page.screenshot({ path: '/home/robertspeer/Projects/screenshots/fab-filter-test.png', fullPage: true })
    console.log('📸 Screenshot saved: fab-filter-test.png')

  } catch (error) {
    console.error('Test failed:', error.message)
  } finally {
    await browser.close()
  }
}

testFABFilterIntegration()
