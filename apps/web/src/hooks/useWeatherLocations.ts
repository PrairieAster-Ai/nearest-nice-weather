// ====================================================================
// 🗑️ LEGACY WEATHER LOCATIONS HOOK - REMOVED (2025-08-05)
// ====================================================================
//
// ❌ DEPRECATED: This hook queried cities from weather stations (not outdoor recreation POIs)
// ✅ REPLACED BY: usePOINavigation.ts and usePOILocations.ts
//
// 🎯 BUSINESS RATIONALE:
// - Weather stations in cities don't align with outdoor recreation focus
// - POI-centric architecture provides better user experience
// - Frontend now uses POI system exclusively via usePOINavigation hook
//
// 🔄 MIGRATION IMPACT:
// - No components import this hook (verified via grep)
// - Main App.tsx uses usePOINavigation exclusively
// - Safe to remove without breaking changes
//
// 📚 HISTORICAL CONTEXT:
// This hook was designed for weather-station-centric discovery model.
// Business model evolved to outdoor recreation POI discovery, making
// weather stations obsolete for primary user experience.
//
// @DEPRECATED_DATE: 2025-08-05
// @REPLACED_BY: usePOINavigation.ts (primary), usePOILocations.ts (secondary)
// @BUSINESS_IMPACT: None (unused by any components)
// @REMOVAL_REASON: Code cleanup, eliminate legacy architecture
// ====================================================================

// This file intentionally left as documentation placeholder.
// All functionality moved to POI-based hooks.

export const DEPRECATED_useWeatherLocations = () => {
  throw new Error(
    'useWeatherLocations is deprecated. Use usePOINavigation or usePOILocations instead.'
  )
}

export function useWeatherLocations() {
  // Redirect to new POI-based hooks
  return DEPRECATED_useWeatherLocations()
}

// Legacy interfaces kept for any remaining imports
interface UseWeatherLocationsOptions {
  userLocation?: [number, number] | null
  radius?: number
  limit?: number
}

interface WeatherLocation {
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

// ====================================================================
// 📚 MIGRATION GUIDE FOR FUTURE CLAUDE SESSIONS
// ====================================================================
//
// 🔄 TO REPLACE useWeatherLocations with POI-based hooks:
//
// OLD PATTERN:
// ```
// import { useWeatherLocations } from './hooks/useWeatherLocations'
// const { locations, loading, error } = useWeatherLocations({
//   userLocation: [lat, lng],
//   radius: 50,
//   limit: 100
// })
// ```
//
// NEW PATTERN (Primary - for main map interface):
// ```
// import { usePOINavigation } from './hooks/usePOINavigation'
// const {
//   visiblePOIs,
//   loading,
//   error,
//   expandDistance,
//   hasMorePOIs
// } = usePOINavigation([lat, lng], filters)
// ```
//
// NEW PATTERN (Secondary - for simple POI lists):
// ```
// import { usePOILocations } from './hooks/usePOILocations'
// const { locations, loading, error } = usePOILocations({
//   userLocation: [lat, lng],
//   limit: 100
// })
// ```
//
// 🎯 KEY DIFFERENCES:
// - Weather locations returned cities (Minneapolis, Brainerd, etc.)
// - POI locations return outdoor recreation destinations (parks, trails, forests)
// - POI system includes auto-expanding search radius
// - POI system includes weather data integration
// - POI system supports distance-based slicing and navigation
//
// ====================================================================
