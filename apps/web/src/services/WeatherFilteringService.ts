/**
 * ========================================================================
 * WEATHER FILTERING SERVICE - INTELLIGENT LOCATION FILTERING
 * ========================================================================
 * 
 * 📋 PURPOSE: Centralized weather-based location filtering with percentile algorithms
 * 🎯 BUSINESS LOGIC: Relative weather filtering for optimal outdoor activity discovery
 * 🔒 ALGORITHM STABILITY: Maintains consistent filter percentages per business rules
 * ⚡ PERFORMANCE: Optimized sorting and filtering for real-time UI updates
 * 
 * FILTERING STRATEGIES:
 * 1. 🌡️ Temperature: Percentile-based relative to current weather conditions
 * 2. 🌧️ Precipitation: Relative dry/light/heavy classification
 * 3. 💨 Wind: Relative calm/breezy/windy classification
 * 4. 📏 Distance: Haversine formula for geographic filtering
 * 
 * @BUSINESS_RULE: Percentile thresholds are fixed and must not be adjusted
 * @PERFORMANCE_CRITICAL: Efficient sorting and filtering for real-time UI
 * @CLAUDE_CONTEXT: Extracted from App.tsx for testability and maintainability
 * 
 * LAST UPDATED: 2025-08-13
 */

// Location interface matching App.tsx structure
export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  description: string;
}

// Weather filters interface matching App.tsx structure
export interface WeatherFilters {
  temperature?: 'cold' | 'mild' | 'hot' | '';
  precipitation?: 'none' | 'light' | 'heavy' | '';
  wind?: 'calm' | 'breezy' | 'windy' | '';
}

// Coordinate type for location calculations
export type Coordinates = [number, number]; // [latitude, longitude]

// Filter result counts for UI badges
export interface FilterCounts {
  [key: string]: number;
}

/**
 * Weather Filtering Service
 * Provides intelligent location filtering based on weather conditions
 */
export class WeatherFilteringService {
  
  /**
   * Calculate distance between two geographic points using Haversine formula
   * @param point1 First coordinate [latitude, longitude]
   * @param point2 Second coordinate [latitude, longitude]
   * @returns Distance in miles
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Apply comprehensive weather-based filtering to locations
   * @param locations Array of locations to filter
   * @param filters Weather filter preferences
   * @param userLocation User's current position for distance filtering
   * @param maxDistance Maximum distance in miles (optional)
   * @returns Filtered array of locations matching criteria
   */
  applyWeatherFilters(
    locations: Location[], 
    filters: WeatherFilters, 
    userLocation?: Coordinates,
    maxDistance?: number
  ): Location[] {
    if (locations.length === 0) return [];
    
    let filtered = [...locations];
    console.log(`🎯 WEATHER FILTERING: ${locations.length} locations → applying filters`);
    
    // DISTANCE FILTERING - Apply distance constraint if provided
    if (maxDistance && userLocation) {
      const startCount = filtered.length;
      filtered = filtered.filter(loc => {
        const distance = this.calculateDistance(userLocation, [loc.lat, loc.lng]);
        return distance <= maxDistance;
      });
      console.log(`📏 Distance filter: ${startCount} → ${filtered.length} locations within ${maxDistance} miles`);
    }

    // Apply weather-specific filters
    filtered = this.applyTemperatureFilter(filtered, locations, filters.temperature);
    filtered = this.applyPrecipitationFilter(filtered, locations, filters.precipitation);
    filtered = this.applyWindFilter(filtered, locations, filters.wind);

    // Return empty array if no matches - let radius expansion find more locations
    if (filtered.length === 0) {
      console.log(`⚠️ No results after filtering within current radius`);
      return [];
    }

    console.log(`✅ Filter results: ${locations.length} → ${filtered.length} locations`);
    return filtered;
  }

  /**
   * Apply temperature filtering using percentile-based thresholds
   * ⚠️ CRITICAL: DO NOT ADJUST THESE PERCENTAGES - they determine what "mild/cold/hot" means
   */
  private applyTemperatureFilter(
    filtered: Location[], 
    allLocations: Location[], 
    temperatureFilter?: string
  ): Location[] {
    if (!temperatureFilter || temperatureFilter.length === 0) {
      return filtered;
    }

    // Use all locations for calculating thresholds to maintain consistency
    const temps = allLocations.map(loc => loc.temperature).sort((a, b) => a - b);
    const tempCount = temps.length;
    
    if (temperatureFilter === 'cold') {
      // Show coldest 40% of available temperatures
      const threshold = temps[Math.floor(tempCount * 0.4)];
      const result = filtered.filter(loc => loc.temperature <= threshold);
      console.log(`❄️  Cold filter: temps ≤ ${threshold}°F`);
      return result;
    } else if (temperatureFilter === 'hot') {
      // Show hottest 40% of available temperatures  
      const threshold = temps[Math.floor(tempCount * 0.6)];
      const result = filtered.filter(loc => loc.temperature >= threshold);
      console.log(`🔥 Hot filter: temps ≥ ${threshold}°F`);
      return result;
    } else if (temperatureFilter === 'mild') {
      // Show middle 80% of temperatures (exclude extreme 10% on each end)
      const minThreshold = temps[Math.floor(tempCount * 0.1)];
      const maxThreshold = temps[Math.floor(tempCount * 0.9)];
      const result = filtered.filter(loc => 
        loc.temperature >= minThreshold && loc.temperature <= maxThreshold
      );
      console.log(`🌤️  Mild filter: temps ${minThreshold}°F - ${maxThreshold}°F`);
      return result;
    }

    return filtered;
  }

