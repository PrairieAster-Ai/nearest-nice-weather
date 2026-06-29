/**
 * ========================================================================
 * CONTEXTUAL WEATHER INTELLIGENCE
 * ========================================================================
 *
 * Scores "nearest nice weather" subjectively instead of with static filters:
 * how *near* and how *nice* a destination is are both relative to the user's
 * context (intended activity, season, travel willingness) and to the other
 * options currently available.
 *
 * @remarks
 * This is a standalone scoring engine and is not currently wired into the app's
 * POI navigation path (no imports outside this module). Treat it as an
 * experimental/alternative discovery strategy; the live filtering lives in
 * {@link ../utils/weatherFilteringUtils} and {@link ../utils/poiNavigationUtils}.
 */

/** An outdoor destination plus its current weather, the unit this engine scores. */
export interface WeatherLocation {
  /** Stable unique identifier for the location. */
  id: string
  /** Human-readable location name. */
  name: string
  /** Latitude in decimal degrees. */
  lat: number
  /** Longitude in decimal degrees. */
  lng: number
  /** Temperature in degrees Fahrenheit. */
  temperature: number
  /** Short condition label (e.g. "Clear", "Overcast"). */
  condition: string
  /** Longer human-readable weather description. */
  description: string
  /** Precipitation probability as a 0–100 percentage. */
  precipitation: number
  /** Wind speed in miles per hour. */
  windSpeed: number
}

/** The user's situation, used to make "near" and "nice" subjective rather than absolute. */
export interface UserContext {
  /** User's current position as `[latitude, longitude]`; when omitted, all destinations are treated as equally near. */
  currentLocation?: [number, number]
  /** Part of day, for time-aware adjustments. */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  /** Season, used to compare conditions against seasonal norms. */
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  /** Activity the user intends to do, which sets the optimal weather band. */
  intendedActivity?: 'hiking' | 'fishing' | 'photography' | 'camping' | 'sightseeing' | 'general'
  /** How strongly weather quality should influence scoring. */
  weatherSensitivity?: 'low' | 'moderate' | 'high'
  /** Maximum distance the user is willing to travel, in miles. */
  travelWillingness?: number // miles willing to travel
  /** Required on-site infrastructure level. */
  infrastructure?: 'any' | 'basic' | 'full_services'
}

/** A scored recommendation for one location, with human-readable reasoning and comparative context. */
export interface ContextualAssessment {
  /** The location this assessment is for. */
  location: WeatherLocation
  /** 0–1 score for how contextually "near" the location is. */
  nearnessFit: number // 0-1 score for contextual "nearness"
  /** 0–1 score for how contextually "nice" the weather is. */
  nicenessFit: number // 0-1 score for contextual "niceness"
  /** Combined nearness/niceness score used for ranking. */
  overallScore: number
  /** Plain-language explanations behind each score, plus any concerns. */
  reasoning: {
    /** Why this location scored as it did on nearness. */
    nearness: string[]
    /** Why this location scored as it did on niceness. */
    niceness: string[]
    /** Notable downsides to flag to the user. */
    concerns: string[]
  }
  /** How this location stacks up against the other candidates. */
  comparisonContext: {
    /** Percentage of the other options this location beats. */
    betterThan: number // percentage of other options this beats
    /** Standout advantages relative to alternatives. */
    uniqueAdvantages: string[]
  }
}

/**
 * Engine that turns a list of {@link WeatherLocation}s plus a {@link UserContext}
 * into ranked, explained recommendations.
 *
 * @example
 * ```ts
 * const engine = new ContextualWeatherIntelligence();
 * const ranked = engine.generateContextualRecommendations(locations, {
 *   currentLocation: [44.95, -93.09],
 *   intendedActivity: 'hiking',
 *   travelWillingness: 120,
 * });
 * ```
 */
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

  /**
   * Score how contextually "near" a destination is, blending raw distance with
   * context (e.g. campers tolerate longer drives).
   * @param userLocation - User's position, or `undefined` to treat all destinations as equally accessible.
   * @param destination - The candidate destination being scored.
   * @param context - User context that adjusts distance tolerance.
   * @returns A 0–1 `score` (higher is nearer-feeling) plus `reasoning` strings explaining it.
   */
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

  /**
   * Score how contextually "nice" a location's weather is for the user's intended
   * activity, judging temperature, precipitation, wind, and condition against the
   * activity's optimal band and the rest of the candidate set.
   * @param weather - The location whose weather is being judged.
   * @param context - User context supplying the activity and season.
   * @param allLocations - The full candidate set, used for comparative ranking.
   * @returns A 0–1 `score` (higher is nicer) plus `reasoning` strings explaining it.
   */
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

  /**
   * Score every candidate location and return them ranked best-first.
   *
   * The overall score weights niceness over nearness (0.6 / 0.4), so a meaningfully
   * better-weather destination can outrank a closer one within the user's travel budget.
   * @param locations - Candidate destinations to assess.
   * @param userContext - The user's situation driving the scoring.
   * @returns Assessments sorted by descending {@link ContextualAssessment.overallScore}.
   */
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
