#!/usr/bin/env node
/**
 * ========================================================================
 * API WEATHER ANALYSIS - Weather Filter Impact Evaluation
 * ========================================================================
 * 
 * Analyzes weather data from API endpoints to understand filtering potential
 */

import dotenv from 'dotenv'

dotenv.config()

const API_ENDPOINTS = {
  localhost: 'http://localhost:4000',
  preview: 'https://p.nearestniceweather.com'
}

class WeatherDataAnalyzer {
  constructor() {
    this.results = {}
  }

  async fetchWeatherData(envName, apiBase) {
    console.log(`🌤️ Fetching weather data for ${envName}`)
    
    try {
      // Fetch POI data with weather
      const response = await fetch(`${apiBase}/api/poi-locations-with-weather?limit=50`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(`API request failed: ${data.error}`)
      }
      
      console.log(`  📊 Retrieved ${data.count} POIs with weather data`)
      
      // Analyze weather data quality and distribution
      const weatherAnalysis = this.analyzeWeatherData(data.data)
      
      this.results[envName] = {
        totalPOIs: data.count,
        rawData: data.data,
        analysis: weatherAnalysis,
        timestamp: data.timestamp
      }
      
      return weatherAnalysis
      
    } catch (error) {
      console.log(`  ❌ Failed to fetch weather data: ${error.message}`)
      this.results[envName] = { error: error.message }
      return null
    }
  }

  analyzeWeatherData(poiData) {
    const analysis = {
      dataQuality: {
        withTemperature: 0,
        withCondition: 0,
        withWeatherSource: 0,
        complete: 0
      },
      temperatureStats: {
        min: null,
        max: null,
        average: null,
        distribution: {}
      },
      conditionStats: {
        unique: [],
        distribution: {}
      },
      weatherSources: {},
      filteringPotential: {
        temperatureRanges: {},
        conditionGroups: {},
        recommendations: []
      }
    }
    
    const temperatures = []
    const conditions = []
    
    // Analyze each POI
    poiData.forEach(poi => {
      // Data quality checks
      if (poi.temperature !== null && poi.temperature !== undefined) {
        analysis.dataQuality.withTemperature++
        temperatures.push(poi.temperature)
      }
      
      if (poi.condition && poi.condition !== 'null') {
        analysis.dataQuality.withCondition++
        conditions.push(poi.condition)
      }
      
      if (poi.weather_source) {
        analysis.dataQuality.withWeatherSource++
        analysis.weatherSources[poi.weather_source] = (analysis.weatherSources[poi.weather_source] || 0) + 1
      }
      
      if (poi.temperature && poi.condition && poi.weather_source) {
        analysis.dataQuality.complete++
      }
    })
    
    // Temperature statistics
    if (temperatures.length > 0) {
      analysis.temperatureStats.min = Math.min(...temperatures)
      analysis.temperatureStats.max = Math.max(...temperatures)
      analysis.temperatureStats.average = Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length)
      
      // Temperature distribution in ranges
      const ranges = {
        'freezing': [0, 32],
        'cold': [33, 50],
        'cool': [51, 65],
        'pleasant': [66, 75],
        'warm': [76, 85],
        'hot': [86, 100]
      }
      
      for (const [rangeName, [min, max]] of Object.entries(ranges)) {
        const count = temperatures.filter(temp => temp >= min && temp <= max).length
        analysis.temperatureStats.distribution[rangeName] = count
        analysis.filteringPotential.temperatureRanges[rangeName] = count
      }
    }
    
    // Condition statistics
    if (conditions.length > 0) {
      analysis.conditionStats.unique = [...new Set(conditions)]
      
      conditions.forEach(condition => {
        analysis.conditionStats.distribution[condition] = (analysis.conditionStats.distribution[condition] || 0) + 1
      })
      
      // Group conditions for filtering potential
      const conditionGroups = {
        'excellent': ['Clear', 'Sunny'],
        'good': ['Partly Cloudy', 'Mostly Sunny'],
        'fair': ['Cloudy', 'Mostly Cloudy', 'Overcast'],
        'poor': ['Rain', 'Showers', 'Drizzle'],
        'bad': ['Thunderstorm', 'Snow', 'Sleet', 'Hail']
      }
      
      for (const [groupName, conditionList] of Object.entries(conditionGroups)) {
        const count = conditions.filter(condition => 
          conditionList.some(c => condition.toLowerCase().includes(c.toLowerCase()))
        ).length
        analysis.filteringPotential.conditionGroups[groupName] = count
      }
    }
    
