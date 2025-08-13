/**
 * ========================================================================
 * MAP VIEW MANAGER - DYNAMIC MAP CENTERING AND ZOOM OPTIMIZATION
 * ========================================================================
 * 
 * 📋 PURPOSE: Calculates optimal map center and zoom based on POI distribution and user location
 * 🔗 CONNECTS TO: App.tsx (main consumer), MapContainer (view output), POI data
 * 📊 DATA FLOW: POI locations + user location → geographic analysis → optimal center/zoom
 * ⚙️ STATE: mapCenter, mapZoom, dynamic view calculations
 * 🎯 USER IMPACT: Automatically centers map to show relevant POIs with optimal visibility
 * 
 * BUSINESS CONTEXT: Critical for outdoor recreation discovery user experience
 * - Automatically focuses on user location + nearest POIs for immediate relevance
 * - Prevents users from having to manually search/pan to find relevant locations
 * - Optimizes zoom level for maximum information density without overcrowding
 * - Essential for mobile users who need immediate spatial context
 * 
 * TECHNICAL IMPLEMENTATION: Geographic bounds calculation with dynamic zoom algorithms
 * - Distance-based sorting to identify closest POIs for view optimization
 * - Granular zoom level calculations based on geographic spread
 * - Fallback modes for no user location or empty POI sets
 * - Performance-optimized with useCallback for expensive calculations
 * 
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - Hook pattern provides reusable map view logic
 * - Geographic bounds calculation optimized for Minnesota geography  
 * - Granular zoom levels (0.5 increments) for precise control
 * - User location prioritized in view calculations when available
 * 
 * @CLAUDE_CONTEXT: Map view optimization for POI-centric outdoor recreation discovery
 * @BUSINESS_RULE: P1 MUST show user location and nearest POIs in single viewport
 * @INTEGRATION_POINT: Consumed by App.tsx, provides center/zoom to MapContainer
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json for testable thresholds
 * 
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * POI data loading → geographic analysis → optimal view calculation → map centering
 * USER JOURNEY: App load → location detection → POI discovery → automatic map centering
 * VALUE CHAIN: Spatial context → immediate relevance → faster activity discovery
 * 
 * LAST UPDATED: 2025-08-08
 */

import { useState, useCallback, useEffect } from 'react';
import { useMapViewStorage } from '../hooks/useLocalStorageState';
import { mapCalculationService } from '../services/MapCalculationService';

// 🔗 INTEGRATION: TypeScript interfaces for POI data structure
interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: string;
  distance?: number;
}

interface MapViewManagerResult {
  mapCenter: [number, number];
  mapZoom: number;
  updateMapView: (locations: Location[]) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

// 🔗 INTEGRATION: Custom hook providing map view management for App.tsx
export const useMapViewManager = (
  userLocation: [number, number] | null,
  defaultCenter: [number, number] = [44.9537, -93.0900], // Minneapolis fallback
  defaultZoom: number = 8
): MapViewManagerResult => {
  // Persistent map view state
  const [mapView, setMapView] = useMapViewStorage();
  const [mapCenter, setMapCenter] = useState<[number, number]>(mapView.center || defaultCenter);
  const [mapZoom, setMapZoom] = useState<number>(mapView.zoom || defaultZoom);

  // Save map view changes to localStorage
  useEffect(() => {
    setMapView({ center: mapCenter, zoom: mapZoom });
  }, [mapCenter, mapZoom, setMapView]);

  // 🎯 PERFORMANCE_CRITICAL: Geographic bounds calculation using MapCalculationService
  const calculateDynamicMapView = useCallback((filtered: Location[], userPos: [number, number]) => {
    if (filtered.length === 0) {
      // No POIs available - center on user location with medium zoom
      console.log('📍 No POIs available, centering on user location');
      return { center: userPos, zoom: 11 };
    }
    
    // Find closest 5 results for focused view
    const locationPoints = filtered.map(loc => ({
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng
    }));
    
    const closestResults = mapCalculationService.findClosestLocations(locationPoints, userPos, 5);
    
    // Calculate optimal view including user location and closest 5 results  
    const optimalView = mapCalculationService.calculateViewWithUserLocation(
      closestResults,
      userPos,
      { padding: 1.1, minZoom: 8, maxZoom: 18 } // Tighter padding for dynamic view
    );
    
    console.log(`📍 Dynamic map view: center=[${optimalView.center[0].toFixed(4)}, ${optimalView.center[1].toFixed(4)}], zoom=${optimalView.zoom}`);
    return { center: optimalView.center, zoom: optimalView.zoom };
  }, []);

  // Helper function to update map view - uses dynamic center calculation  
  const updateMapView = useCallback((locations: Location[]) => {
    if (userLocation) {
      // When user location exists, use dynamic center calculation
      const { center, zoom } = calculateDynamicMapView(locations, userLocation);
      setMapCenter(center);
      setMapZoom(zoom);
    } else if (locations.length > 0) {
      // No user location - fit all markers using MapCalculationService
      console.log('📍 No user location, fitting all POI markers');
      const locationPoints = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng
      }));
      
      const optimalView = mapCalculationService.calculateOptimalView(locationPoints, {
        fallbackCenter: defaultCenter,
        defaultZoom: defaultZoom
      });
      
      setMapCenter(optimalView.center);
      setMapZoom(optimalView.zoom);
    } else {
      // No locations and no user location - use Minneapolis default
      console.log('📍 No POIs or user location, using Minneapolis default');
      setMapCenter(defaultCenter);
      setMapZoom(defaultZoom);
    }
  }, [userLocation, calculateDynamicMapView, defaultCenter, defaultZoom]);

  return {
    mapCenter,
    mapZoom,
    updateMapView,
    setMapCenter,
    setMapZoom
  };
};