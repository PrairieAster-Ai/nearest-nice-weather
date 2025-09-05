/**
 * ========================================================================
 * NEAREST NICE WEATHER - MAIN APPLICATION COMPONENT
 * ========================================================================
 *
 * BUSINESS CONTEXT: Core application for outdoor recreation weather intelligence
 * - Primary target: Minnesota outdoor enthusiasts and recreation consumers
 * - Core value proposition: "Find optimal weather conditions for activities"
 * - Business model: B2C platform with market validation focus until 10,000 daily users
 * - Geographic focus: Minnesota with expansion to Upper Midwest planned
 *
 * TECHNICAL PURPOSE: React SPA providing interactive POI-weather discovery
 * - Interactive map with POI markers for 200+ Minnesota parks and recreation areas
 * - Dynamic filtering system for temperature, precipitation, and wind preferences
 * - User location integration for proximity-based recommendations
 * - Progressive Web App capabilities for mobile outdoor use
 *
 * DEPENDENCIES:
 * - React 18.3.1: Core framework with hooks for state management
 * - Material-UI: Design system for consistent professional UI
 * - Leaflet: Interactive mapping with OpenStreetMap tiles
 * - Custom hooks: usePOILocations for unified POI-weather data integration
 * - Backend APIs: poi-locations-with-weather, feedback endpoints via Vercel functions
 *
 * COMPONENT ARCHITECTURE:
 * - App (this file): Main container with state management and business logic
 * - MapContainer: Leaflet map integration with markers and popups
 * - FabFilterSystem: Floating action button filter interface
 * - FeedbackFab: User feedback collection system
 * - UnifiedStickyFooter: Navigation and branding footer
 *
 * DATA FLOW:
 * 1. App fetches POI locations with weather data via usePOILocations hook
 * 2. User location determined via geolocation → IP → fallback strategies
 * 3. Filters applied to create subset of POIs with suitable weather conditions
 * 4. Map view dynamically calculated to show user + closest filtered POI results
 * 5. User interactions (filter changes, marker drags) update state and view
 *
 * STATE MANAGEMENT:
 * - filters: User's weather preferences (temperature, precipitation, wind)
 * - filteredLocations: Subset of POI locations matching current weather filters
 * - mapCenter/mapZoom: Dynamic map view based on user location + POI results
 * - userLocation: User's position for proximity-based POI calculations
 *
 * USER EXPERIENCE GOALS:
 * - Instant visual feedback: Map updates immediately on filter changes
 * - Location-aware: Prioritizes weather near user's location
 * - Mobile-optimized: Touch-friendly interface for outdoor use
 * - Graceful degradation: Works without geolocation or with slow connections
 *
 * @CLAUDE_CONTEXT: Primary application entry point containing all business logic
 * @BUSINESS_RULE: P1 MUST focus on B2C consumer platform for Minnesota outdoor recreation market
 * @ARCHITECTURE_NOTE: Single-page application with real-time map interactions
 * @INTEGRATION_POINT: Connects all UI components with backend weather data
 * @PERFORMANCE_CRITICAL: Map rendering and filter calculations must be responsive
 *
 * 📚 DOCUMENTATION LINKS:
 * - Business Plan: /documentation/business-plan/master-plan.md
 * - Architecture: /documentation/architecture-overview.md
 * - User Stories: /documentation/user-personas/casual-outdoor-enthusiast.md
 * - Development Guide: /CLAUDE.md
 *
 * 🔗 COMPONENT INTEGRATIONS:
 * - LocationManager.tsx: Intelligent user positioning system
 * - FilterManager.tsx: Weather preference state management
 * - FabFilterSystem.tsx: Weather filter UI interface
 * - MapContainer.tsx: Extracted Leaflet map component with POI markers
 * - FeedbackFab.tsx: User feedback collection
 * - UnifiedStickyFooter.tsx: Navigation and branding
 *
 * 🔗 HOOK INTEGRATIONS:
 * - usePOINavigation.ts: POI discovery and distance-based navigation
 * - useLocalStorageState.ts: Cross-session preference persistence
 * - useFilterManager: Debounced weather filter state management
 *
 * 🔗 API INTEGRATIONS:
 * - /api/poi-locations-with-weather: Primary POI-weather data source
 * - /api/feedback: User feedback collection endpoint
 * - External: ipapi.co for IP-based geolocation
 *
 * LAST UPDATED: 2025-08-08
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, CircularProgress, Alert } from '@mui/material'
import { FabFilterSystem } from './components/FabFilterSystem'
import { FeedbackFab } from './components/FeedbackFab'
import { UnifiedStickyFooter } from './components/UnifiedStickyFooter'
import { LocationManager } from './components/LocationManager'
import { useFilterManager } from './components/FilterManager'
import { MapContainer, asterIcon } from './components/MapContainer'
import { useMapViewManager } from './components/MapViewManager'
import { usePOINavigation } from './hooks/usePOINavigation'
import { useLastVisitStorage, LocationMethod, WeatherFilters } from './hooks/useLocalStorageState'
import { escapeHtml, sanitizeUrl } from './utils/sanitize'
import { AdManagerProvider, AdUnit } from './components/ads'
import { loadUmamiAnalytics, trackPageView, trackLocationUpdate, trackWeatherFilter, trackPOIInteraction } from './utils/analytics'
import { weatherFilteringService, WeatherFilters as ServiceWeatherFilters, Location as ServiceLocation } from './services/WeatherFilteringService'
import { mapCalculationService } from './services/MapCalculationService'
import { useWeatherFiltering } from './hooks/useWeatherFiltering'
import 'leaflet/dist/leaflet.css'
import './popup-styles.css'
import L from 'leaflet'

// Distance calculation helper (returns miles)
// Distance calculation now handled by WeatherFilteringService
const calculateDistance = weatherFilteringService.calculateDistance;

// 🔗 INTEGRATION: asterIcon now imported from MapContainer.tsx for component encapsulation

// 🔗 INTEGRATION: MapComponent extracted to MapContainer.tsx component for maintainability

// PrairieAster.Ai theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#7563A8',
    },
    secondary: {
      main: '#4FC3F7',
    },
  },
})

interface WeatherFilters {
  temperature: string
  precipitation: string
  wind: string
}

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number // 0-100 scale (0 = clear, 100 = heavy rain/snow)
  windSpeed: number     // mph
}

// Weather locations now fetched from database via API

export default function App() {
  // Initialize analytics on app load
  useEffect(() => {
    loadUmamiAnalytics().then((loaded) => {
      if (loaded) {
        trackPageView();
      }
    });
  }, []);

  // Persistent user preferences with localStorage
  const [lastVisit, setLastVisit] = useLastVisitStorage()

  // Location state (managed by LocationManager)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationMethod, setLocationMethod] = useState<LocationMethod>('none')
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)

  // Filter state (managed by useFilterManager hook)
  const {
    filters,
    debouncedFilters,
    instantFilters,
    isFiltering,
    handleFilterChange
  } = useFilterManager()

  // Map view management (extracted to MapViewManager hook)
  const {
    mapCenter,
    mapZoom,
    updateMapView,
    setMapCenter,
    setMapZoom
  } = useMapViewManager(userLocation)
  const currentApiLocationsRef = useRef<Location[]>([])
  const currentFilteredLocationsRef = useRef<Location[]>([])

  // Fetch POI locations with weather from unified API (base search)
  // New POI navigation system - single API call with distance slicing
  const {
    visiblePOIs,
    currentPOI,
    allPOICount,
    currentSliceMax,
    loading: poiLoading,
    error: poiError,
    isAtClosest,
    isAtFarthest,
    canExpand,
    navigateCloser,
    navigateFarther,
    reload: reloadPOIs
  } = usePOINavigation(userLocation, filters)

  // Filter management is now handled by FilterManager component

  // Update last visit timestamp
  useEffect(() => {
    const currentVisit = new Date().toISOString()
    if (lastVisit !== currentVisit.split('T')[0]) { // Only update once per day
      setLastVisit(currentVisit.split('T')[0]) // Fixed: only store date part, not full timestamp
      console.log('📅 Visit recorded:', currentVisit.split('T')[0])
    }
  }, [lastVisit, setLastVisit]) // Re-enabled with proper date comparison

  // 🔗 INTEGRATION: Map view persistence now handled by MapViewManager hook

  // Weather filtering operations now handled by useWeatherFiltering hook
  const { filterResultCounts, applyWeatherFilters } = useWeatherFiltering(visiblePOIs, userLocation);

  // Use POI data from new navigation hook
  const apiLocations = React.useMemo(() => {
    console.log(`POI locations: ${allPOICount} total, ${visiblePOIs.length} visible within ${currentSliceMax}mi`)
    console.log(`Loading: ${poiLoading}, Error: ${poiError}`)
    console.log(`User location:`, userLocation)

    // Update the refs with current locations for compatibility
    currentApiLocationsRef.current = visiblePOIs
    currentFilteredLocationsRef.current = visiblePOIs

    return visiblePOIs
  }, [visiblePOIs, allPOICount, currentSliceMax, poiLoading, poiError, userLocation])

  /**
   * RELATIVE WEATHER FILTERING ALGORITHM
   * @CLAUDE_CONTEXT: Core business logic for weather-based location discovery
   *
   * BUSINESS LOGIC: Intelligent filtering based on current weather conditions
   * - Avoids absolute thresholds that become meaningless across seasons
   * - Provides meaningful "cold/mild/hot" relative to what's actually available
   * - Ensures users always get results relevant to current weather patterns
   * - Supports outdoor activity planning with relative weather preferences
   *
   * TECHNICAL IMPLEMENTATION: Percentile-based filtering system
   * - Sorts all available weather data to establish relative thresholds
   * - Uses percentile ranges to define "cold", "mild", "hot" dynamically
   * - Maintains consistent result distribution regardless of season
   * - Prevents empty result sets by adapting to available data
   *
   * BUSINESS RULE: Always provide actionable weather options to users
   * - "Cold" = Coldest 20% of available locations
   * - "Mild" = Middle 60% of available locations
   * - "Hot" = Hottest 20% of available locations
   * - Same logic applies to precipitation and wind conditions
   *
   * @BUSINESS_RULE: Relative filtering ensures seasonal relevance
   * @PERFORMANCE_CRITICAL: Efficient sorting and filtering for real-time UI updates
   */
  // 🔗 INTEGRATION: Weather filtering operations now handled by useWeatherFiltering hook

  // 🔗 INTEGRATION: Map view calculations now handled by MapViewManager hook

  // Location management is now handled by LocationManager component

  // Track previous values to prevent infinite loops
  const prevMapState = useRef({ userLocation, filters, apiLocationsLength: apiLocations.length });

  // Apply filters when user location or API data changes
  useEffect(() => {
    // Wait for API data to load before any map calculations
    if (apiLocations.length === 0) {
      return
    }

    // Check if relevant data actually changed
    const prevState = prevMapState.current;
    const hasLocationChanged = JSON.stringify(prevState.userLocation) !== JSON.stringify(userLocation);
    const hasFiltersChanged = JSON.stringify(prevState.filters) !== JSON.stringify(filters);
    const hasDataChanged = prevState.apiLocationsLength !== apiLocations.length;

    if (!hasLocationChanged && !hasFiltersChanged && !hasDataChanged) {
      return; // No relevant changes, skip update
    }

    if (userLocation === null) {
      // No user location yet - apply default filters to show good variety of locations
      // New system: POI hook handles all filtering and distance constraints
      const filtered = visiblePOIs

      // Use MapCalculationService for optimal view calculation
      if (filtered.length > 0) {
        // Convert to MapCalculationService format
        const locationPoints = filtered.map(loc => ({
          id: loc.id,
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng
        }));

        // Calculate optimal view using the service
        const optimalView = mapCalculationService.calculateOptimalView(locationPoints);
        setMapCenter(optimalView.center);
        setMapZoom(optimalView.zoom);

        // Give markers time to render, then ensure they're visible
        setTimeout(() => {
          // DEBUG: Map viewport debugging for responsive design issues and marker visibility problems
          console.log('Zoom fix active:', optimalView.zoom, 'Center:', optimalView.center[0].toFixed(3), optimalView.center[1].toFixed(3))
          setMapCenter(optimalView.center);
          setMapZoom(optimalView.zoom);
        }, 100);
      }
    } else {
      // User location available - use POI hook data (already filtered)
      // New system: POI hook handles all filtering and distance constraints
      const filtered = visiblePOIs
      console.log(`POI hook locations: ${allPOICount} total, ${filtered.length} visible within ${currentSliceMax}mi`)

      // Filtered locations now managed by POI hook directly

      // Update map center to show current POI locations (using MapViewManager)
      updateMapView(filtered)
    }

    // Map ready state now managed by POI hook
    // Update previous state tracking
    prevMapState.current = { userLocation, filters, apiLocationsLength: apiLocations.length };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, filters, apiLocations, updateMapView]); // updateMapView from MapViewManager hook

  // TODO: New suggestion application logic will be implemented here

  // Filter handling is now managed by FilterManager component

  const handleUserLocationChange = (newPosition: [number, number]) => {
    console.log('📍 User location changed manually:', newPosition)

    // Track location update for analytics
    trackLocationUpdate({
      lat: newPosition[0],
      lng: newPosition[1],
      source: 'manual'
    });

    // Update component state
    setUserLocation(newPosition)
    setLocationMethod('manual')
    setShowLocationPrompt(false) // User has moved the marker, so hide the prompt

    // CRITICAL: Also save to localStorage for persistence
    try {
      localStorage.setItem('userLocation', JSON.stringify(newPosition));
      localStorage.setItem('locationMethod', JSON.stringify('manual'));
      localStorage.setItem('showLocationPrompt', JSON.stringify(false));
      console.log('📍 Location saved to localStorage:', newPosition);
    } catch (error) {
      console.warn('Failed to save location to localStorage:', error);
    }

    // Distance and expansion now managed by POI hook automatically
    // POI hook will automatically reload with new user location
    console.log(`User location change: POI hook will reload data`)

    // Location change resets expansion state

    // Use MapViewManager for optimal view calculation
    updateMapView(visiblePOIs)
  }

  // Function to expand display distance (no API calls needed)
  // TODO: New expansion logic will be implemented here

  // TODO: New suggestion system will be implemented here

  // TODO: New navigation and popup system will be implemented here

  // TODO: New no-results handling will be implemented here

  // TODO: All expansion and navigation logic now handled by usePOINavigation hook

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdManagerProvider enableAds={true} testMode={process.env.NODE_ENV === 'development'}>
        {/* Location Management Component */}
        <LocationManager
          onLocationChange={setUserLocation}
          onLocationMethodChange={setLocationMethod}
          onShowPromptChange={setShowLocationPrompt}
          onMapCenterChange={setMapCenter}
        />

        {/* Filter management is now handled by useFilterManager hook */}

        <div className="h-screen w-screen flex flex-col" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>

        {/* Loading State */}
        {poiLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[2000]">
            <div className="flex flex-col items-center space-y-4">
              <CircularProgress size={48} sx={{ color: '#7563A8' }} />
              <div className="text-lg font-medium text-gray-700">Loading weather locations...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {poiError && !poiLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000] max-w-md">
            <Alert
              severity="error"
              action={
                <button
                  onClick={reloadPOIs}
                  className="text-sm font-medium underline text-red-800 hover:text-red-900"
                >
                  Retry
                </button>
              }
            >
              Failed to load weather data: {poiError}
            </Alert>
          </div>
        )}

        {/* Location Prompt */}
        {showLocationPrompt && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[2000] max-w-md">
            <Alert
              severity="info"
              action={
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="text-sm font-medium underline text-blue-800 hover:text-blue-900"
                >
                  Dismiss
                </button>
              }
            >
              Drag the blue marker to your location for personalized weather recommendations
            </Alert>
          </div>
        )}

        {/* Map Container - Full height, no padding, seamless with footer */}
        <div className="flex-1 relative" style={{ zIndex: 1003 }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            locations={visiblePOIs}
            userLocation={userLocation}
            onLocationChange={handleUserLocationChange}
            currentPOI={currentPOI}
            isAtClosest={isAtClosest}
            isAtFarthest={isAtFarthest}
            canExpand={canExpand}
            onNavigateCloser={navigateCloser}
            onNavigateFarther={navigateFarther}
          />

          {/* FAB Filter System - top right, expanding left */}
          <div className="absolute top-6 right-6 z-[1000]">
            <FabFilterSystem
              filters={debouncedFilters}
              onFilterChange={handleFilterChange}
              isLoading={isFiltering}
            />
          </div>

          {/* Feedback FAB - positioned above footer, responsive to footer size */}
          <div className="absolute right-6 z-[1000]" style={{
            bottom: window.innerWidth < 600 ? 'max(calc(5.6vh + 8px), 50px)' : 'max(calc(6vh + 8px), 58px)'
          }}>
            <FeedbackFab />
          </div>
        </div>

        {/* Unified Sticky Footer */}
        <UnifiedStickyFooter />
      </div>
      </AdManagerProvider>
    </ThemeProvider>
  )
}// ATTEMPT 3: Force frontend cache refresh $(date +%s)
