// ====================================================================
// 🏞️ POI NAVIGATION HOOK - PRIMARY FRONTEND DATA INTEGRATION
// ====================================================================
//
// 🎯 BUSINESS PURPOSE:
// **This is the MAIN hook used by the frontend map interface (App.tsx).**
// Provides outdoor recreation discovery with intelligent distance-based navigation,
// auto-expanding search, and weather-integrated POI data.
//
// 🔗 FRONTEND INTEGRATION:
// - Used by: apps/web/src/App.tsx (PRIMARY - main map interface)
// - Powers: Map markers, POI popup navigation, auto-expand search
// - Replaces: Legacy useWeatherLocations hook (cities → outdoor recreation POIs)
//
// 🧠 INTELLIGENT ALGORITHM FEATURES:
// 1. **Distance-Based Slicing**: POIs organized in 30-mile increments (0-30mi, 30-60mi, etc.)
// 2. **Auto-Expanding Search**: If no POIs found in current radius, automatically expands
// 3. **Anti-Thrashing Navigation**: Sequential POI discovery from closest to farthest
// 4. **localStorage Caching**: Prevents API re-calls during same session
// 5. **Click Throttling**: Prevents rapid navigation button clicking issues
//
// 📊 DATA FLOW:
// 1. Fetch POIs from /api/poi-locations-with-weather (outdoor recreation + weather)
// 2. Calculate distances and organize into 30-mile slices
// 3. Show closest slice first, expand automatically if empty
// 4. Provide navigation between distance slices
// 5. Cache results to prevent unnecessary API calls
//
// 🌤️ WEATHER INTEGRATION:
// Each POI includes real-time weather data: temperature, condition, precipitation, wind
// Weather data fetched via src/services/weatherService.js with OpenWeather API
//
// 🔍 AUTO-EXPAND BEHAVIOR:
// If user location has 0 POIs within 30 miles, automatically searches 60mi, then 90mi, etc.
// Ensures users in remote areas (like northern Minnesota) always find outdoor destinations.
//
// @USED_BY: apps/web/src/App.tsx (main map interface)
// @API_ENDPOINT: /api/poi-locations-with-weather
// @BUSINESS_CRITICAL: Core user experience - outdoor recreation discovery
// @REPLACES: useWeatherLocations hook (deprecated weather station approach)
// @LAST_UPDATED: 2025-08-05 (Auto-expand feature, POI-only architecture)
//

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  processAPIData,
  getVisiblePOIs,
  checkCanExpand,
  DISTANCE_SLICE_SIZE,
  MAX_RESULTS,
  type POIWithMetadata
} from '../utils/poiNavigationUtils';

// 🔗 INTEGRATION: Primary data source for App.tsx map interface and POI rendering
// 🔗 INTEGRATION: Works with LocationManager.tsx for distance-based POI calculations
// 🔗 INTEGRATION: Integrates with FilterManager.tsx for weather-based POI filtering
// 🔗 SEE ALSO: /api/poi-locations-with-weather for backend POI-weather data endpoint

// ====================================================================
// 🏞️ POI DATA STRUCTURES - Outdoor Recreation with Weather Integration
// ====================================================================

/**
 * POI with Metadata - Complete outdoor recreation destination with weather
 *
 * 📊 DATA SOURCES:
 * - POI data: poi_locations table (name, lat/lng, park_type, description)
 * - Weather data: OpenWeather API via weatherService.js (temperature, condition, etc.)
 * - Distance data: Calculated via Haversine formula from user location
 * - Navigation data: Calculated slice index and display state for UI
 */
// Re-export POIWithMetadata type for backwards compatibility
export type { POIWithMetadata };

export interface POINavigationState {
  allPOIs: POIWithMetadata[]; // All 50 from API
  visiblePOIs: POIWithMetadata[]; // Current visible subset
  currentSliceMax: number; // Current max distance (30, 60, 90...)
  currentPOIIndex: number; // Index in visible POIs array
  lastClickTime: number; // For throttling
  isAtClosest: boolean;
  isAtFarthest: boolean;
  canExpand: boolean;
}

interface WeatherFilters {
  temperature: string;
  precipitation: string;
  wind: string;
}

