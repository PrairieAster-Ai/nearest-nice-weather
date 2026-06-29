/**
 * ========================================================================
 * USE WEATHER FILTERING HOOK - CENTRALIZED WEATHER-BASED LOCATION FILTERING
 * ========================================================================
 *
 * 📋 PURPOSE: Custom hook for weather-based location filtering operations
 * 🔗 CONNECTS TO: WeatherFilteringService, App.tsx, FabFilterSystem
 * 📊 DATA FLOW: POI locations + filters → filtered locations + filter counts
 * ⚙️ OPERATIONS: Apply filters, calculate result counts, type conversions
 * 🎯 USER IMPACT: Provides filter badges and location filtering for discovery
 *
 * BUSINESS CONTEXT: Core outdoor recreation discovery functionality
 * - Enables users to find POIs with specific weather preferences
 * - Provides visual feedback through filter result counts
 * - Optimizes POI discovery by filtering based on current conditions
 * - Essential for outdoor activity planning and weather optimization
 *
 * TECHNICAL IMPLEMENTATION: React hook pattern with memoized calculations
 * - Type conversion between local and service interfaces
 * - Memoized filter result counts for performance
 * - Integration with WeatherFilteringService for business logic
 * - Optimized dependencies to prevent unnecessary recalculations
 *
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - Hook pattern for reusable filtering logic
 * - Service delegation for complex filtering algorithms
 * - Type safety through interface conversion
 * - Performance optimization through selective memoization
 *
 * @CLAUDE_CONTEXT: Extracted from App.tsx for improved testability and reusability
 * @BUSINESS_RULE: P1 MUST provide accurate filter counts for user interface
 * @INTEGRATION_POINT: Consumed by App.tsx, provides data to FabFilterSystem
 * @PERFORMANCE_CRITICAL: Memoized to prevent expensive recalculations on every render
 *
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * POI data → weather filtering → user interface feedback → outdoor activity discovery
 * USER JOURNEY: Filter selection → immediate count feedback → filtered POI results
 * VALUE CHAIN: Weather preferences → relevant POIs → faster activity planning
 *
 * LAST UPDATED: 2025-08-13
 */

import { useMemo } from 'react';
import {
  weatherFilteringService,
  WeatherFilters as ServiceWeatherFilters,
  Location as ServiceLocation,
  FilterCounts
} from '../services/WeatherFilteringService';

/**
 * POI location shape used by this hook (mirrors the structure App.tsx holds in
 * state), carrying coordinates plus flattened current weather fields.
 */
export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: number;
}

/** The user's selected weather filter buckets (App.tsx representation). */
export interface WeatherFilters {
  temperature: string;
  precipitation: string;
  wind: string;
}

/** Value returned by {@link useWeatherFiltering}: badge counts and the apply fn. */
export interface WeatherFilteringHookResult {
  filterResultCounts: FilterCounts;
  applyWeatherFilters: (locations: Location[], filters: WeatherFilters, maxDistance?: number) => Location[];
}

/**
 * Custom hook for weather-based location filtering operations
 *
 * @param visiblePOIs - Array of POI locations to filter and count
 * @param userLocation - User's current location for distance-based filtering
 * @returns Object with filtering operations and result counts
 */
export const useWeatherFiltering = (
  visiblePOIs: Location[],
  userLocation: [number, number] | null
): WeatherFilteringHookResult => {

  // 🎯 PERFORMANCE_CRITICAL: Memoized filter result counts for FAB badges
  const filterResultCounts = useMemo(() => {
    // Convert local location format to service format
    const serviceLocations: ServiceLocation[] = visiblePOIs.map(loc => ({
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      temperature: loc.temperature,
      precipitation: loc.precipitation,
      windSpeed: loc.windSpeed || 0, // Handle potential undefined windSpeed
      condition: loc.condition,
      description: loc.description
    }));

    // Calculate filter result counts using the service
    return weatherFilteringService.calculateFilterResultCounts(serviceLocations);
  }, [visiblePOIs]); // Include full visiblePOIs as dependency

  // 🔧 Weather filtering function with type conversion
  const applyWeatherFilters = useMemo(() => {
    return (locations: Location[], filters: WeatherFilters, maxDistance?: number): Location[] => {
      // Convert local types to service types for compatibility
      const serviceLocations: ServiceLocation[] = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        temperature: loc.temperature,
        precipitation: loc.precipitation,
        windSpeed: loc.windSpeed || 0, // Handle potential undefined windSpeed
        condition: loc.condition,
        description: loc.description
      }));

      // Convert local filter format to service format
      const serviceFilters: ServiceWeatherFilters = {
        temperature: filters.temperature as any,
        precipitation: filters.precipitation as any,
        wind: filters.wind as any
      };

      // Apply weather filters using the service
      const filtered = weatherFilteringService.applyWeatherFilters(
        serviceLocations,
        serviceFilters,
        userLocation || undefined,
        maxDistance
      );

      // DEBUG: Total marker count validation (preserving existing logging)
      if (filtered.length > 21) {
        console.error(`🚨 ERROR: Displaying ${filtered.length} markers but only 21 POI should match sensible defaults!`);
        console.error(`🚨 This indicates a filtering or data issue - investigate immediately`);
        console.error(`🚨 Locations passing filter:`, filtered.map(loc => `${loc.name} (${loc.temperature}°F, ${loc.precipitation}%, ${loc.windSpeed}mph)`));
      } else {
        console.log(`📍 Total markers to display: ${filtered.length} (Expected max: 21 POI)`);
      }

      // Convert back to local Location type
      return filtered.map(loc => ({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        temperature: loc.temperature,
        precipitation: loc.precipitation,
        windSpeed: loc.windSpeed,
        condition: loc.condition,
        description: loc.description
      }));
    };
  }, [userLocation]); // Memoize based on user location changes

  return {
    filterResultCounts,
    applyWeatherFilters
  };
};
