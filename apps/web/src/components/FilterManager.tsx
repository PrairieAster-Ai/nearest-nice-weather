/**
 * ========================================================================
 * FILTER MANAGER - WEATHER PREFERENCE STATE MANAGEMENT
 * ========================================================================
 *
 * 📋 PURPOSE: Custom hook managing weather filter state with persistence and debouncing
 * 🔗 CONNECTS TO: FabFilterSystem (UI), App.tsx (consumer), localStorage (persistence)
 * 📊 DATA FLOW: User input → instant UI → debounced state → localStorage → API refresh
 * ⚙️ STATE: filters (persistent), instantFilters (UI), debouncedFilters (API), isFiltering (status)
 * 🎯 USER IMPACT: Instant visual feedback with optimized backend performance
 *
 * BUSINESS CONTEXT: Critical for Minnesota outdoor recreation weather optimization
 * - Enables users to filter POIs by weather comfort preferences
 * - Instant gratification with <100ms UI response prevents user abandonment
 * - Persistent preferences reduce cognitive load for repeat users
 * - Debounced API calls optimize performance and reduce server load
 *
 * TECHNICAL IMPLEMENTATION: Multi-layered state management with performance optimization
 * - Triple-state pattern: instant (UI) → debounced (API) → persistent (localStorage)
 * - useRef pattern prevents infinite loops in useEffect chains
 * - Callback-based communication maintains loose coupling with UI components
 * - localStorage hooks provide automatic persistence across sessions
 *
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - Hook pattern chosen over component for reusable state logic
 * - Triple-state approach balances UX responsiveness with API efficiency
 * - Debouncing prevents API thrashing during rapid filter changes
 * - localStorage integration maintains user preferences across sessions
 *
 * @CLAUDE_CONTEXT: Core state management for weather-based POI filtering system
 * @BUSINESS_RULE: P0 MUST provide instant visual feedback while optimizing API performance
 * @INTEGRATION_POINT: useWeatherFiltersStorage for persistence, useDebounce for performance
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json for testable thresholds
 *
 * 🔄 STATE SYNCHRONIZATION PATTERN:
 * instantFilters ↔ debouncedFilters ↔ filters ↔ localStorage
 *
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * Weather preferences → instant UI feedback → debounced API calls → filtered POI results
 * USER JOURNEY: Filter selection → immediate gratification → optimized performance → relevant results
 * VALUE CHAIN: Comfort preferences → weather matching algorithm → outdoor activity recommendations
 * STATE SYNCHRONIZATION: instantFilters ↔ debouncedFilters ↔ filters ↔ localStorage
 *
 * LAST UPDATED: 2025-08-08
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWeatherFiltersStorage, WeatherFilters } from '../hooks/useLocalStorageState';
import { useDebounce, DEBOUNCE_DELAYS } from '../hooks/useDebounce';

// 🔗 INTEGRATION: Provides state management for FabFilterSystem.tsx UI interactions
// 🔗 INTEGRATION: Consumed by App.tsx for weather-based POI filtering logic
// 🔗 SEE ALSO: usePOINavigation.ts for filter-aware POI discovery

// 🔗 INTEGRATION: Custom hook providing filter state management for weather-based POI discovery
export const useFilterManager = () => {
  // Persistent filter preferences with localStorage
  const [filters, setFilters] = useWeatherFiltersStorage();

  // Instant UI state for immediate feedback, debounced for API calls
  const [instantFilters, setInstantFilters] = useState<WeatherFilters>(filters);
  const debouncedFilters = useDebounce(instantFilters, DEBOUNCE_DELAYS.FAST_SEARCH);
  const [isFiltering, setIsFiltering] = useState(false);

  // Track previous filters to prevent infinite loops
  const prevDebouncedFilters = useRef(debouncedFilters);

  // Initialize instant filters from persisted filters on mount
  useEffect(() => {
    setInstantFilters(filters);
  }, [filters]); // Add filters as dependency

  // Sync debounced filters with actual filters for API calls
  useEffect(() => {
    // Only update if debounced filters actually changed
    const filtersChanged = JSON.stringify(prevDebouncedFilters.current) !== JSON.stringify(debouncedFilters);

    if (filtersChanged) {
      console.log('🔄 Syncing debounced filters to persistent storage:', debouncedFilters);
      setFilters(debouncedFilters);
      setIsFiltering(false);
      prevDebouncedFilters.current = debouncedFilters;
    }
  }, [debouncedFilters, setFilters]);

  // Optimized filter handling with instant UI feedback + debounced API calls
  const handleFilterChange = useCallback((category: keyof WeatherFilters, value: string) => {
    const newFilters = { ...instantFilters, [category]: value };
    setInstantFilters(newFilters);
    setIsFiltering(true);
    console.log(`🎛️ Filter changed: ${category}=${value}`);
  }, [instantFilters]);

  // Return the filter state and handlers
  return {
    filters,
    debouncedFilters,
    instantFilters,
    isFiltering,
    handleFilterChange
  };
};