    // Generate filtering recommendations
    this.generateFilteringRecommendations(analysis, poiData.length)
    
    return analysis
  }

  generateFilteringRecommendations(analysis, totalPOIs) {
    const recs = analysis.filteringPotential.recommendations
    
    // Data quality recommendations
    const completePercentage = (analysis.dataQuality.complete / totalPOIs * 100).toFixed(1)
    if (completePercentage < 90) {
      recs.push(`Only ${completePercentage}% of POIs have complete weather data - improve weather API coverage`)
    }
    
    // Temperature-based filtering recommendations
    const tempRanges = analysis.filteringPotential.temperatureRanges
    const hasGoodTempDistribution = Object.values(tempRanges).some(count => count > 0)
    
    if (hasGoodTempDistribution) {
      recs.push('Temperature-based filtering is viable - implement temperature range controls')
      
      // Specific range recommendations
      if (tempRanges.pleasant > 0 || tempRanges.warm > 0) {
        recs.push(`Good weather filtering potential: ${tempRanges.pleasant + tempRanges.warm} POIs in pleasant/warm range`)
      }
      
      if (tempRanges.cold > 0 || tempRanges.freezing > 0) {
        recs.push(`Winter activity filtering potential: ${tempRanges.cold + tempRanges.freezing} POIs in cold range`)
      }
    } else {
      recs.push('Temperature data insufficient for effective filtering')
    }
    
    // Condition-based filtering recommendations
    const conditionGroups = analysis.filteringPotential.conditionGroups
    const totalWithConditions = Object.values(conditionGroups).reduce((a, b) => a + b, 0)
    
    if (totalWithConditions > 0) {
      recs.push('Weather condition filtering is viable - implement condition-based controls')
      
      if (conditionGroups.excellent + conditionGroups.good > 0) {
        recs.push(`Good weather filtering: ${conditionGroups.excellent + conditionGroups.good} POIs with favorable conditions`)
      }
      
      if (conditionGroups.poor + conditionGroups.bad > 0) {
        recs.push(`Bad weather avoidance: ${conditionGroups.poor + conditionGroups.bad} POIs with unfavorable conditions`)
      }
    } else {
      recs.push('Weather condition data insufficient for effective filtering')
    }
    
    // User experience recommendations
    if (analysis.dataQuality.complete / totalPOIs > 0.8) {
      recs.push('Implement weather-based POI ranking (prioritize good weather locations)')
      recs.push('Add weather-based activity suggestions')
    }
  }

  async testWeatherFilterScenarios(envName) {
    console.log(`\n🧪 Testing weather filter scenarios for ${envName}`)
    
    const envData = this.results[envName]
    if (!envData || envData.error) {
      console.log('  ❌ No valid weather data available for testing')
      return
    }
    
    const poiData = envData.rawData
    const scenarios = {
      pleasantWeather: this.filterPOIs(poiData, { tempMin: 70, tempMax: 80, goodConditions: ['Clear', 'Sunny', 'Partly Cloudy'] }),
      warmWeather: this.filterPOIs(poiData, { tempMin: 75 }),
      coolWeather: this.filterPOIs(poiData, { tempMax: 65 }),
      clearSkies: this.filterPOIs(poiData, { goodConditions: ['Clear', 'Sunny'] }),
      avoidRain: this.filterPOIs(poiData, { badConditions: ['Rain', 'Showers', 'Drizzle', 'Thunderstorm'] }),
      outdoorFriendly: this.filterPOIs(poiData, { tempMin: 60, tempMax: 80, goodConditions: ['Clear', 'Sunny', 'Partly Cloudy'] })
    }
    
    console.log('  📊 Filter Scenario Results:')
    for (const [scenarioName, results] of Object.entries(scenarios)) {
      const percentage = ((results.length / poiData.length) * 100).toFixed(1)
      console.log(`    ${scenarioName}: ${results.length}/${poiData.length} POIs (${percentage}%)`)
      
      if (results.length > 0) {
        const samplePOI = results[0]
        console.log(`      Sample: ${samplePOI.name} - ${samplePOI.temperature}°F, ${samplePOI.condition}`)
      }
    }
    
    return scenarios
  }

  filterPOIs(poiData, criteria) {
    return poiData.filter(poi => {
      // Temperature filtering
      if (criteria.tempMin && (!poi.temperature || poi.temperature < criteria.tempMin)) return false
      if (criteria.tempMax && (!poi.temperature || poi.temperature > criteria.tempMax)) return false
      
      // Good conditions filtering
      if (criteria.goodConditions && poi.condition) {
        const hasGoodCondition = criteria.goodConditions.some(condition => 
          poi.condition.toLowerCase().includes(condition.toLowerCase())
        )
        if (!hasGoodCondition) return false
      }
      
      // Bad conditions filtering (for avoidance scenarios)
      if (criteria.badConditions && poi.condition) {
        const hasBadCondition = criteria.badConditions.some(condition => 
          poi.condition.toLowerCase().includes(condition.toLowerCase())
        )
        return hasBadCondition // Return true if we're looking for bad conditions to avoid
      }
      
      return true
    })
  }

  async generateWeatherFilterReport() {
    console.log('\n📋 WEATHER FILTER ANALYSIS REPORT')
    console.log('=' .repeat(80))
    
    for (const [env, data] of Object.entries(this.results)) {
      if (data.error) {
        console.log(`\n❌ ${env.toUpperCase()}: ${data.error}`)
        continue
      }
      
      console.log(`\n🌍 ${env.toUpperCase()} ENVIRONMENT`)
      console.log('-' .repeat(60))
      
      const analysis = data.analysis
      
      // Data Quality Summary
      console.log('📊 Weather Data Quality:')
      console.log(`  Total POIs: ${data.totalPOIs}`)
      console.log(`  With Temperature: ${analysis.dataQuality.withTemperature} (${(analysis.dataQuality.withTemperature/data.totalPOIs*100).toFixed(1)}%)`)
      console.log(`  With Condition: ${analysis.dataQuality.withCondition} (${(analysis.dataQuality.withCondition/data.totalPOIs*100).toFixed(1)}%)`)
      console.log(`  Complete Weather Data: ${analysis.dataQuality.complete} (${(analysis.dataQuality.complete/data.totalPOIs*100).toFixed(1)}%)`)
      
      // Temperature Statistics
      if (analysis.temperatureStats.min !== null) {
        console.log('\n🌡️ Temperature Analysis:')
        console.log(`  Range: ${analysis.temperatureStats.min}°F - ${analysis.temperatureStats.max}°F`)
        console.log(`  Average: ${analysis.temperatureStats.average}°F`)
        console.log('  Distribution:')
        for (const [range, count] of Object.entries(analysis.temperatureStats.distribution)) {
          if (count > 0) {
            console.log(`    ${range}: ${count} POIs`)
          }
        }
      }
      
      // Weather Conditions
      if (analysis.conditionStats.unique.length > 0) {
        console.log('\n☁️ Weather Conditions:')
        console.log(`  Unique conditions: ${analysis.conditionStats.unique.join(', ')}`)
        console.log('  Distribution:')
        for (const [condition, count] of Object.entries(analysis.conditionStats.distribution)) {
          console.log(`    ${condition}: ${count} POIs`)
        }
      }
      
      // Weather Sources
      if (Object.keys(analysis.weatherSources).length > 0) {
        console.log('\n📡 Weather Data Sources:')
        for (const [source, count] of Object.entries(analysis.weatherSources)) {
          console.log(`  ${source}: ${count} POIs`)
        }
      }
      
      // Filtering Potential
      console.log('\n🎛️ Filtering Potential:')
      for (const [group, count] of Object.entries(analysis.filteringPotential.conditionGroups)) {
        if (count > 0) {
          console.log(`  ${group} weather: ${count} POIs`)
        }
      }
      
      // Recommendations
      if (analysis.filteringPotential.recommendations.length > 0) {
        console.log('\n💡 Recommendations:')
        analysis.filteringPotential.recommendations.forEach(rec => {
          console.log(`  - ${rec}`)
        })
      }
    }
    
    // Overall Assessment
    console.log('\n🏆 OVERALL WEATHER FILTERING ASSESSMENT')
    console.log('-' .repeat(60))
    
    const environments = Object.keys(this.results).filter(env => !this.results[env].error)
    let totalPOIs = 0
    let completeWeatherData = 0
    
    environments.forEach(env => {
      totalPOIs += this.results[env].totalPOIs
      completeWeatherData += this.results[env].analysis.dataQuality.complete
    })
    
    const weatherCoverage = totalPOIs > 0 ? (completeWeatherData / totalPOIs * 100).toFixed(1) : 0
    
    console.log(`Weather Data Coverage: ${weatherCoverage}% (${completeWeatherData}/${totalPOIs} POIs)`)
    
    if (parseFloat(weatherCoverage) >= 80) {
      console.log('✅ Excellent weather data coverage - ready for comprehensive filtering')
    } else if (parseFloat(weatherCoverage) >= 60) {
      console.log('✅ Good weather data coverage - filtering viable with improvements')
    } else {
      console.log('⚠️ Limited weather data coverage - filtering functionality will be limited')
    }
    
    console.log('\n🎯 IMPLEMENTATION PRIORITIES:')
    if (parseFloat(weatherCoverage) >= 60) {
      console.log('1. 🎛️ HIGH: Implement weather filter UI components')
      console.log('   - Temperature range sliders')
      console.log('   - Weather condition checkboxes')
      console.log('   - Quick filter buttons (Good Weather, Avoid Rain, etc.)')
      console.log('2. 📊 MEDIUM: Weather-based POI ranking')
      console.log('3. 🎯 LOW: Advanced weather-based activity suggestions')
    } else {
      console.log('1. 🌤️ CRITICAL: Improve weather API coverage and reliability')
      console.log('2. 📊 HIGH: Add weather data validation and fallback systems')
      console.log('3. 🎛️ MEDIUM: Implement basic filtering for available weather data')
    }
    
    return {
      environmentsTested: environments.length,
      totalPOIs,
      weatherCoverage: parseFloat(weatherCoverage),
      readyForFiltering: parseFloat(weatherCoverage) >= 60
    }
  }
}

async function main() {
  const analyzer = new WeatherDataAnalyzer()
  
  try {
    // Test available environments
    for (const [envName, apiBase] of Object.entries(API_ENDPOINTS)) {
      if (envName === 'localhost') {
        try {
          const healthCheck = await fetch(`${apiBase}/api/health`)
          if (!healthCheck.ok) {
            console.log(`⚠️ Localhost not running, skipping ${envName}`)
            continue
          }
        } catch (error) {
          console.log(`⚠️ Localhost not accessible, skipping ${envName}`)
          continue
        }
      }
      
      console.log(`\n🔍 ANALYZING WEATHER DATA: ${envName.toUpperCase()}`)
      console.log('=' .repeat(70))
      
      const analysis = await analyzer.fetchWeatherData(envName, apiBase)
      if (analysis) {
        await analyzer.testWeatherFilterScenarios(envName)
      }
    }
    
    // Generate comprehensive report
    const stats = await analyzer.generateWeatherFilterReport()
    
    console.log('\n✅ Weather Filter Analysis Complete!')
    
    if (stats.readyForFiltering) {
      console.log('🎉 System ready for weather-based filtering implementation!')
    } else {
      console.log('⚠️ Improve weather data coverage before implementing filtering')
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

main()