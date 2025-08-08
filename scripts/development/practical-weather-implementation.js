// Practical Weather Implementation: Intelligent Simulation for Development
// Zero-cost weather data that feels realistic and supports contextual discovery

class PracticalWeatherSimulation {
  constructor() {
    // Minnesota climate baselines from historical data
    this.climateBases = {
      spring: { temp: [45, 70], precip: [25, 45], wind: [8, 18] },
      summer: { temp: [65, 85], precip: [15, 35], wind: [5, 15] },
      fall: { temp: [35, 65], precip: [30, 50], wind: [10, 20] },
      winter: { temp: [10, 35], precip: [40, 70], wind: [12, 25] }
    }
    
    // Location characteristics for realistic variation
    this.locationProfiles = {
      'Minneapolis': { type: 'urban', tempMod: +2, precipMod: -5, windMod: -2 },
      'Duluth': { type: 'lakeside', tempMod: -3, precipMod: +10, windMod: +5 },
      'Brainerd': { type: 'forest', tempMod: -2, precipMod: +5, windMod: -3 },
      'Rochester': { type: 'plains', tempMod: +1, precipMod: -2, windMod: +3 },
      'Ely': { type: 'wilderness', tempMod: -4, precipMod: +8, windMod: +2 },
      'Grand Rapids': { type: 'forest', tempMod: -2, precipMod: +5, windMod: -1 },
      'International Falls': { type: 'border', tempMod: -3, precipMod: +8, windMod: +4 },
      'Alexandria': { type: 'lake_country', tempMod: -1, precipMod: +3, windMod: +1 },
      'Bemidji': { type: 'forest_lake', tempMod: -2, precipMod: +6, windMod: +2 },
      'St. Cloud': { type: 'river_valley', tempMod: 0, precipMod: +2, windMod: 0 }
    }
    
    // Condition patterns that feel realistic
    this.seasonalConditions = {
      spring: ['Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear', 'Overcast'],
      summer: ['Sunny', 'Clear', 'Partly Cloudy', 'Thunderstorms', 'Hot'],
      fall: ['Partly Cloudy', 'Overcast', 'Light Rain', 'Clear', 'Foggy'],
      winter: ['Snow', 'Overcast', 'Partly Cloudy', 'Clear', 'Blizzard']
    }
  }
  
  // Generate realistic weather for a specific location and time
  generateWeather(locationName, timestamp = new Date()) {
    const season = this.getSeason(timestamp)
    const timeOfDay = this.getTimeOfDay(timestamp)
    const dayPattern = this.getDayPattern(timestamp)
    
    // Get location profile
    const profile = this.locationProfiles[locationName] || { 
      type: 'generic', tempMod: 0, precipMod: 0, windMod: 0 
    }
    
    // Get seasonal baseline
    const baseline = this.climateBases[season]
    
    // Generate base values with realistic randomness
    let temperature = this.generateTemperature(baseline.temp, profile.tempMod, timeOfDay, dayPattern)
    let precipitation = this.generatePrecipitation(baseline.precip, profile.precipMod, dayPattern)
    let windSpeed = this.generateWind(baseline.wind, profile.windMod, profile.type)
    let condition = this.generateCondition(season, temperature, precipitation, windSpeed)
    
    // Time-of-day variations already applied in generateTemperature
    
    // Generate activity suitability scores
    const activitySuitability = this.calculateActivitySuitability(
      temperature, precipitation, windSpeed, condition
    )
    
    // Calculate relative niceness (compared to seasonal norms)
    const relativeNiceness = this.calculateRelativeNiceness(
      temperature, precipitation, windSpeed, season
    )
    
    return {
      temperature: Math.round(temperature),
      condition,
      precipitation: Math.round(precipitation),
      windSpeed: Math.round(windSpeed),
      
      // Enhanced contextual data
      comfort_index: this.calculateComfortIndex(temperature, precipitation, windSpeed),
      activity_suitability: activitySuitability,
      relative_niceness: relativeNiceness,
      
      // Temporal context
      is_improving: this.calculateTrend(dayPattern, 'improving'),
      is_stable: this.calculateTrend(dayPattern, 'stable'),
      best_time_window: this.calculateBestTimeWindow(timeOfDay, condition),
      
      // Meta information
      generated_at: timestamp.toISOString(),
      simulation_seed: this.generateSeed(locationName, timestamp)
    }
  }
  