const STORAGE_KEY = 'poi-navigation-cache';
const CLICK_THROTTLE_MS = 500; // 0.5 second throttling

export const usePOINavigation = (
  userLocation: [number, number] | null,
  filters: WeatherFilters
) => {
  const [state, setState] = useState<POINavigationState>({
    allPOIs: [],
    visiblePOIs: [],
    currentSliceMax: DISTANCE_SLICE_SIZE, // Start with 0-30mi
    currentPOIIndex: 0,
    lastClickTime: 0,
    isAtClosest: false,
    isAtFarthest: false,
    canExpand: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for preventing duplicate API calls
  const lastAPICallRef = useRef<{
    location: string;
    filters: string;
    timestamp: number;
  } | null>(null);

  // Note: Distance calculation and data processing functions moved to utils/poiNavigationUtils.ts

  // Click throttling check
  const isClickAllowed = useCallback(() => {
    const now = Date.now();
    return (now - state.lastClickTime) >= CLICK_THROTTLE_MS;
  }, [state.lastClickTime]);

  // Load POI data (single API call)
  const loadPOIData = useCallback(async (force = false) => {
    if (!userLocation) return;

    // Cache key for preventing duplicate calls
    const locationKey = `${userLocation[0].toFixed(4)},${userLocation[1].toFixed(4)}`;
    const filtersKey = JSON.stringify(filters);
    const now = Date.now();

    // Check if we recently made the same call (prevent thrashing)
    if (!force && lastAPICallRef.current) {
      const { location, filters: lastFilters, timestamp } = lastAPICallRef.current;
      const timeSinceLastCall = now - timestamp;

      if (location === locationKey && lastFilters === filtersKey && timeSinceLastCall < 5000) {
        console.log('🚫 Skipping duplicate API call (made same call <5s ago)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Single API call - this is the ONLY query for POI
      const params = new URLSearchParams({
        lat: userLocation[0].toString(),
        lng: userLocation[1].toString(),
        limit: MAX_RESULTS.toString(),
        temperature: filters.temperature,
        precipitation: filters.precipitation,
        wind: filters.wind
      });

      const response = await fetch(`/api/poi-locations-with-weather?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid API response format');
      }

      // Process and cache the data
      const processedResult = processAPIData(data.data, userLocation);
      const processedPOIs = processedResult.processedPOIs;

      // Auto-expand search radius if no results found
      let currentRadius = DISTANCE_SLICE_SIZE;
      let visiblePOIs = getVisiblePOIs(processedPOIs, currentRadius);

      // Keep expanding by 30mi increments until we find results or reach all POIs
      while (visiblePOIs.length === 0 && currentRadius < 300) { // Max 300mi search
        currentRadius += DISTANCE_SLICE_SIZE;
        visiblePOIs = getVisiblePOIs(processedPOIs, currentRadius);
        console.log(`🔍 Auto-expanding search to ${currentRadius}mi...`);
      }

      // If we auto-expanded, log it
      if (currentRadius > DISTANCE_SLICE_SIZE) {
        console.log(`✅ Auto-expanded search from ${DISTANCE_SLICE_SIZE}mi to ${currentRadius}mi to show ${visiblePOIs.length} results`);
      }

      // Cache in localStorage
      const cacheData = {
        location: locationKey,
        filters: filtersKey,
        timestamp: now,
        pois: processedPOIs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

      // Update cache reference
      lastAPICallRef.current = { location: locationKey, filters: filtersKey, timestamp: now };

      // Update state with the expanded radius
      setState(prevState => ({
        ...prevState,
        allPOIs: processedPOIs,
        visiblePOIs,
        currentSliceMax: currentRadius, // Use the auto-expanded radius
        currentPOIIndex: 0, // Start with closest
        isAtClosest: true,
        isAtFarthest: visiblePOIs.length <= 1,
        canExpand: checkCanExpand(processedPOIs, currentRadius)
      }));

      console.log(`📍 Loaded ${processedPOIs.length} POIs, showing ${visiblePOIs.length} within ${currentRadius}mi`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load POI data';
      setError(errorMessage);
      console.error('POI loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters]); // Remove function dependencies that aren't stateful

  // Navigate to closer POI
  const navigateCloser = useCallback(() => {
    if (!isClickAllowed()) {
      console.log('🚫 Click throttled');
      return null;
    }

    const { visiblePOIs, currentPOIIndex } = state;

    if (currentPOIIndex === 0) {
      console.log('📍 Already at closest POI');
      return null; // Already at closest
    }

    const newIndex = currentPOIIndex - 1;

    setState(prevState => ({
      ...prevState,
      currentPOIIndex: newIndex,
      lastClickTime: Date.now(),
      isAtClosest: newIndex === 0,
      isAtFarthest: false
    }));

    console.log(`📍 Navigate closer: ${currentPOIIndex} -> ${newIndex}`);
    return visiblePOIs[newIndex];
  }, [state, isClickAllowed]);

  // Navigate to farther POI (with expansion logic)
  const navigateFarther = useCallback(() => {
    if (!isClickAllowed()) {
      console.log('🚫 Click throttled');
      return null;
    }

    const { visiblePOIs, currentPOIIndex, allPOIs, currentSliceMax } = state;

    // Check if we're at the last visible POI
    if (currentPOIIndex >= visiblePOIs.length - 1) {
      // At farthest visible POI - try to expand
      if (checkCanExpand(allPOIs, currentSliceMax)) {
        console.log(`📍 Expanding from ${currentSliceMax}mi to ${currentSliceMax + DISTANCE_SLICE_SIZE}mi`);
        return expandDistanceSlice();
      } else {
        console.log('📍 No more POIs to show');
        return 'NO_MORE_RESULTS'; // Special return value
      }
    }

    // Normal farther navigation
    const newIndex = currentPOIIndex + 1;

    setState(prevState => ({
      ...prevState,
      currentPOIIndex: newIndex,
      lastClickTime: Date.now(),
      isAtClosest: false,
      isAtFarthest: newIndex >= visiblePOIs.length - 1 && !checkCanExpand(allPOIs, currentSliceMax)
    }));

    console.log(`📍 Navigate farther: ${currentPOIIndex} -> ${newIndex}`);
    return visiblePOIs[newIndex];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isClickAllowed, checkCanExpand]); // expandDistanceSlice excluded to prevent circular dependency

  // Expand distance slice by 30 miles
  const expandDistanceSlice = useCallback(() => {
    const { allPOIs, currentSliceMax } = state;
    const newSliceMax = currentSliceMax + DISTANCE_SLICE_SIZE;
    const newVisiblePOIs = getVisiblePOIs(allPOIs, newSliceMax);

    // Find the closest NEW POI (the first one in the new slice)
    const previousVisibleCount = state.visiblePOIs.length;
    const newPOIsStartIndex = previousVisibleCount;

    setState(prevState => ({
      ...prevState,
      visiblePOIs: newVisiblePOIs,
      currentSliceMax: newSliceMax,
      currentPOIIndex: newPOIsStartIndex, // Jump to closest new POI
      lastClickTime: Date.now(),
      isAtClosest: false,
      isAtFarthest: newPOIsStartIndex >= newVisiblePOIs.length - 1 && !checkCanExpand(allPOIs, newSliceMax),
      canExpand: checkCanExpand(allPOIs, newSliceMax)
    }));

    console.log(`🔍 Expanded to ${newSliceMax}mi: ${previousVisibleCount} -> ${newVisiblePOIs.length} POIs`);
    return newVisiblePOIs[newPOIsStartIndex] || null;
  }, [state]); // Remove function dependencies that aren't stateful

  // Load data when location or filters change
  useEffect(() => {
    if (userLocation) {
      loadPOIData();
    }
  }, [userLocation, filters, loadPOIData]); // Re-enabled with proper dependencies

  // Return the hook interface
  return {
    // Data
    visiblePOIs: state.visiblePOIs,
    currentPOI: state.visiblePOIs[state.currentPOIIndex] || null,
    allPOICount: state.allPOIs.length,
    currentSliceMax: state.currentSliceMax,

    // State flags
    loading,
    error,
    isAtClosest: state.isAtClosest,
    isAtFarthest: state.isAtFarthest,
    canExpand: state.canExpand,

    // Actions
    navigateCloser,
    navigateFarther,
    reload: () => loadPOIData(true)
  };
};
