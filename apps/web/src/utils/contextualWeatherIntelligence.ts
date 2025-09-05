// Contextual Weather Intelligence for Subjective "Nearest Nice Weather"
// Transforms static filtering into adaptive discovery

export interface WeatherLocation {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number
  windSpeed: number
}

export interface UserContext {
  currentLocation?: [number, number]
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  intendedActivity?: 'hiking' | 'fishing' | 'photography' | 'camping' | 'sightseeing' | 'general'
  weatherSensitivity?: 'low' | 'moderate' | 'high'
  travelWillingness?: number // miles willing to travel
  infrastructure?: 'any' | 'basic' | 'full_services'
}

export interface ContextualAssessment {
  location: WeatherLocation
  nearnessFit: number // 0-1 score for contextual "nearness"
  nicenessFit: number // 0-1 score for contextual "niceness"
  overallScore: number
  reasoning: {
    nearness: string[]
    niceness: string[]
    concerns: string[]
  }
  comparisonContext: {
    betterThan: number // percentage of other options this beats
    uniqueAdvantages: string[]
  }
}

export class ContextualWeatherIntelligence {
  private seasonalNorms = {
    spring: { temp: [50, 70], precip: [20, 40], wind: [8, 15] },
    summer: { temp: [70, 85], precip: [10, 30], wind: [5, 12] },
    fall: { temp: [45, 65], precip: [15, 35], wind: [10, 18] },
    winter: { temp: [20, 40], precip: [30, 60], wind: [12, 20] }
  }

  private activityOptimalConditions = {
    hiking: {
      tempRange: [55, 75], maxPrecip: 25, maxWind: 20,
      preferredConditions: ['Clear', 'Partly Cloudy']
    },
    fishing: {
      tempRange: [60, 80], maxPrecip: 40, maxWind: 15,
      preferredConditions: ['Overcast', 'Partly Cloudy']
    },
    photography: {
      tempRange: [40, 85], maxPrecip: 20, maxWind: 25,
      preferredConditions: ['Partly Cloudy', 'Overcast', 'Clear']
    },
    camping: {
      tempRange: [50, 80], maxPrecip: 15, maxWind: 18,
      preferredConditions: ['Clear', 'Partly Cloudy']
    },
    sightseeing: {
      tempRange: [55, 85], maxPrecip: 30, maxWind: 20,
      preferredConditions: ['Clear', 'Sunny']
    },
    general: {
      tempRange: [60, 80], maxPrecip: 25, maxWind: 15,
      preferredConditions: ['Clear', 'Sunny', 'Partly Cloudy']
    }
  }

  calculateContextualNearness(
    userLocation: [number, number] | undefined,
    destination: WeatherLocation,
    context: UserContext
  ): { score: number; reasoning: string[] } {
    if (!userLocation) {
      return { score: 1.0, reasoning: ['No user location - all destinations equally accessible'] }
    }

    const distance = this.calculateDistance(userLocation, [destination.lat, destination.lng])
    const reasoning: string[] = []
    let score = 1.0

    // Base distance penalty
    const maxDistance = context.travelWillingness || 200
    score = Math.max(0, 1 - (distance / maxDistance))

    if (distance <= 30) {
      reasoning.push('Very close - under 30 minutes drive')
      score += 0.1
    } else if (distance <= 60) {
      reasoning.push('Reasonably close - about 1 hour drive')
    } else if (distance <= 120) {
      reasoning.push('Worth the drive for good weather')
    } else {
      reasoning.push('Quite far - consider if weather difference justifies distance')
      score *= 0.7
    }

    // Context adjustments
    if (context.intendedActivity === 'camping' && distance > 50) {
      score += 0.1 // Camping often worth longer drives
      reasoning.push('Distance acceptable for camping destination')
    }

    return { score: Math.min(1.0, score), reasoning }
  }

