#!/usr/bin/env node

/**
 * Test No Results Behavior with Playwright
 * Tests various filter combinations to find scenarios that should show "no results" messaging
 */

import { chromium } from '@playwright/test'

async function testNoResultsBehavior() {
  console.log('🎭 Starting Playwright test for no results behavior...')
  
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    // Navigate to localhost (should be running)
    console.log('📍 Navigating to localhost...')
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' })
    
    // Wait for the map to load
    console.log('🗺️ Waiting for map to load...')
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })
    await page.waitForTimeout(3000) // Let data load
    
    // Check initial state
    const initialMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Initial markers visible: ${initialMarkers}`)
    
    // Test 1: Try very restrictive filters that should yield no results
    console.log('\n🧪 Test 1: Applying very restrictive filters...')
    
    // Click temperature filter
    await page.click('[data-testid="filter-temperature"]')
    await page.waitForTimeout(500)
    
    // Select cold temperature
    await page.click('[data-testid="temperature-cold"]')
    await page.waitForTimeout(1000)
    
    // Click precipitation filter  
    await page.click('[data-testid="filter-precipitation"]')
    await page.waitForTimeout(500)
    
    // Select heavy precipitation
    await page.click('[data-testid="precipitation-heavy"]')
    await page.waitForTimeout(1000)
    
    // Click wind filter
    await page.click('[data-testid="filter-wind"]')
    await page.waitForTimeout(500)
    
    // Select windy
    await page.click('[data-testid="wind-windy"]')
    await page.waitForTimeout(2000)
    
    // Check markers after filtering
    const filteredMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Markers after restrictive filtering: ${filteredMarkers}`)
    
    // Check for "no results" message
    const noResultsMessage = await page.locator('text=No locations match your weather preferences').count()
    console.log(`💬 "No results" message visible: ${noResultsMessage > 0 ? 'YES' : 'NO'}`)
    
    // Check results panel content
    const resultsPanel = await page.locator('[role="tabpanel"]').first()
    if (await resultsPanel.isVisible()) {
      const panelText = await resultsPanel.textContent()
      console.log(`📋 Results panel text: "${panelText?.substring(0, 100)}..."`)
    } else {
      console.log('📋 Results panel not visible')
    }
    
    // Test 2: Try even more extreme filtering
    console.log('\n🧪 Test 2: Multiple extreme filter changes...')
    
    // Try clicking same filters multiple times (should maintain restrictive state)
    await page.click('[data-testid="filter-temperature"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="temperature-hot"]') // Switch to hot
    await page.waitForTimeout(1000)
    
    const extremeFilteredMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Markers after extreme filtering: ${extremeFilteredMarkers}`)
    
    const noResultsMessage2 = await page.locator('text=No locations match your weather preferences').count()
    console.log(`💬 "No results" message visible after extreme filtering: ${noResultsMessage2 > 0 ? 'YES' : 'NO'}`)
    
    // Test 3: Clear all filters and see if data returns
    console.log('\n🧪 Test 3: Clearing filters...')
    
    // Click each filter to clear them (assuming clicking same option deselects)
    await page.click('[data-testid="filter-temperature"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="temperature-hot"]') // Click again to deselect
    await page.waitForTimeout(1000)
    
    const clearedMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Markers after clearing filters: ${clearedMarkers}`)
    
    // Take a screenshot of the final state
    await page.screenshot({ 
      path: 'documentation/Branding/no-results-test.png',
      fullPage: true 
    })
    console.log('📸 Screenshot saved to documentation/Branding/no-results-test.png')
    
    // Test 4: Check network requests to see if filtering is actually happening
    console.log('\n🧪 Test 4: Monitoring network activity...')
    
    page.on('response', response => {
      if (response.url().includes('poi-locations') || response.url().includes('weather')) {
        console.log(`🌐 API Response: ${response.url()} - Status: ${response.status()}`)
      }
    })
    
    // Apply one more filter change to trigger network activity
    await page.click('[data-testid="filter-precipitation"]')
    await page.waitForTimeout(500)
    await page.click('[data-testid="precipitation-none"]')
    await page.waitForTimeout(2000)
    
    const finalMarkers = await page.locator('.leaflet-marker-icon').count()
    console.log(`📍 Final marker count: ${finalMarkers}`)
    
    // Check console logs for any errors
    const logs = []
    page.on('console', msg => logs.push(msg.text()))
    await page.waitForTimeout(1000)
    
    const errorLogs = logs.filter(log => log.includes('error') || log.includes('Error'))
    if (errorLogs.length > 0) {
      console.log('❌ Console errors found:')
      errorLogs.forEach(log => console.log(`   ${log}`))
    } else {
      console.log('✅ No console errors detected')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await browser.close()
  }
}

testNoResultsBehavior()