/**
 * PERSISTENT USER PREFERENCES HOOK - LOCAL STORAGE STATE MANAGEMENT
 * 
 * PURPOSE: Remember user's weather filter and location preferences across sessions
 * - Saves filter settings (temperature, precipitation, wind preferences)
 * - Preserves user location to avoid repeated location prompts
 * - Enhances UX by maintaining user's preferred settings
 * - Critical for outdoor recreation app where users have specific weather preferences
 * 
 * BUSINESS CONTEXT: Core to user retention and engagement
 * - Eliminates need to reconfigure filters on each visit
 * - Maintains location context for personalized recommendations
 * - Supports "instant gratification" by loading preferred state immediately
 * - Essential for repeat users who develop specific weather/location preferences
 * 
 * TECHNICAL IMPLEMENTATION:
 * - Syncs React state with localStorage automatically
 * - Handles JSON serialization/deserialization safely
 * - Provides fallback values when localStorage unavailable
 * - Optimized for performance with minimal re-renders
 */

import { useState, useEffect, useCallback } from 'react';

// 🔗 INTEGRATION: Used by LocationManager.tsx for user location persistence
// 🔗 INTEGRATION: Used by FilterManager.tsx for weather preference persistence  
// 🔗 INTEGRATION: Used by App.tsx for map view state persistence
// 🔗 SEE ALSO: All components rely on this for cross-session state management

export function useLocalStorageState<T>(
  key: string, 
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with value from localStorage or default
  const [state, setState] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedValue = localStorage.getItem(key);
        if (savedValue !== null) {
          return JSON.parse(savedValue);
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  // Stable setState function that doesn't change on every render
  const stableSetState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      setState(prev => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        // Only update if the value actually changed to prevent unnecessary re-renders
        if (JSON.stringify(newValue) === JSON.stringify(prev)) {
          return prev;
        }
        return newValue;
      });
    },
    [] // No dependencies - this function should never change
  );

  // Update localStorage whenever state changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, stableSetState];
}

/**
 * WEATHER APP SPECIFIC STORAGE KEYS
 * Organized by feature area for easy management
 */
export const STORAGE_KEYS = {
  // Weather filter preferences
  WEATHER_FILTERS: 'nearestNiceWeather_filters',
  
  // User location data
  USER_LOCATION: 'nearestNiceWeather_userLocation',
  LOCATION_METHOD: 'nearestNiceWeather_locationMethod', // 'geolocation', 'ip', 'manual'
  
  // UI preferences
  MAP_VIEW: 'nearestNiceWeather_mapView', // center and zoom
  LAST_VISIT: 'nearestNiceWeather_lastVisit',
  
  // Feature preferences
  SHOW_LOCATION_PROMPT: 'nearestNiceWeather_showLocationPrompt',
} as const;

/**
 * TYPED LOCALSTORAGE HOOKS
 * Pre-configured hooks for specific app data types
 */

// Weather filters with sensible defaults for Minnesota outdoor activities
export interface WeatherFilters {
  temperature: string;
  precipitation: string;
  wind: string;
}

export function useWeatherFiltersStorage() {
  return useLocalStorageState<WeatherFilters>(STORAGE_KEYS.WEATHER_FILTERS, {
    temperature: 'mild',    // Good default for Minnesota outdoor activities
    precipitation: 'none',  // Most people prefer dry conditions
    wind: 'calm'           // Calm conditions good for most activities
  });
}

// User location with null default (requires user input)
export function useUserLocationStorage() {
  return useLocalStorageState<[number, number] | null>(
    STORAGE_KEYS.USER_LOCATION, 
    null // Start null to trigger location detection
  );
}

// Map view settings
export interface MapViewSettings {
  center: [number, number];
  zoom: number;
}

export function useMapViewStorage() {
  return useLocalStorageState<MapViewSettings>(STORAGE_KEYS.MAP_VIEW, {
    center: [46.7296, -94.6859], // Minnesota center default
    zoom: 7
  });
}

// Location method tracking
export type LocationMethod = 'geolocation' | 'ip' | 'manual' | 'none';

export function useLocationMethodStorage() {
  return useLocalStorageState<LocationMethod>(
    STORAGE_KEYS.LOCATION_METHOD, 
    'none'
  );
}

// UI state preferences
export function useShowLocationPromptStorage() {
  return useLocalStorageState<boolean>(
    STORAGE_KEYS.SHOW_LOCATION_PROMPT, 
    true // Show prompt by default for new users
  );
}

// Last visit tracking for analytics and user experience
export function useLastVisitStorage() {
  return useLocalStorageState<string | null>(
    STORAGE_KEYS.LAST_VISIT, 
    null
  );
}