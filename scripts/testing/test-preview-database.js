#!/usr/bin/env node

/**
 * Test script to check what's in the preview database
 */

async function testPreviewDatabase() {
  console.log('🔍 Testing Preview Database Contents')

  const endpoints = [
    '/api/poi-locations-with-weather?limit=200',  // Try higher limit
    '/api/poi-locations?limit=200',               // Try direct POI endpoint (may 404)
    '/api/health',                                // Health check
  ]

  const baseUrl = 'https://p.nearestniceweather.com'

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint}`)

    try {
      const response = await fetch(`${baseUrl}${endpoint}`)
      const status = response.status()

      console.log(`   Status: ${status}`)

      if (status === 200) {
        const data = await response.json()
        console.log(`   Success: ${data.success}`)

        if (data.data && Array.isArray(data.data)) {
          console.log(`   Data Records: ${data.data.length}`)

          if (data.data.length > 0) {
            const firstRecord = data.data[0]
            console.log(`   First Record Keys: ${Object.keys(firstRecord)}`)
            console.log(`   Sample Data:`, JSON.stringify(firstRecord, null, 2))
          } else {
            console.log('   ❌ EMPTY DATA ARRAY - This explains missing map markers!')
          }
        }

        if (data.debug) {
          console.log(`   Debug Info:`)
          console.log(`     Query Type: ${data.debug.query_type}`)
          console.log(`     Data Source: ${data.debug.data_source}`)
          console.log(`     Environment: ${data.debug.environment || 'not specified'}`)
        }
      } else if (status === 404) {
        console.log(`   ❌ Endpoint not found (404)`)
      } else {
        const errorText = await response.text()
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}`)
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`)
    }
  }

  console.log('\n📋 Summary:')
  console.log('If data records = 0, the preview database is empty and needs POI migration')
  console.log('The localhost database has 138 POI records that need to be migrated to preview')
}

// Node.js fetch polyfill for older versions
if (!global.fetch) {
  import('node-fetch').then(fetch => {
    global.fetch = fetch.default
    testPreviewDatabase()
  })
} else {
  testPreviewDatabase()
}
