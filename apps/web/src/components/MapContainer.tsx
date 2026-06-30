/**
 * ========================================================================
 * MAP CONTAINER - INTERACTIVE LEAFLET MAP WITH POI VISUALIZATION
 * ========================================================================
 *
 * 📋 PURPOSE: Leaflet-based interactive map displaying POI markers with weather data
 * 🔗 CONNECTS TO: App.tsx (main container), asterIcon (branding), POI navigation system
 * 📊 DATA FLOW: POI locations → map markers → user interactions → navigation callbacks
 * ⚙️ STATE: map instance, markers, user location marker, popup management
 * 🎯 USER IMPACT: Visual discovery of outdoor recreation locations with weather context
 *
 * BUSINESS CONTEXT: Core visualization for Minnesota outdoor recreation discovery
 * - Interactive map enables spatial understanding of POI locations
 * - Weather-integrated popups provide activity planning context
 * - User location marker supports proximity-based recommendations
 * - Navigation system connects to POI discovery algorithm
 *
 * TECHNICAL IMPLEMENTATION: thin React wrapper that composes four Leaflet hooks —
 * the imperative map lifecycle lives in those hooks, keeping this component focused
 * on wiring props/refs and rendering the container:
 * - {@link useLeafletMap}: StrictMode-safe map init + recenter on prop change
 * - {@link usePoiMarkers}: incremental POI marker updates + auto-open current popup
 * - {@link useUserLocationMarker}: draggable user marker create + position sync
 * - {@link useMapPopupNavigation}: popup closer/farther/directions event delegation
 *
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - React StrictMode compatible with proper cleanup
 * - Incremental marker updates vs full rebuild for performance
 * - Event delegation vs individual handlers for popup buttons
 * - Smart centering to avoid unnecessary map movements
 *
 * @CLAUDE_CONTEXT: Primary map visualization for outdoor recreation POI discovery
 * @BUSINESS_RULE: P1 MUST render all POI markers within performance thresholds
 * @INTEGRATION_POINT: LocationManager for user positioning, POI navigation for data
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json for testable thresholds
 *
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * Location detection → POI data loading → map marker rendering → user interaction → navigation
 * USER JOURNEY: Map load → marker discovery → popup interaction → navigation to other POIs
 * VALUE CHAIN: Spatial context → weather information → activity decision → location navigation
 */

import React, { useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import { buildPoiPopupHtml } from '../utils/mapPopup';
import { showEndOfResultsNotification as notifyEndOfResults } from '../utils/mapNotifications';
// Import POI popup styles
import '../styles/poi-popup.css';

import type { POILocation } from './mapTypes';
import { useLeafletMap } from '../hooks/useLeafletMap';
import { usePoiMarkers } from '../hooks/usePoiMarkers';
import { useUserLocationMarker } from '../hooks/useUserLocationMarker';
import { useMapPopupNavigation } from '../hooks/useMapPopupNavigation';

/** Props for {@link MapContainer}. */
interface MapContainerProps {
  /** Map center `[lat, lng]`; updating it recenters the view (smart-centered to avoid jitter). */
  center: [number, number];
  /** Leaflet zoom level. */
  zoom: number;
  /** POIs to render as weather-aware markers. */
  locations: POILocation[];
  /** The draggable user-location marker position, or null when unknown. */
  userLocation: [number, number] | null;
  /** Fired when the user drags their location marker to a new `[lat, lng]`. */
  onLocationChange: (newPosition: [number, number]) => void;
  /** The POI currently highlighted by the navigation flow, or null. */
  currentPOI: POILocation | null;
  /** True when the cursor is at the nearest POI (disables "closer"). */
  isAtClosest: boolean;
  /** True when the cursor is at the farthest loaded POI (disables "farther"). */
  isAtFarthest: boolean;
  /** True when more POIs can be revealed by expanding the search radius. */
  canExpand: boolean;
  /** Popup action: step to the next-closer POI; returns it, or null at the boundary. */
  onNavigateCloser: () => POILocation | null;
  /** Popup action: step to the next-farther POI, or expand the radius; may return a status string. */
  onNavigateFarther: () => POILocation | string | null;
}

/**
 * Interactive Leaflet map that renders POI markers with weather-rich popups plus
 * a draggable user-location marker. The imperative Leaflet work is composed from
 * four focused hooks (init, markers, user marker, popup navigation); this
 * component owns the shared refs + popup builders and renders the container.
 * Popup "closer/farther" buttons drive the distance-based POI navigation in the parent.
 *
 * @example
 * ```tsx
 * <MapContainer
 *   center={mapCenter}
 *   zoom={mapZoom}
 *   locations={visiblePOIs}
 *   userLocation={userLocation}
 *   onLocationChange={handleUserLocationChange}
 *   currentPOI={currentPOI}
 *   isAtClosest={isAtClosest}
 *   isAtFarthest={isAtFarthest}
 *   canExpand={canExpand}
 *   onNavigateCloser={navigateCloser}
 *   onNavigateFarther={navigateFarther}
 * />
 * ```
 *
 * 🔗 INTEGRATION: the main map component consumed by `App.tsx`.
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom,
  locations,
  userLocation,
  onLocationChange,
  currentPOI,
  isAtClosest,
  isAtFarthest,
  canExpand,
  onNavigateCloser,
  onNavigateFarther
}) => {
  // Map references for performance optimization
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [, setCurrentMarkerIndex] = useState(0);

  // Popup builders — the HTML/URL logic lives in ../utils/mapPopup (pure + tested);
  // these thin wrappers supply the current navigation state, and are passed to the
  // marker + navigation hooks.
  const createPopupContent = useCallback((location: POILocation): string => {
    return buildPoiPopupHtml(
      location,
      {
        hasNavigation: locations.length > 1 || canExpand,
        isAtClosest,
        isAtFarthest,
        canExpand,
      },
      process.env.NODE_ENV === 'development'
    );
  }, [isAtClosest, isAtFarthest, canExpand, locations.length]);

  // Update an existing marker's popup with current navigation state
  const updatePopupContent = useCallback((markerIndex: number) => {
    if (markerIndex >= 0 && markerIndex < locations.length && markersRef.current[markerIndex]) {
      const location = locations[markerIndex];
      const updatedContent = createPopupContent(location);
      markersRef.current[markerIndex].setPopupContent(updatedContent);
    }
  }, [locations, createPopupContent]);

  // End-of-results notification — the imperative DOM toast lives in
  // ../utils/mapNotifications; this is a stable callback wrapper.
  const showEndOfResultsNotification = useCallback(() => {
    notifyEndOfResults();
  }, []);

  // Compose the Leaflet lifecycle from focused hooks (see each hook's docs).
  useLeafletMap(containerRef, mapRef, userMarkerRef, center, zoom);
  usePoiMarkers({
    mapRef, markersRef, locations, currentPOI,
    createPopupContent, updatePopupContent, setCurrentMarkerIndex,
  });
  useUserLocationMarker(mapRef, userMarkerRef, userLocation, onLocationChange);
  useMapPopupNavigation({
    mapRef, markersRef, locations,
    onNavigateCloser, onNavigateFarther,
    updatePopupContent, showEndOfResultsNotification,
  });

  return (
    <div
      ref={containerRef}
      data-testid="map-container"
      aria-label="Interactive map showing outdoor recreation locations"
      role="application"
      style={{ height: '100%', width: '100%' }}
    />
  );
};
