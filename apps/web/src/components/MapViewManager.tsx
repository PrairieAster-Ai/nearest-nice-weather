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

  // 🎯 PERFORMANCE_CRITICAL: Geographic bounds calculation with granular zoom optimization
  const calculateDynamicMapView = useCallback((filtered: Location[], userPos: [number, number]) => {
    if (filtered.length === 0) {
      // No POIs available - center on user location with medium zoom
      console.log('📍 No POIs available, centering on user location');
      return { center: userPos, zoom: 11 };
    }
    
    // Calculate distances from user location to all results
    const distancesWithLocations = filtered.map(location => {
      const latDiff = location.lat - userPos[0];
      const lngDiff = location.lng - userPos[1];
      return {
        distance: Math.sqrt(latDiff * latDiff + lngDiff * lngDiff),
        location
      };
    });
    
    // Sort by distance (closest first)
    distancesWithLocations.sort((a, b) => a.distance - b.distance);
    
    // Get the closest 5 results (or all if less than 5)
    const targetCount = Math.min(5, filtered.length);
    const closestResults = distancesWithLocations.slice(0, targetCount);
    
    // Calculate bounds including user location and closest 5 results
    const allLats = [userPos[0], ...closestResults.map(r => r.location.lat)];
    const allLngs = [userPos[1], ...closestResults.map(r => r.location.lng)];
    
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);
    
    // Calculate dynamic center that optimizes the view of user + closest results
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate the geographic spread for zoom optimization
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const maxRange = Math.max(latRange, lngRange);
    
    // Minimal padding factor for edge visibility - maximum zoom while keeping all points visible
    const paddedRange = maxRange * 1.1;
    
    // Convert range to zoom level - granular increments for precise control
    let zoom = 18; // Start with maximum zoom
    if (paddedRange > 0.008) zoom = 17.5;   // Ultra-fine adjustment
    if (paddedRange > 0.012) zoom = 17;     // Extremely close grouping
    if (paddedRange > 0.018) zoom = 16.5;   // Fine adjustment
    if (paddedRange > 0.025) zoom = 16;     // Very close grouping
    if (paddedRange > 0.035) zoom = 15.5;   // Fine adjustment
    if (paddedRange > 0.050) zoom = 15;     // Close grouping
    if (paddedRange > 0.070) zoom = 14.5;   // Fine adjustment
    if (paddedRange > 0.095) zoom = 14;     // Medium-close grouping
    if (paddedRange > 0.125) zoom = 13.5;   // Fine adjustment
    if (paddedRange > 0.165) zoom = 13;     // Medium grouping
    if (paddedRange > 0.220) zoom = 12.5;   // Fine adjustment
    if (paddedRange > 0.290) zoom = 12;     // Medium-wide grouping
    if (paddedRange > 0.380) zoom = 11.5;   // Fine adjustment
    if (paddedRange > 0.500) zoom = 11;     // Wide grouping
    if (paddedRange > 0.650) zoom = 10.5;   // Fine adjustment
    if (paddedRange > 0.850) zoom = 10;     // Very wide grouping
    if (paddedRange > 1.100) zoom = 9.5;    // Fine adjustment
    if (paddedRange > 1.450) zoom = 9;      // Extra wide grouping
    if (paddedRange > 1.900) zoom = 8.5;    // Fine adjustment
    if (paddedRange > 2.500) zoom = 8;      // Continental grouping
    
    console.log(`📍 Dynamic map view: center=[${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}], zoom=${zoom}, range=${paddedRange.toFixed(4)}`);
    return { center: [centerLat, centerLng], zoom };
  }, []);

  // Helper function to update map view - uses dynamic center calculation  
  const updateMapView = useCallback((locations: Location[]) => {
    if (userLocation) {
      // When user location exists, use dynamic center calculation
      const { center, zoom } = calculateDynamicMapView(locations, userLocation);
      setMapCenter(center);
      setMapZoom(zoom);
    } else if (locations.length > 0) {
      // No user location - fit all markers with geographic bounds
      console.log('📍 No user location, fitting all POI markers');
      const lats = locations.map(loc => loc.lat);
      const lngs = locations.map(loc => loc.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Calculate center
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      setMapCenter([centerLat, centerLng]);
      
      // Calculate zoom to fit all markers with padding
      const latRange = maxLat - minLat;
      const lngRange = maxLng - minLng;
      const maxRange = Math.max(latRange, lngRange);
      
      // Dynamic zoom based on geographic spread
      let zoom = 9; // default higher zoom
      if (maxRange < 0.1) zoom = 12;      // Very close
      else if (maxRange < 0.5) zoom = 10;  // Close
      else if (maxRange < 1.0) zoom = 9;   // Medium spread
      else if (maxRange < 2.0) zoom = 8;   // Wide spread
      else if (maxRange < 5.0) zoom = 7;   // Very wide spread
      else zoom = 6;                      // Extremely wide spread
      
      setMapZoom(zoom);
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