  calculateWeatherNiceness(
    weather: WeatherLocation,
    context: UserContext,
    allLocations: WeatherLocation[]
  ): { score: number; reasoning: string[] } {
    const reasoning: string[] = []
    let score = 0.5 // Start neutral

    // Activity-specific assessment
    const activity = context.intendedActivity || 'general'
    const optimal = this.activityOptimalConditions[activity]

    // Temperature suitability
    if (weather.temperature >= optimal.tempRange[0] && weather.temperature <= optimal.tempRange[1]) {
      score += 0.3
      reasoning.push(`Perfect temperature for ${activity} (${weather.temperature}°F)`)
    } else if (Math.abs(weather.temperature - (optimal.tempRange[0] + optimal.tempRange[1])/2) <= 10) {
      score += 0.1
      reasoning.push(`Good temperature for ${activity}`)
    }

    // Precipitation assessment
    if (weather.precipitation <= optimal.maxPrecip) {
      score += 0.25
      if (weather.precipitation === 0) {
        reasoning.push('No precipitation expected')
      } else {
        reasoning.push(`Light precipitation (${weather.precipitation}%) manageable for ${activity}`)
      }
    } else {
      score -= 0.2
      reasoning.push(`Higher precipitation (${weather.precipitation}%) may impact ${activity}`)
    }

    // Wind assessment
    if (weather.windSpeed <= optimal.maxWind) {
      score += 0.2
      if (weather.windSpeed <= 8) {
        reasoning.push('Calm conditions')
      } else {
        reasoning.push('Moderate wind conditions')
      }
    } else {
      score -= 0.15
      reasoning.push(`Strong winds (${weather.windSpeed} mph) may be challenging`)
    }

    // Condition-specific bonuses
    if (optimal.preferredConditions.includes(weather.condition)) {
      score += 0.15
      reasoning.push(`${weather.condition} conditions ideal for ${activity}`)
    }

    // Seasonal context
    const season = context.season || this.getCurrentSeason()
    const norms = this.seasonalNorms[season]

    if (weather.temperature > norms.temp[1]) {
      reasoning.push(`Warmer than typical for ${season}`)
    } else if (weather.temperature < norms.temp[0]) {
      reasoning.push(`Cooler than typical for ${season}`)
    }

    // Comparative context
    const comparison = this.compareToAlternatives(weather, allLocations)
    if (comparison.rank <= 0.3) {
      score += 0.1
      reasoning.push(`Among the best weather currently available (top ${Math.round(comparison.rank * 100)}%)`)
    }

    return { score: Math.max(0, Math.min(1, score)), reasoning }
  }

  generateContextualRecommendations(
    locations: WeatherLocation[],
    userContext: UserContext
  ): ContextualAssessment[] {
    return locations.map(location => {
      const nearness = this.calculateContextualNearness(
        userContext.currentLocation,
        location,
        userContext
      )

      const niceness = this.calculateWeatherNiceness(
        location,
        userContext,
        locations
      )

      const overallScore = (nearness.score * 0.4) + (niceness.score * 0.6)

      const comparison = this.compareToAlternatives(location, locations)

      return {
        location,
        nearnessFit: nearness.score,
        nicenessFit: niceness.score,
        overallScore,
        reasoning: {
          nearness: nearness.reasoning,
          niceness: niceness.reasoning,
          concerns: this.identifyPotentialConcerns(location, userContext)
        },
        comparisonContext: {
          betterThan: comparison.betterThan,
          uniqueAdvantages: comparison.advantages
        }
      }
    }).sort((a, b) => b.overallScore - a.overallScore)
  }

  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 3959 // Earth's radius in miles
    const lat1 = point1[0] * Math.PI / 180
    const lat2 = point2[0] * Math.PI / 180
    const deltaLat = (point2[0] - point1[0]) * Math.PI / 180
    const deltaLng = (point2[1] - point1[1]) * Math.PI / 180

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'fall'
    return 'winter'
  }

  private compareToAlternatives(location: WeatherLocation, allLocations: WeatherLocation[]) {
    const scores = allLocations.map(loc => {
      let score = 0
      if (loc.temperature >= 65 && loc.temperature <= 80) score += 0.3
      if (loc.precipitation <= 20) score += 0.3
      if (loc.windSpeed <= 15) score += 0.2
      if (['Clear', 'Sunny', 'Partly Cloudy'].includes(loc.condition)) score += 0.2
      return score
    }).sort((a, b) => b - a)

    const thisScore = scores[allLocations.findIndex(loc => loc.id === location.id)]
    const rank = scores.indexOf(thisScore) / scores.length
    const betterThan = (1 - rank) * 100

    const advantages: string[] = []
    const betterTemp = allLocations.filter(loc => Math.abs(loc.temperature - 72) > Math.abs(location.temperature - 72)).length
    const betterPrecip = allLocations.filter(loc => loc.precipitation > location.precipitation).length
    const betterWind = allLocations.filter(loc => loc.windSpeed > location.windSpeed).length

    if (betterTemp / allLocations.length > 0.6) advantages.push('Better temperature than most alternatives')
    if (betterPrecip / allLocations.length > 0.6) advantages.push('Drier than most alternatives')
    if (betterWind / allLocations.length > 0.6) advantages.push('Calmer than most alternatives')

    return {
      rank,
      betterThan: Math.round(betterThan),
      advantages
    }
  }

  private identifyPotentialConcerns(location: WeatherLocation, context: UserContext): string[] {
    const concerns: string[] = []

    if (location.precipitation > 50) {
      concerns.push('High chance of precipitation')
    }

    if (location.windSpeed > 20) {
      concerns.push('Strong winds expected')
    }

    if (context.intendedActivity === 'photography' && location.condition === 'Overcast') {
      concerns.push('Overcast may limit lighting opportunities')
    }

    if (context.intendedActivity === 'hiking' && location.temperature > 85) {
      concerns.push('High temperature may be challenging for hiking')
    }

    return concerns
  }
}
