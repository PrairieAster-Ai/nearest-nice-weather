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
 * @CLAUDE_CONTEXT: Refactored to use extracted utilities for improved testability
 *
 * LAST UPDATED: 2025-08-13
 */

import {
  calculateDistance,
  applyWeatherFilters,
  calculateFilterResultCounts,
  filterByDistance,
  sortByDistance,
  type Location,
  type WeatherFilters,
  type Coordinates,
  type FilterCounts
} from '../utils/weatherFilteringUtils';

// Re-export types for backward compatibility
export type { Location, WeatherFilters, Coordinates, FilterCounts };

/**
 * Weather Filtering Service
 * Provides intelligent location filtering based on weather conditions
 *
 * NOTE: Core filtering logic has been extracted to weatherFilteringUtils.ts
 * This service now acts as a wrapper for backward compatibility
 */
export class WeatherFilteringService {

  /**
   * Calculate distance between two geographic points using Haversine formula
   * @param point1 First coordinate [latitude, longitude]
   * @param point2 Second coordinate [latitude, longitude]
   * @returns Distance in miles
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    return calculateDistance(point1, point2);
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

    console.log(`🎯 WEATHER FILTERING: ${locations.length} locations → applying filters`);

    const filtered = applyWeatherFilters(
      locations,
      locations, // Use all locations for threshold calculation
      filters,
      userLocation,
      maxDistance
    );

    if (filtered.length === 0) {
      console.log(`⚠️ No results after filtering within current radius`);
      return [];
    }

    console.log(`✅ Filter results: ${locations.length} → ${filtered.length} locations`);
    return filtered;
  }

  /**
   * Calculate filter result counts for UI badge display
   * Simplified approach to prevent performance issues
   */
  calculateFilterResultCounts(visiblePOIs: Location[]): FilterCounts {
    return calculateFilterResultCounts(visiblePOIs);
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
    return filterByDistance(locations, userLocation, maxDistance);
  }

  /**
   * Get locations sorted by distance from user location
   * @param locations Array of locations to sort
   * @param userLocation User's current coordinates
   * @returns Locations sorted by distance (closest first)
   */
  sortByDistance(locations: Location[], userLocation: Coordinates): Location[] {
    return sortByDistance(locations, userLocation);
  }
}

/** Shared app-wide {@link WeatherFilteringService} singleton. */
export const weatherFilteringService = new WeatherFilteringService();