  /**
   * Apply precipitation filtering using percentile-based thresholds
   * ⚠️ CRITICAL: DO NOT ADJUST THESE PERCENTAGES - they determine what "dry/light/heavy" means
   */
  private applyPrecipitationFilter(
    filtered: Location[], 
    allLocations: Location[], 
    precipitationFilter?: string
  ): Location[] {
    if (!precipitationFilter || precipitationFilter.length === 0) {
      return filtered;
    }

    const precips = allLocations.map(loc => loc.precipitation).sort((a, b) => a - b);
    const precipCount = precips.length;
    
    if (precipitationFilter === 'none') {
      // Show driest 60% of available locations
      const threshold = precips[Math.floor(precipCount * 0.6)];
      const result = filtered.filter(loc => loc.precipitation <= threshold);
      console.log(`☀️  No precip filter: precip ≤ ${threshold}%`);
      return result;
    } else if (precipitationFilter === 'light') {
      // Show middle precipitation range (20th-70th percentile)
      const minThreshold = precips[Math.floor(precipCount * 0.2)];
      const maxThreshold = precips[Math.floor(precipCount * 0.7)];
      const result = filtered.filter(loc => 
        loc.precipitation >= minThreshold && loc.precipitation <= maxThreshold
      );
      console.log(`🌦️  Light precip filter: precip ${minThreshold}% - ${maxThreshold}%`);
      return result;
    } else if (precipitationFilter === 'heavy') {
      // Show wettest 30% of available locations
      const threshold = precips[Math.floor(precipCount * 0.7)];
      const result = filtered.filter(loc => loc.precipitation >= threshold);
      console.log(`🌧️  Heavy precip filter: precip ≥ ${threshold}%`);
      return result;
    }

    return filtered;
  }

  /**
   * Apply wind filtering using percentile-based thresholds
   * ⚠️ CRITICAL: DO NOT ADJUST THESE PERCENTAGES - they determine what "calm/breezy/windy" means
   */
  private applyWindFilter(
    filtered: Location[], 
    allLocations: Location[], 
    windFilter?: string
  ): Location[] {
    if (!windFilter || windFilter.length === 0) {
      return filtered;
    }

    const winds = allLocations.map(loc => loc.windSpeed).sort((a, b) => a - b);
    const windCount = winds.length;
    
    if (windFilter === 'calm') {
      // Show calmest 50% of available locations
      const threshold = winds[Math.floor(windCount * 0.5)];
      const result = filtered.filter(loc => loc.windSpeed <= threshold);
      console.log(`🍃 Calm filter: wind ≤ ${threshold}mph`);
      return result;
    } else if (windFilter === 'breezy') {
      // Show middle wind range (30th-70th percentile)
      const minThreshold = winds[Math.floor(windCount * 0.3)];
      const maxThreshold = winds[Math.floor(windCount * 0.7)];
      const result = filtered.filter(loc => 
        loc.windSpeed >= minThreshold && loc.windSpeed <= maxThreshold
      );
      console.log(`💨 Breezy filter: wind ${minThreshold} - ${maxThreshold}mph`);
      return result;
    } else if (windFilter === 'windy') {
      // Show windiest 30% of available locations
      const threshold = winds[Math.floor(windCount * 0.7)];
      const result = filtered.filter(loc => loc.windSpeed >= threshold);
      console.log(`🌪️  Windy filter: wind ≥ ${threshold}mph`);
      return result;
    }

    return filtered;
  }

  /**
   * Calculate filter result counts for UI badge display
   * Simplified approach to prevent performance issues
   */
  calculateFilterResultCounts(visiblePOIs: Location[]): FilterCounts {
    if (!visiblePOIs || visiblePOIs.length === 0) return {};
    
    // Simplified approach: just return current visible POI count for all options
    // This prevents expensive recalculations and potential infinite loops
    const count = visiblePOIs.length;
    const counts: FilterCounts = {};
    
    const filterOptions = ['cold', 'mild', 'hot', 'none', 'light', 'heavy', 'calm', 'breezy', 'windy'];
    filterOptions.forEach(option => {
      counts[`temperature_${option}`] = count;
      counts[`precipitation_${option}`] = count;
      counts[`wind_${option}`] = count;
    });
    
    return counts;
  }

  /**
   * Filter locations by distance from a user location
   * @param locations Array of locations to filter
   * @param userLocation User's current coordinates
   * @param maxDistance Maximum distance in miles
   * @returns Locations within the specified distance
   */
  filterByDistance(
    locations: Location[], 
    userLocation: Coordinates, 
    maxDistance: number
  ): Location[] {
    return locations.filter(loc => {
      const distance = this.calculateDistance(userLocation, [loc.lat, loc.lng]);
      return distance <= maxDistance;
    });
  }

  /**
   * Get locations sorted by distance from user location
   * @param locations Array of locations to sort
   * @param userLocation User's current coordinates
   * @returns Locations sorted by distance (closest first)
   */
  sortByDistance(locations: Location[], userLocation: Coordinates): Location[] {
    return [...locations].sort((a, b) => {
      const distanceA = this.calculateDistance(userLocation, [a.lat, a.lng]);
      const distanceB = this.calculateDistance(userLocation, [b.lat, b.lng]);
      return distanceA - distanceB;
    });
  }
}

// Singleton instance for app-wide use
export const weatherFilteringService = new WeatherFilteringService();