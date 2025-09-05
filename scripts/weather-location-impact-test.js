#!/usr/bin/env node
/**
 * ========================================================================
 * WEATHER LOCATION IMPACT TEST
 * ========================================================================
 *
 * Tests how weather conditions vary by location and affect POI recommendations
 */

import dotenv from 'dotenv'

dotenv.config()

const API_BASE = 'http://localhost:4000'

// Test different Minnesota locations with varying weather patterns
const TEST_LOCATIONS = [
  {
    name: "Duluth (North Shore)",
    lat: 46.7867,
    lng: -92.1005,
    expected: "Cooler temperatures due to Lake Superior"
  },
  {
    name: "Minneapolis (Metro)",
    lat: 44.9778,
    lng: -93.2650,
    expected: "Urban heat island effect, warmer temperatures"
  },
  {
    name: "International Falls (Northern Border)",
    lat: 48.6000,
    lng: -93.4000,
    expected: "Coldest temperatures in state"
  },
  {
    name: "Rochester (Southeast)",
    lat: 44.0121,
    lng: -92.4802,
    expected: "Moderate temperatures"
  },
  {
    name: "Boundary Waters (Remote North)",
    lat: 47.9442,
    lng: -91.5036,
    expected: "Pristine wilderness conditions"
  }
]

class WeatherLocationTester {
  constructor() {
    this.locationResults = {}
  }

  async testLocationWeatherVariation() {
    console.log('🗺️ TESTING WEATHER VARIATION BY LOCATION')
    console.log('=' .repeat(70))

    for (const location of TEST_LOCATIONS) {
      console.log(`\n📍 Testing: ${location.name}`)
      console.log(`   Coordinates: ${location.lat}, ${location.lng}`)
      console.log(`   Expected: ${location.expected}`)

      try {
        // Fetch POIs with weather for this specific location
        const response = await fetch(
          `${API_BASE}/api/poi-locations-with-weather?lat=${location.lat}&lng=${location.lng}&limit=10`
        )
        const data = await response.json()

        if (!data.success) {
          console.log(`   ❌ API Error: ${data.error}`)
          continue
        }

        // Analyze weather patterns for this location
        const weatherStats = this.analyzeLocationWeather(data.data)

        this.locationResults[location.name] = {
          coordinates: { lat: location.lat, lng: location.lng },
          expected: location.expected,
          poiCount: data.count,
          weatherStats,
          nearbyPOIs: data.data.slice(0, 5).map(poi => ({
            name: poi.name,
            distance: poi.distance_miles,
            temperature: poi.temperature,
            condition: poi.condition,
            weather_source: poi.weather_source
          }))
        }

        console.log(`   📊 Found ${data.count} nearby POIs`)
        console.log(`   🌡️ Temperature range: ${weatherStats.tempMin}°F - ${weatherStats.tempMax}°F (avg: ${weatherStats.tempAvg}°F)`)
        console.log(`   ☁️ Conditions: ${weatherStats.conditions.join(', ')}`)
        console.log(`   📡 Weather sources: ${Object.keys(weatherStats.sources).join(', ')}`)

        // Show closest POIs with weather
        console.log('   🏞️ Nearest POIs:')
        data.data.slice(0, 3).forEach(poi => {
          const distance = poi.distance_miles ? `${poi.distance_miles} mi` : 'unknown distance'
          console.log(`     - ${poi.name} (${distance}): ${poi.temperature}°F, ${poi.condition}`)
        })

      } catch (error) {
        console.log(`   ❌ Failed to test location: ${error.message}`)
        this.locationResults[location.name] = { error: error.message }
      }
    }
  }

