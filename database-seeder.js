#!/usr/bin/env node

// Database Seeder - Handles all data loading strategies without schema changes
// This replaces database schema modifications with flexible data strategies

const { Pool } = require('pg')
const { PracticalWeatherSimulation } = require('./practical-weather-implementation.js')

require('dotenv').config()

class DatabaseSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
    
    this.weatherSimulator = new PracticalWeatherSimulation()
    
    // Minnesota cities with accurate coordinates
    this.minnesotaCities = [
      { name: 'Minneapolis', lat: 44.977800, lng: -93.265000, region: 'Metro', type: 'urban' },
      { name: 'Duluth', lat: 46.786700, lng: -92.100500, region: 'North Shore', type: 'lakeside' },
      { name: 'Brainerd', lat: 46.358000, lng: -94.200800, region: 'Lakes', type: 'resort' },
      { name: 'Rochester', lat: 44.012100, lng: -92.480200, region: 'Southeast', type: 'city' },
      { name: 'Ely', lat: 47.903000, lng: -91.866800, region: 'Boundary Waters', type: 'wilderness' },
      { name: 'Grand Rapids', lat: 47.236900, lng: -93.530800, region: 'North Central', type: 'forest' },
      { name: 'International Falls', lat: 48.600900, lng: -93.406700, region: 'Border', type: 'border' },
      { name: 'Alexandria', lat: 45.885200, lng: -95.377500, region: 'Lake Country', type: 'lake_town' },
      { name: 'Bemidji', lat: 47.473700, lng: -94.880300, region: 'North Woods', type: 'college_town' },
      { name: 'St. Cloud', lat: 45.557900, lng: -94.163200, region: 'Central', type: 'river_city' }
    ]
  }

  async seedDatabase(environment = 'development') {
    console.log(`🌱 Seeding database for ${environment} environment`)
    
    try {
      // Always load the same stable locations
      await this.ensureLocationsExist()
      
      // Load weather data based on environment strategy
      switch(environment) {
        case 'development':
          await this.seedDevelopmentWeather()
          break
        case 'testing':
          await this.seedTestingWeather()
          break
        case 'demo':
          await this.seedDemoWeather()
          break
        case 'production':
          await this.seedProductionWeather()
          break
        default:
          await this.seedDevelopmentWeather()
      }
      
      console.log('✅ Database seeding complete')
      return { success: true, environment }
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error)
      throw error
    }
  }

  async ensureLocationsExist() {
    console.log('📍 Ensuring locations are loaded...')
    
    // Check if locations already exist
    const existingCount = await this.pool.query('SELECT COUNT(*) FROM locations')
    
    if (parseInt(existingCount.rows[0].count) >= 10) {
      console.log(`✅ Found ${existingCount.rows[0].count} existing locations`)
      return
    }
    
    // Clear existing data if incomplete
    await this.pool.query('DELETE FROM weather_conditions')
    await this.pool.query('DELETE FROM locations')
    
    // Insert all Minnesota cities
    for (const city of this.minnesotaCities) {
      await this.pool.query(
        `INSERT INTO locations (name, lat, lng, region, location_type) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [city.name, city.lat, city.lng, city.region, city.type]
      )
    }
    
    console.log(`✅ Loaded ${this.minnesotaCities.length} Minnesota locations`)
  }

  async seedDevelopmentWeather() {
    console.log('🌤️ Generating development weather data...')
    
    // Clear existing weather data
    await this.pool.query('DELETE FROM weather_conditions')
    
    // Get all locations
    const locations = await this.pool.query('SELECT id, name FROM locations ORDER BY name')
    
    // Generate realistic weather for each location
    for (const location of locations.rows) {
      const weather = this.weatherSimulator.generateWeather(location.name)
      
      await this.pool.query(
        `INSERT INTO weather_conditions 
         (location_id, temperature, condition, precipitation, wind_speed, 
          description, comfort_index, activity_suitability, data_source, generated_at, valid_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          location.id,
          weather.temperature,
          weather.condition,
          weather.precipitation,
          weather.windSpeed,
          `${weather.condition} conditions in ${location.name} area`,
          weather.comfort_index,
          JSON.stringify(weather.activity_suitability),
          'intelligent_simulation',
          new Date(),
          new Date(Date.now() + 4 * 60 * 60 * 1000) // Valid for 4 hours
        ]
      )
    }
    
    console.log(`✅ Generated weather data for ${locations.rows.length} locations`)
  }

  async seedTestingWeather() {
    console.log('🧪 Generating testing weather scenarios...')
    
    await this.pool.query('DELETE FROM weather_conditions')
    
    const locations = await this.pool.query('SELECT id, name FROM locations ORDER BY name')
    
    // Create diverse test scenarios
    const testScenarios = [
      { temp: 75, condition: 'Sunny', precip: 0, wind: 5, desc: 'Perfect weather' },
      { temp: 45, condition: 'Cloudy', precip: 60, wind: 15, desc: 'Challenging conditions' },
      { temp: 85, condition: 'Hot', precip: 10, wind: 20, desc: 'Hot and windy' },
      { temp: 65, condition: 'Partly Cloudy', precip: 20, wind: 8, desc: 'Good conditions' },
      { temp: 55, condition: 'Overcast', precip: 40, wind: 12, desc: 'Marginal weather' }
    ]
    
    for (let i = 0; i < locations.rows.length; i++) {
      const location = locations.rows[i]
      const scenario = testScenarios[i % testScenarios.length]
      
      await this.pool.query(
        `INSERT INTO weather_conditions 
         (location_id, temperature, condition, precipitation, wind_speed, 
          description, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          location.id,
          scenario.temp,
          scenario.condition,
          scenario.precip,
          scenario.wind,
          scenario.desc,
          'test_scenarios'
        ]
      )
    }
    
    console.log(`✅ Generated test scenarios for ${locations.rows.length} locations`)
  }

  async seedDemoWeather() {
    console.log('🎪 Generating demo weather data...')
    
    await this.pool.query('DELETE FROM weather_conditions')
    
    const locations = await this.pool.query('SELECT id, name FROM locations ORDER BY name')
    
    // Create impressive, varied weather for demos
    for (const location of locations.rows) {
      const weather = this.weatherSimulator.generateWeather(location.name)
      
      // Enhance for demo appeal
      let enhancedTemp = weather.temperature
      let enhancedPrecip = Math.max(0, weather.precipitation - 10) // Reduce rain
      let enhancedDescription = this.generateDemoDescription(location.name, weather)
      
      await this.pool.query(
        `INSERT INTO weather_conditions 
         (location_id, temperature, condition, precipitation, wind_speed, 
          description, comfort_index, activity_suitability, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          location.id,
          enhancedTemp,
          weather.condition,
          enhancedPrecip,
          weather.windSpeed,
          enhancedDescription,
          weather.comfort_index,
          JSON.stringify(weather.activity_suitability),
          'demo_optimized'
        ]
      )
    }
    
    console.log(`✅ Generated demo-optimized weather for ${locations.rows.length} locations`)
  }

  async seedProductionWeather() {
    console.log('🏭 Generating production weather data...')
    
    // For production, we'd integrate with real weather APIs
    // For now, use high-quality simulation
    await this.seedDevelopmentWeather()
    
    // Update data source to indicate production readiness
    await this.pool.query(
      `UPDATE weather_conditions 
       SET data_source = 'production_simulation', 
           valid_until = NOW() + INTERVAL '2 hours'`
    )
    
    console.log('✅ Production weather data ready')
  }

  generateDemoDescription(locationName, weather) {
    const positive = [
      `Excellent ${weather.condition.toLowerCase()} conditions in ${locationName}`,
      `Perfect weather for exploring ${locationName} area`,
      `Beautiful ${weather.temperature}°F with ${weather.condition.toLowerCase()} skies`,
      `Great outdoor weather in the ${locationName} region`,
      `Ideal conditions for ${locationName} activities`
    ]
    
    return positive[Math.floor(Math.random() * positive.length)]
  }

  async getCurrentWeatherData() {
    const result = await this.pool.query(`
      SELECT 
        l.id,
        l.name,
        l.lat,
        l.lng,
        w.temperature,
        w.condition,
        w.description,
        w.precipitation,
        w.wind_speed,
        w.data_source,
        w.generated_at
      FROM locations l
      JOIN weather_conditions w ON l.id = w.location_id
      ORDER BY l.name
    `)
    
    return result.rows
  }

  async close() {
    await this.pool.end()
  }
}

// CLI Interface
if (require.main === module) {
  const environment = process.argv[2] || 'development'
  
  console.log('🚀 Starting database seeding...')
  
  const seeder = new DatabaseSeeder()
  
  seeder.seedDatabase(environment)
    .then((result) => {
      console.log(`✅ Successfully seeded database for ${result.environment}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error.message)
      process.exit(1)
    })
    .finally(() => {
      seeder.close()
    })
}

module.exports = { DatabaseSeeder }