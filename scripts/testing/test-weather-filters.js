#!/usr/bin/env node

// Quick test of the weather filtering API
import fetch from 'node-fetch'

async function testWeatherFilters() {
  console.log('🧪 Testing weather filter API endpoints')

  try {
    // Test baseline (no filters)
    console.log('\n📊 Testing baseline (no filters):')
    const baselineResponse = await fetch('http://localhost:4000/api/poi-locations-with-weather?limit=10')
    const baseline = await baselineResponse.json()
    console.log(`  Result: ${baseline.count} POIs`)

    const temps = baseline.data.map(poi => poi.temperature).sort((a, b) => a - b)
    console.log(`  Temperature range: ${Math.min(...temps)}°F - ${Math.max(...temps)}°F`)

    // Test temperature=cold filter
    console.log('\n❄️ Testing temperature=cold filter:')
    const coldResponse = await fetch('http://localhost:4000/api/poi-locations-with-weather?limit=10&temperature=cold')
    const cold = await coldResponse.json()
    console.log(`  Result: ${cold.count} POIs`)

    if (cold.data.length > 0) {
      const coldTemps = cold.data.map(poi => poi.temperature).sort((a, b) => a - b)
      console.log(`  Filtered temperature range: ${Math.min(...coldTemps)}°F - ${Math.max(...coldTemps)}°F`)
    }

    // Test precipitation=none filter
    console.log('\n☀️ Testing precipitation=none filter:')
    const dryResponse = await fetch('http://localhost:4000/api/poi-locations-with-weather?limit=10&precipitation=none')
    const dry = await dryResponse.json()
    console.log(`  Result: ${dry.count} POIs`)

    if (dry.data.length > 0) {
      const precipLevels = dry.data.map(poi => poi.precipitation).sort((a, b) => a - b)
      console.log(`  Filtered precipitation range: ${Math.min(...precipLevels)}% - ${Math.max(...precipLevels)}%`)
    }

    // Test wind=calm filter
    console.log('\n🍃 Testing wind=calm filter:')
    const calmResponse = await fetch('http://localhost:4000/api/poi-locations-with-weather?limit=10&wind=calm')
    const calm = await calmResponse.json()
    console.log(`  Result: ${calm.count} POIs`)

    if (calm.data.length > 0) {
      const windSpeeds = calm.data.map(poi => poi.windSpeed).sort((a, b) => a - b)
      console.log(`  Filtered wind range: ${Math.min(...windSpeeds)}mph - ${Math.max(...windSpeeds)}mph`)
    }

    // Combined filters test
    console.log('\n🎯 Testing combined filters (temperature=mild&precipitation=none&wind=calm):')
    const combinedResponse = await fetch('http://localhost:4000/api/poi-locations-with-weather?limit=10&temperature=mild&precipitation=none&wind=calm')
    const combined = await combinedResponse.json()
    console.log(`  Result: ${combined.count} POIs`)

    // Summary
    console.log('\n📋 FILTER EFFECTIVENESS:')
    console.log(`  Baseline: ${baseline.count} POIs`)
    console.log(`  Cold filter: ${cold.count} POIs`)
    console.log(`  Dry filter: ${dry.count} POIs`)
    console.log(`  Calm filter: ${calm.count} POIs`)
    console.log(`  Combined filters: ${combined.count} POIs`)

    if (baseline.count === cold.count && baseline.count === dry.count && baseline.count === calm.count) {
      console.log('\n❌ FILTERS NOT WORKING - All results identical')
      console.log('   This matches the puzzling behavior reported!')
    } else {
      console.log('\n✅ FILTERS WORKING - Different result counts detected')
    }

  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testWeatherFilters()