  analyzeLocationWeather(poiData) {
    const temperatures = poiData
      .filter(poi => poi.temperature !== null && poi.temperature !== undefined)
      .map(poi => poi.temperature)

    const conditions = poiData
      .filter(poi => poi.condition && poi.condition !== 'null')
      .map(poi => poi.condition)

    const sources = {}
    poiData.forEach(poi => {
      if (poi.weather_source) {
        sources[poi.weather_source] = (sources[poi.weather_source] || 0) + 1
      }
    })

    return {
      tempMin: temperatures.length > 0 ? Math.min(...temperatures) : null,
      tempMax: temperatures.length > 0 ? Math.max(...temperatures) : null,
      tempAvg: temperatures.length > 0 ? Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length) : null,
      conditions: [...new Set(conditions)],
      sources,
      dataQuality: {
        withTemperature: temperatures.length,
        withCondition: conditions.length,
        total: poiData.length
      }
    }
  }

  async testWeatherBasedFiltering() {
    console.log('\n🎛️ SIMULATING WEATHER-BASED FILTERING')
    console.log('=' .repeat(70))

    // Test different filter scenarios across all locations
    const filterScenarios = [
      {
        name: "Find Warmest Locations",
        filter: poi => poi.temperature && poi.temperature >= 75,
        description: "POIs with temperature 75°F or higher"
      },
      {
        name: "Pleasant Weather Spots",
        filter: poi => poi.temperature >= 70 && poi.temperature <= 80 &&
                      poi.condition && ['Clear', 'Partly Cloudy', 'Sunny'].some(c =>
                        poi.condition.toLowerCase().includes(c.toLowerCase())),
        description: "70-80°F with clear/partly cloudy conditions"
      },
      {
        name: "Cooler Refuge Areas",
        filter: poi => poi.temperature && poi.temperature <= 70,
        description: "POIs with cooler temperatures (70°F or below)"
      },
      {
        name: "Clear Sky Destinations",
        filter: poi => poi.condition && poi.condition.toLowerCase().includes('clear'),
        description: "Locations with clear sky conditions"
      }
    ]

    for (const scenario of filterScenarios) {
      console.log(`\n🔍 ${scenario.name}:`)
      console.log(`   Filter: ${scenario.description}`)

      let totalMatches = 0
      let totalPOIs = 0
      const matchesByLocation = {}

      for (const [locationName, locationData] of Object.entries(this.locationResults)) {
        if (locationData.error) continue

        const matches = locationData.nearbyPOIs.filter(scenario.filter)
        matchesByLocation[locationName] = matches
        totalMatches += matches.length
        totalPOIs += locationData.nearbyPOIs.length

        if (matches.length > 0) {
          console.log(`   📍 ${locationName}: ${matches.length} matches`)
          matches.slice(0, 2).forEach(poi => {
            console.log(`     - ${poi.name}: ${poi.temperature}°F, ${poi.condition}`)
          })
        }
      }

      const percentage = totalPOIs > 0 ? ((totalMatches / totalPOIs) * 100).toFixed(1) : 0
      console.log(`   📊 Overall: ${totalMatches}/${totalPOIs} POIs match (${percentage}%)`)
    }
  }

  async testWeatherTrendAnalysis() {
    console.log('\n📈 WEATHER TREND ANALYSIS ACROSS LOCATIONS')
    console.log('=' .repeat(70))

    const locationStats = []

    for (const [name, data] of Object.entries(this.locationResults)) {
      if (data.error || !data.weatherStats) continue

      locationStats.push({
        name,
        avgTemp: data.weatherStats.tempAvg,
        tempRange: data.weatherStats.tempMax - data.weatherStats.tempMin,
        conditions: data.weatherStats.conditions,
        dataQuality: (data.weatherStats.dataQuality.withTemperature / data.weatherStats.dataQuality.total * 100).toFixed(0)
      })
    }

    // Sort by average temperature
    locationStats.sort((a, b) => (b.avgTemp || 0) - (a.avgTemp || 0))

    console.log('🌡️ Temperature Ranking (Warmest to Coolest):')
    locationStats.forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.name}: ${stat.avgTemp}°F avg (range: ${stat.tempRange}°F)`)
      console.log(`      Conditions: ${stat.conditions.join(', ')}`)
      console.log(`      Data quality: ${stat.dataQuality}%`)
    })

    // Analyze temperature variation
    const temperatures = locationStats.map(s => s.avgTemp).filter(t => t !== null)
    if (temperatures.length > 0) {
      const tempVariation = Math.max(...temperatures) - Math.min(...temperatures)
      console.log(`\n📊 Temperature Variation Across Locations: ${tempVariation}°F`)

      if (tempVariation > 10) {
        console.log('   🎯 High variation - location-based filtering would be very effective')
      } else if (tempVariation > 5) {
        console.log('   ✅ Moderate variation - location-based filtering would be useful')
      } else {
        console.log('   ⚠️ Low variation - weather filtering may be less impactful')
      }
    }
  }

  async generateLocationWeatherReport() {
    console.log('\n📋 LOCATION-BASED WEATHER IMPACT REPORT')
    console.log('=' .repeat(80))

    const validLocations = Object.entries(this.locationResults)
      .filter(([name, data]) => !data.error)

    console.log(`🗺️ Tested Locations: ${validLocations.length}`)

    // Overall statistics
    let totalPOIs = 0
    let totalWithWeather = 0
    const allTemperatures = []
    const allConditions = []

    validLocations.forEach(([name, data]) => {
      totalPOIs += data.poiCount

      if (data.weatherStats) {
        totalWithWeather += data.weatherStats.dataQuality.withTemperature

        if (data.weatherStats.tempAvg) {
          allTemperatures.push(data.weatherStats.tempAvg)
        }

        allConditions.push(...data.weatherStats.conditions)
      }
    })

    console.log(`📊 Overall Statistics:`)
    console.log(`   Total POIs across locations: ${totalPOIs}`)
    console.log(`   POIs with weather data: ${totalWithWeather}`)
    console.log(`   Weather coverage: ${totalPOIs > 0 ? ((totalWithWeather/totalPOIs)*100).toFixed(1) : 0}%`)

    if (allTemperatures.length > 0) {
      const minTemp = Math.min(...allTemperatures)
      const maxTemp = Math.max(...allTemperatures)
      const avgTemp = Math.round(allTemperatures.reduce((a, b) => a + b, 0) / allTemperatures.length)

      console.log(`🌡️ Temperature Analysis:`)
      console.log(`   Statewide range: ${minTemp}°F - ${maxTemp}°F`)
      console.log(`   Average across locations: ${avgTemp}°F`)
      console.log(`   Temperature variation: ${maxTemp - minTemp}°F`)
    }

    const uniqueConditions = [...new Set(allConditions)]
    console.log(`☁️ Weather Conditions Found: ${uniqueConditions.join(', ')}`)

    console.log('\n💡 WEATHER FILTERING RECOMMENDATIONS:')

    if (allTemperatures.length > 0 && (Math.max(...allTemperatures) - Math.min(...allTemperatures)) > 5) {
      console.log('✅ Temperature-based filtering highly recommended:')
      console.log('   - Implement temperature range sliders')
      console.log('   - Add "Find Warmer/Cooler Areas" quick filters')
      console.log('   - Location-based weather comparison features')
    }

    if (uniqueConditions.length > 1) {
      console.log('✅ Condition-based filtering viable:')
      console.log('   - Weather condition checkboxes')
      console.log('   - "Good Weather Only" quick filter')
      console.log('   - "Avoid Bad Weather" exclusion options')
    }

    console.log('✅ Location-aware weather features:')
    console.log('   - Show weather variation across search area')
    console.log('   - Highlight best weather locations on map')
    console.log('   - Weather-based POI ranking and recommendations')

    return {
      locationsTest: validLocations.length,
      totalPOIs,
      weatherCoverage: totalPOIs > 0 ? ((totalWithWeather/totalPOIs)*100) : 0,
      temperatureVariation: allTemperatures.length > 0 ? Math.max(...allTemperatures) - Math.min(...allTemperatures) : 0,
      conditionVariety: uniqueConditions.length,
      filteringViable: allTemperatures.length > 0 && uniqueConditions.length > 1
    }
  }
}

async function main() {
  const tester = new WeatherLocationTester()

  try {
    // Check if localhost API is available
    const healthCheck = await fetch(`${API_BASE}/api/health`)
    if (!healthCheck.ok) {
      console.log('❌ Localhost API not available - start the server first')
      process.exit(1)
    }

    console.log('🧪 WEATHER LOCATION IMPACT TESTING')
    console.log('=' .repeat(80))

    await tester.testLocationWeatherVariation()
    await tester.testWeatherBasedFiltering()
    await tester.testWeatherTrendAnalysis()

    const reportStats = await tester.generateLocationWeatherReport()

    console.log('\n🎉 CONCLUSION')
    console.log('-' .repeat(40))

    if (reportStats.filteringViable && reportStats.temperatureVariation > 5) {
      console.log('✅ Weather filtering will significantly improve user experience!')
      console.log('🚀 Ready for weather filter UI implementation')
    } else {
      console.log('⚠️ Weather filtering may provide limited benefits')
      console.log('📊 Consider additional weather data sources or different filter approaches')
    }

  } catch (error) {
    console.error('❌ Testing failed:', error)
    process.exit(1)
  }
}

main()
