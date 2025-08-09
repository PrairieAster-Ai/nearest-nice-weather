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
import 'leaflet/dist/leaflet.css'
import './popup-styles.css'
import L from 'leaflet'

// Distance calculation helper (returns miles)
const calculateDistance = (point1: [number, number], point2: [number, number]) => {
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
};

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

  // Simplified filter result counts for FAB badges (to prevent performance issues)
  const filterResultCounts = React.useMemo(() => {
    if (!visiblePOIs || visiblePOIs.length === 0) return {}
    
    // Simplified approach: just return the current visible POI count for all options
    // This prevents expensive recalculations and potential infinite loops
    const count = visiblePOIs.length
    const counts: { [key: string]: number } = {}
    
    const filterOptions = ['cold', 'mild', 'hot', 'none', 'light', 'heavy', 'calm', 'breezy', 'windy']
    filterOptions.forEach(option => {
      counts[`temperature_${option}`] = count
      counts[`precipitation_${option}`] = count
      counts[`wind_${option}`] = count
    })
    
    return counts
  }, [visiblePOIs.length]) // Only depend on length to reduce recalculations

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
  /**
   * SIMPLE WEATHER FILTERING - STABLE IMPLEMENTATION
   * 
   * ⚠️  STOP RULES - DO NOT VIOLATE:
   * 1. DO NOT MODIFY FILTER PERCENTAGES TO "SHOW MORE RESULTS"
   * 2. DO NOT RECALCULATE THRESHOLDS DURING RADIUS EXPANSION
   * 3. DO NOT CHANGE FILTERING LOGIC TO "IMPROVE" RESULTS
   * 
   * CRITICAL BEHAVIOR: During radius expansion, thresholds are calculated from
   * BASE locations only (not expanded set) to ensure original results remain visible.
   * This prevents the confusing UX where expanding radius causes locations to disappear.
   * 
   * @BUSINESS_RULE: Filter thresholds must remain constant during radius expansion
   * @UX_RULE: Original filtered locations must remain visible after expansion
   * @TECHNICAL_IMPLEMENTATION: useBaseForThresholds=true during expansion
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const applyWeatherFilters = (locations: Location[], filters: WeatherFilters, maxDistance?: number): Location[] => {
    if (locations.length === 0) return []
    
    let filtered = [...locations]
    console.log(`🎯 WEATHER FILTERING: ${locations.length} locations → applying filters`)
    
    // DISTANCE FILTERING - Apply distance constraint if provided
    if (maxDistance && userLocation) {
      const startCount = filtered.length
      filtered = filtered.filter(loc => {
        const distance = calculateDistance(userLocation, [loc.lat, loc.lng])
        return distance <= maxDistance
      })
      console.log(`📏 Distance filter: ${startCount} → ${filtered.length} locations within ${maxDistance} miles`)
    }

    // TEMPERATURE FILTERING
    // DO NOT ADJUST THESE PERCENTAGES - they determine what "mild/cold/hot" means
    if (filters.temperature && filters.temperature.length > 0) {
      // Use all locations for calculating thresholds
      const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
      const tempCount = temps.length
      
      if (filters.temperature === 'cold') {
        // Show coldest 40% of available temperatures
        const threshold = temps[Math.floor(tempCount * 0.4)]
        filtered = filtered.filter(loc => loc.temperature <= threshold)
        console.log(`❄️  Cold filter: temps ≤ ${threshold}°F`)
      } else if (filters.temperature === 'hot') {
        // Show hottest 40% of available temperatures  
        const threshold = temps[Math.floor(tempCount * 0.6)]
        filtered = filtered.filter(loc => loc.temperature >= threshold)
        console.log(`🔥 Hot filter: temps ≥ ${threshold}°F`)
      } else if (filters.temperature === 'mild') {
        // Show middle 80% of temperatures (exclude extreme 10% on each end)
        const minThreshold = temps[Math.floor(tempCount * 0.1)]
        const maxThreshold = temps[Math.floor(tempCount * 0.9)]
        filtered = filtered.filter(loc => loc.temperature >= minThreshold && loc.temperature <= maxThreshold)
        console.log(`🌤️  Mild filter: temps ${minThreshold}°F - ${maxThreshold}°F`)
      }
    }

    // PRECIPITATION FILTERING
    // DO NOT ADJUST THESE PERCENTAGES - they determine what "dry/light/heavy" means
    if (filters.precipitation && filters.precipitation.length > 0) {
      const precips = locations.map(loc => loc.precipitation).sort((a, b) => a - b)
      const precipCount = precips.length
      
      if (filters.precipitation === 'none') {
        // Show driest 60% of available locations
        const threshold = precips[Math.floor(precipCount * 0.6)]
        filtered = filtered.filter(loc => loc.precipitation <= threshold)
        console.log(`☀️  No precip filter: precip ≤ ${threshold}%`)
      } else if (filters.precipitation === 'light') {
        // Show middle precipitation range (20th-70th percentile)
        const minThreshold = precips[Math.floor(precipCount * 0.2)]
        const maxThreshold = precips[Math.floor(precipCount * 0.7)]
        filtered = filtered.filter(loc => loc.precipitation >= minThreshold && loc.precipitation <= maxThreshold)
        console.log(`🌦️  Light precip filter: precip ${minThreshold}% - ${maxThreshold}%`)
      } else if (filters.precipitation === 'heavy') {
        // Show wettest 30% of available locations
        const threshold = precips[Math.floor(precipCount * 0.7)]
        filtered = filtered.filter(loc => loc.precipitation >= threshold)
        console.log(`🌧️  Heavy precip filter: precip ≥ ${threshold}%`)
      }
    }

    // WIND FILTERING  
    // DO NOT ADJUST THESE PERCENTAGES - they determine what "calm/breezy/windy" means
    if (filters.wind && filters.wind.length > 0) {
      const winds = locations.map(loc => loc.windSpeed).sort((a, b) => a - b)
      const windCount = winds.length
      
      if (filters.wind === 'calm') {
        // Show calmest 50% of available locations
        const threshold = winds[Math.floor(windCount * 0.5)]
        filtered = filtered.filter(loc => loc.windSpeed <= threshold)
        console.log(`🍃 Calm filter: wind ≤ ${threshold}mph`)
      } else if (filters.wind === 'breezy') {
        // Show middle wind range (30th-70th percentile)
        const minThreshold = winds[Math.floor(windCount * 0.3)]
        const maxThreshold = winds[Math.floor(windCount * 0.7)]
        filtered = filtered.filter(loc => loc.windSpeed >= minThreshold && loc.windSpeed <= maxThreshold)
        console.log(`💨 Breezy filter: wind ${minThreshold} - ${maxThreshold}mph`)
      } else if (filters.wind === 'windy') {
        // Show windiest 30% of available locations
        const threshold = winds[Math.floor(windCount * 0.7)]
        filtered = filtered.filter(loc => loc.windSpeed >= threshold)
        console.log(`🌪️  Windy filter: wind ≥ ${threshold}mph`)
      }
    }

    // Return empty array if no matches - let radius expansion find more locations
    if (filtered.length === 0) {
      console.log(`⚠️ No results after filtering within current radius`)
      return []
    }

    console.log(`✅ Filter results: ${locations.length} → ${filtered.length} locations`)
    
    // DEBUG: Total marker count validation
    if (filtered.length > 21) {
      console.error(`🚨 ERROR: Displaying ${filtered.length} markers but only 21 POI should match sensible defaults!`)
      console.error(`🚨 This indicates a filtering or data issue - investigate immediately`)
      console.error(`🚨 Locations passing filter:`, filtered.map(loc => `${loc.name} (${loc.temperature}°F, ${loc.precipitation}%, ${loc.windSpeed}mph)`))
    } else {
      console.log(`📍 Total markers to display: ${filtered.length} (Expected max: 21 POI)`)
    }
    
    return filtered
  }

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
      
      // Use smarter zoom calculation for filtered markers
      if (filtered.length > 0) {
        // For Minnesota weather platform, show regional context with all filtered markers
        // Use all filtered markers to provide comprehensive regional view
        const markersToShow = filtered
        
        const lats = markersToShow.map(loc => loc.lat)
        const lngs = markersToShow.map(loc => loc.lng)
        
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        
        // Calculate center of the closest markers
        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2
        setMapCenter([centerLat, centerLng])
        
        // Use tighter zoom calculation for initial view focused on marker cluster
        const latRange = maxLat - minLat
        const lngRange = maxLng - minLng
        const maxRange = Math.max(latRange, lngRange)
        
        // Use appropriate padding for regional Minnesota view
        const paddedRange = Math.max(maxRange * 1.2, 0.5) // Ensure good regional context for Minnesota
        
        // Use zoom levels optimized for Minnesota regional weather view
        let zoom = 8 // Start with regional view for statewide weather
        if (paddedRange < 4.0) zoom = 8   // Statewide view
        if (paddedRange < 3.0) zoom = 8.5 // Large regional view  
        if (paddedRange < 2.0) zoom = 9   // Regional view
        if (paddedRange < 1.5) zoom = 9.5 // Sub-regional view
        if (paddedRange < 1.0) zoom = 10  // Multi-city view
        if (paddedRange < 0.7) zoom = 10.5
        if (paddedRange < 0.5) zoom = 11  // City cluster view
        if (paddedRange < 0.3) zoom = 11.5
        if (paddedRange < 0.2) zoom = 12  // Close cluster view
        if (paddedRange < 0.1) zoom = 13  // Very close markers
        
        setMapZoom(zoom)
        
        // Give markers time to render, then ensure they're visible
        setTimeout(() => {
          // DEBUG: Map viewport debugging for responsive design issues and marker visibility problems
          console.log('Zoom fix active:', zoom, 'Center:', centerLat.toFixed(3), centerLng.toFixed(3))
          setMapCenter([centerLat, centerLng])
          setMapZoom(zoom)
        }, 100)
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
              resultCounts={filterResultCounts}
              totalPOIs={visiblePOIs.length}
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
