/**
 * ========================================================================
 * LOCATION MANAGER - INTELLIGENT USER POSITIONING SYSTEM
 * ========================================================================
 * 
 * 📋 PURPOSE: Manages user location detection, storage, and state synchronization
 * 🔗 CONNECTS TO: App.tsx (main container), useLocalStorageState (persistence)
 * 📊 DATA FLOW: IP detection → geolocation → localStorage → React state → map center
 * ⚙️ STATE: userLocation, locationMethod, showLocationPrompt
 * 🎯 USER IMPACT: Seamless location discovery for personalized POI recommendations
 * 
 * BUSINESS CONTEXT: Critical for Minnesota outdoor recreation personalization
 * - Intelligent fallback chain: geolocation → IP → default Minneapolis
 * - Persistent user preferences prevent repeated location requests
 * - Supports manual positioning via map marker drag for precision
 * 
 * TECHNICAL IMPLEMENTATION: Multi-strategy location detection with persistence
 * - IP geolocation via ipapi.co for automatic positioning without permissions
 * - Browser geolocation available for high-precision "Find My Location" features
 * - localStorage synchronization maintains location across sessions
 * - React state bridge connects location logic to UI components
 * 
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - IP-first strategy avoids permission prompts for better UX
 * - Logic-only component pattern for reusable location management
 * - Callback-based communication prevents tight coupling with parent
 * - Initialization guard prevents multiple location requests
 * 
 * @CLAUDE_CONTEXT: Core location intelligence for personalized outdoor discovery
 * @BUSINESS_RULE: P0 MUST provide fallback location (Minneapolis) for all users within 10 seconds
 * @INTEGRATION_POINT: localStorage hooks for cross-session persistence
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json for testable thresholds
 * @PRIVACY_AWARE: IP detection used before requesting geolocation permissions
 * 
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * User arrives → location detection → personalized POI distance calculations → weather matching
 * USER JOURNEY: App load → location discovery → map centering → distance-based recommendations
 * VALUE CHAIN: Location context → proximity calculations → personalized outdoor suggestions
 * FALLBACK STRATEGY: Geolocation → IP detection → Minneapolis default → manual positioning
 * 
 * LAST UPDATED: 2025-08-08
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { 
  useUserLocationStorage, 
  useLocationMethodStorage, 
  useShowLocationPromptStorage,
  LocationMethod 
} from '../hooks/useLocalStorageState';

// 🔗 INTEGRATION: Provides location context for FabFilterSystem.tsx weather filtering
// 🔗 INTEGRATION: Consumed by App.tsx for map centering and POI distance calculations
// 🔗 SEE ALSO: usePOINavigation.ts for location-aware POI discovery

interface LocationManagerProps {
  onLocationChange: (location: [number, number] | null) => void;
  onLocationMethodChange: (method: LocationMethod) => void;
  onShowPromptChange: (show: boolean) => void;
  onMapCenterChange: (center: [number, number]) => void;
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  onLocationChange,
  onLocationMethodChange,
  onShowPromptChange,
  onMapCenterChange
}) => {
  // Persistent state
  const [userLocation, setUserLocation] = useUserLocationStorage();
  const [locationMethod, setLocationMethod] = useLocationMethodStorage();
  const [showLocationPrompt, setShowLocationPrompt] = useShowLocationPromptStorage();
  
  // Track initialization to prevent multiple runs
  const locationInitialized = useRef(false);

  // IP geolocation function wrapped in useCallback to prevent recreation
  const getLocationFromIP = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      if (data.latitude && data.longitude) {
        const ipLocation: [number, number] = [data.latitude, data.longitude]
        setUserLocation(ipLocation)
        setLocationMethod('ip')
        onMapCenterChange(ipLocation)
        setShowLocationPrompt(false)
        console.log('📍 Location saved from IP:', ipLocation)
        return true
      }
    } catch {
      // IP location failed
    }
    return false
  }, [setUserLocation, setLocationMethod, onMapCenterChange, setShowLocationPrompt])

  // Location initialization function wrapped in useCallback
  const initializeLocation = useCallback(async () => {
    // If we have a saved location, use it
    if (userLocation && locationMethod !== 'none') {
      console.log(`📍 Using saved location (${locationMethod}):`, userLocation)
      onMapCenterChange(userLocation)
      return
    }
    
    // Otherwise, try to get location automatically
    // Start with IP location (no user gesture required) to avoid geolocation violation
    // Geolocation will be triggered by user interaction (e.g., "Find My Location" button)
    const ipSuccess = await getLocationFromIP()
    if (!ipSuccess) {
      // Keep the default location and show prompt to move marker
      setShowLocationPrompt(true)
    }
  }, [userLocation, locationMethod, getLocationFromIP, onMapCenterChange, setShowLocationPrompt])

  // User-triggered geolocation (for "Find My Location" button or similar)
  // Available for future use
  const requestUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude]
          setUserLocation(userPos)
          setLocationMethod('geolocation')
          onMapCenterChange(userPos)
          setShowLocationPrompt(false)
          console.log('📍 Location saved from geolocation:', userPos)
        },
        (error) => {
          // DEBUG: Track geolocation failures to measure user-triggered location request success rate
          console.log('User-requested geolocation failed:', error.message)
          // Could show a user-friendly error message here
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    }
  }, [setUserLocation, setLocationMethod, onMapCenterChange, setShowLocationPrompt])

  // Location strategy: geolocation → IP → fallback position
  useEffect(() => {
    // Always try to initialize location on first mount
    if (locationInitialized.current) {
      return
    }

    locationInitialized.current = true
    initializeLocation()
  }, [initializeLocation])

  // Notify parent components of changes
  useEffect(() => {
    onLocationChange(userLocation);
  }, [userLocation, onLocationChange]);

  useEffect(() => {
    onLocationMethodChange(locationMethod);
  }, [locationMethod, onLocationMethodChange]);

  useEffect(() => {
    onShowPromptChange(showLocationPrompt);
  }, [showLocationPrompt, onShowPromptChange]);

  // Keep the function available for future features
  if (false) requestUserLocation()

  // This component doesn't render anything - it's just location management logic
  return null;
};