  // Generate all weather locations for API response
  generateAllLocations(locationNames, userLocation = null) {
    const now = new Date()
    const locations = locationNames.map(name => {
      // Create slight time variation for each location (weather moves)
      const locationTime = new Date(now.getTime() + (Math.random() - 0.5) * 3600000) // ±30 min
      const weather = this.generateWeather(name, locationTime)
      
      // Get coordinates (would come from database in real implementation)
      const coords = this.getLocationCoords(name)
      
      // Calculate distance if user location provided
      let distance_miles = null
      if (userLocation) {
        distance_miles = this.calculateDistance(userLocation, coords)
      }
      
      return {
        id: this.generateLocationId(name),
        name: name,
        lat: coords.lat,
        lng: coords.lng,
        distance_miles,
        ...weather,
        
        // Enhanced description based on weather
        description: this.generateContextualDescription(name, weather)
      }
    })
    
    // Sort by distance if user location provided, otherwise by name
    if (userLocation) {
      locations.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0))
    } else {
      locations.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return locations
  }
  
  // Helper methods for realistic weather generation
  getSeason(date) {
    const month = date.getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'fall'
    return 'winter'
  }
  
  getTimeOfDay(date) {
    const hour = date.getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'night'
  }
  
  getDayPattern(date) {
    // Create semi-predictable weather patterns based on date
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
    const pattern = (dayOfYear * 7 + date.getDate()) % 10
    
    if (pattern <= 3) return 'stable'
    if (pattern <= 6) return 'improving'
    if (pattern <= 8) return 'mixed'
    return 'deteriorating'
  }
  
  generateTemperature(range, modifier, timeOfDay, dayPattern) {
    let base = range[0] + Math.random() * (range[1] - range[0])
    base += modifier
    
    // Time of day variations
    const timeAdjustments = {
      morning: -3,
      afternoon: +2,
      evening: -1,
      night: -4
    }
    base += timeAdjustments[timeOfDay] || 0
    
    // Day pattern influence
    const patternAdjustments = {
      stable: 0,
      improving: +3,
      mixed: Math.random() * 6 - 3,
      deteriorating: -2
    }
    base += patternAdjustments[dayPattern] || 0
    
    return Math.max(10, Math.min(100, base)) // Reasonable bounds
  }
  
  generatePrecipitation(range, modifier, dayPattern) {
    let base = range[0] + Math.random() * (range[1] - range[0])
    base += modifier
    
    // Day pattern strongly affects precipitation
    const patternMultipliers = {
      stable: 1.0,
      improving: 0.6,
      mixed: 1.2,
      deteriorating: 1.5
    }
    base *= patternMultipliers[dayPattern] || 1.0
    
    return Math.max(0, Math.min(100, base))
  }
  
  generateWind(range, modifier, locationType) {
    let base = range[0] + Math.random() * (range[1] - range[0])
    base += modifier
    
    // Location type affects wind
    const typeMultipliers = {
      lakeside: 1.3,
      plains: 1.2,
      forest: 0.8,
      urban: 0.9,
      wilderness: 1.1
    }
    base *= typeMultipliers[locationType] || 1.0
    
    return Math.max(0, Math.min(40, base))
  }
  
  generateCondition(season, temperature, precipitation, windSpeed) {
    const conditions = this.seasonalConditions[season]
    
    // Weather logic for realistic conditions
    if (precipitation > 60) {
      return season === 'winter' ? 'Snow' : 'Heavy Rain'
    }
    if (precipitation > 30) {
      return season === 'winter' ? 'Light Snow' : 'Light Rain'
    }
    if (windSpeed > 25) {
      return 'Windy'
    }
    if (temperature > 85) {
      return 'Hot'
    }
    if (precipitation < 10 && temperature > 75) {
      return Math.random() > 0.5 ? 'Sunny' : 'Clear'
    }
    
    // Default to seasonal pattern
    return conditions[Math.floor(Math.random() * conditions.length)]
  }
  
  calculateActivitySuitability(temperature, precipitation, windSpeed, condition) {
    return {
      hiking: this.scoreActivity(temperature, [55, 75], precipitation, 25, windSpeed, 20),
      fishing: this.scoreActivity(temperature, [60, 80], precipitation, 40, windSpeed, 15),
      photography: this.scoreActivity(temperature, [40, 85], precipitation, 20, windSpeed, 25),
      camping: this.scoreActivity(temperature, [50, 80], precipitation, 15, windSpeed, 18),
      sightseeing: this.scoreActivity(temperature, [55, 85], precipitation, 30, windSpeed, 20)
    }
  }
  
  scoreActivity(temp, tempRange, precip, maxPrecip, wind, maxWind) {
    let score = 1.0
    
    // Temperature scoring
    if (temp >= tempRange[0] && temp <= tempRange[1]) {
      score *= 1.0
    } else {
      const tempDiff = Math.min(Math.abs(temp - tempRange[0]), Math.abs(temp - tempRange[1]))
      score *= Math.max(0.3, 1 - (tempDiff / 20))
    }
    
    // Precipitation scoring
    score *= Math.max(0.2, 1 - (precip / maxPrecip))
    
    // Wind scoring
    score *= Math.max(0.3, 1 - (wind / maxWind))
    
    return Math.round(score * 100) / 100
  }
  
  calculateRelativeNiceness(temperature, precipitation, windSpeed, season) {
    const baseline = this.climateBases[season]
    const idealTemp = (baseline.temp[0] + baseline.temp[1]) / 2
    const idealPrecip = baseline.precip[0]
    const idealWind = baseline.wind[0]
    
    let score = 1.0
    score *= Math.max(0.3, 1 - Math.abs(temperature - idealTemp) / 30)
    score *= Math.max(0.3, 1 - precipitation / 100)
    score *= Math.max(0.3, 1 - windSpeed / 30)
    
    return Math.round(score * 100) / 100
  }
  
  calculateComfortIndex(temperature, precipitation, windSpeed) {
    // Human comfort algorithm
    let comfort = 1.0
    
    // Temperature comfort curve (peaks around 70-75°F)
    if (temperature >= 65 && temperature <= 80) {
      comfort *= 1.0
    } else {
      comfort *= Math.max(0.2, 1 - Math.abs(temperature - 72.5) / 50)
    }
    
    // Precipitation discomfort
    comfort *= Math.max(0.3, 1 - precipitation / 100)
    
    // Wind discomfort
    comfort *= Math.max(0.4, 1 - windSpeed / 30)
    
    return Math.round(comfort * 100) / 100
  }
  
  generateContextualDescription(locationName, weather) {
    const templates = [
      `${weather.condition} conditions in ${locationName} area`,
      `${weather.temperature}°F with ${weather.condition.toLowerCase()} skies`,
      `Great for outdoor activities with ${weather.precipitation}% chance of precipitation`,
      `${weather.condition} weather perfect for exploring ${locationName}`,
      `Comfortable ${weather.temperature}°F conditions for ${locationName} area`
    ]
    
    // Choose template based on weather quality
    const index = weather.relative_niceness > 0.7 ? 3 : 
                  weather.relative_niceness > 0.5 ? 2 : 0
    
    return templates[index] || templates[0]
  }
  
  getLocationCoords(name) {
    // Simplified coordinate lookup (would be database in real app)
    const coords = {
      'Minneapolis': { lat: 44.9778, lng: -93.265 },
      'Duluth': { lat: 46.7867, lng: -92.1005 },
      'Brainerd': { lat: 46.358, lng: -94.2008 },
      'Rochester': { lat: 44.0121, lng: -92.4802 },
      'Ely': { lat: 47.903, lng: -91.8668 },
      'Grand Rapids': { lat: 47.2369, lng: -93.5308 },
      'International Falls': { lat: 48.6009, lng: -93.4067 },
      'Alexandria': { lat: 45.8852, lng: -95.3775 },
      'Bemidji': { lat: 47.4737, lng: -94.8803 },
      'St. Cloud': { lat: 45.5579, lng: -94.1632 }
    }
    
    return coords[name] || { lat: 46.0, lng: -94.0 }
  }
  
  generateLocationId(name) {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
  }
  
  generateSeed(locationName, timestamp) {
    // Create deterministic but varied seed for consistent simulation
    const dateStr = timestamp.toISOString().slice(0, 13) // Hour precision
    return `${locationName}_${dateStr}`.replace(/[^a-zA-Z0-9_]/g, '_')
  }
  
  calculateDistance(userCoords, locationCoords) {
    // Haversine formula for distance calculation
    const R = 3959 // Earth's radius in miles
    const lat1 = userCoords[0] * Math.PI / 180
    const lat2 = locationCoords.lat * Math.PI / 180
    const deltaLat = (locationCoords.lat - userCoords[0]) * Math.PI / 180
    const deltaLng = (locationCoords.lng - userCoords[1]) * Math.PI / 180

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return Math.round(R * c * 10) / 10 // Round to 1 decimal
  }
  
  calculateTrend(dayPattern, trendType) {
    const patterns = {
      improving: { improving: true, stable: false },
      stable: { improving: false, stable: true },
      mixed: { improving: Math.random() > 0.5, stable: false },
      deteriorating: { improving: false, stable: false }
    }
    
    return patterns[dayPattern]?.[trendType] || false
  }
  
  calculateBestTimeWindow(currentTimeOfDay, condition) {
    // Simple logic for best time recommendations
    if (condition === 'Sunny' || condition === 'Clear') {
      return 'All day excellent'
    }
    if (condition.includes('Rain') || condition === 'Thunderstorms') {
      return 'Early morning best'
    }
    if (condition === 'Hot') {
      return 'Morning and evening optimal'
    }
    
    return 'Afternoon recommended'
  }
}

// Export for use in API server
module.exports = { PracticalWeatherSimulation }

// Example usage:
// const simulator = new PracticalWeatherSimulation()
// const allWeather = simulator.generateAllLocations([
//   'Minneapolis', 'Duluth', 'Brainerd', 'Rochester', 'Ely'
// ], [44.9778, -93.265]) // User location