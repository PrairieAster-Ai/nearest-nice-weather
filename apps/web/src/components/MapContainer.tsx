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
 * TECHNICAL IMPLEMENTATION: React wrapper around Leaflet with performance optimization
 * - Incremental marker updates prevent full rebuilds on data changes
 * - Drag-enabled user location marker with persistence integration
 * - Event delegation for popup navigation prevents memory leaks
 * - Smart viewport management for optimal user experience
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
 *
 * 📚 DOCUMENTATION LINKS:
 * - Business Plan: /documentation/business-plan/master-plan.md
 * - Architecture: /documentation/architecture-overview.md
 * - Performance Config: /src/config/PERFORMANCE-REQUIREMENTS.json
 *
 * 🔗 COMPONENT INTEGRATIONS:
 * - App.tsx: Main consumer providing POI data and navigation callbacks
 * - LocationManager.tsx: Provides user location for centering and proximity
 * - POI Navigation: Handles distance-based POI discovery and filtering
 *
 * LAST UPDATED: 2025-08-08
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { trackPOIInteraction, trackFeatureUsage } from '../utils/analytics';
import { buildPoiPopupHtml } from '../utils/mapPopup';
// Import POI popup styles
import '../styles/poi-popup.css';

// 🔗 INTEGRATION: Import asterIcon for consistent branding
import { asterIcon } from '../utils/mapIcons';

// 🔗 INTEGRATION: TypeScript interfaces for POI data structure
interface POILocation {
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
  park_type?: string;
  weather_station_name?: string;
  weather_distance_miles?: string;
}

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

// 🔗 INTEGRATION: Main MapContainer component for App.tsx consumption
/**
 * Interactive Leaflet map that renders POI markers with weather-rich popups plus
 * a draggable user-location marker. Wraps Leaflet imperatively with incremental
 * marker updates (no full rebuild on data change) and popup event delegation, so
 * it stays performant and StrictMode-safe. Popup "closer/farther" buttons drive
 * the distance-based POI navigation in the parent.
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

  // Popup builders — declared before the effects that use them (the marker
  // effects below) so the React Compiler can preserve their memoization.
  // The HTML/URL logic itself lives in ../utils/mapPopup (pure + tested); this
  // is a thin wrapper supplying the current navigation state.
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

  // End-of-results notification (self-contained; declared before the navigation
  // effect that triggers it).
  const showEndOfResultsNotification = useCallback(() => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      text-align: center;
      max-width: 300px;
    `;

    notification.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #333;">End of Results</h3>
      <p style="margin: 0 0 15px 0; color: #666;">That's all the results we have for this area!</p>
      <button style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">OK</button>
    `;

    // Add click handler to OK button
    const okButton = notification.querySelector('button');
    if (okButton) {
      okButton.addEventListener('click', () => {
        notification.remove();
      });
    }

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }, []);

  // Map initialization with React StrictMode compatibility
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Validate center and zoom before creating map
    if (!center || isNaN(center[0]) || isNaN(center[1]) || !zoom || isNaN(zoom)) {
      console.warn('Invalid center or zoom provided to MapContainer:', { center, zoom });
      return;
    }

    // Create new map instance
    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: false
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Expose map instance for testing purposes
    if (typeof window !== 'undefined') {
      (window as any).leafletMapInstance = map;
    }

    // Cleanup function
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - map initialization should only run once on component mount

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && center && !isNaN(center[0]) && !isNaN(center[1]) && zoom && !isNaN(zoom)) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Incremental marker updates for performance optimization
  useEffect(() => {
    if (!mapRef.current) return;

    console.log(`MapContainer received ${locations.length} locations`);
    console.log(`Location IDs: [${locations.slice(0, 5).map(l => l.id).join(', ')}...]`);

    // Optimized incremental marker updates (instead of full rebuild)
    const existingMarkerCount = markersRef.current.length;
    const newLocationCount = locations.length;

    // If we have fewer locations now, remove excess markers
    if (newLocationCount < existingMarkerCount) {
      for (let i = newLocationCount; i < existingMarkerCount; i++) {
        if (markersRef.current[i]) {
          mapRef.current.removeLayer(markersRef.current[i]);
        }
      }
      // Trim the array
      markersRef.current = markersRef.current.slice(0, newLocationCount);
    }

    // If we have more locations now, expand the array
    if (newLocationCount > existingMarkerCount) {
      markersRef.current = [...markersRef.current, ...new Array(newLocationCount - existingMarkerCount)];
    }

    console.log(`🔍 MapContainer updating markers: ${existingMarkerCount} -> ${newLocationCount} locations`);

    // Update existing markers and add new ones (incremental approach)
    locations.forEach((location, index) => {
      const existingMarker = markersRef.current[index];

      // Check if we need to create a new marker or update existing
      if (!existingMarker ||
          existingMarker.getLatLng().lat !== location.lat ||
          existingMarker.getLatLng().lng !== location.lng) {

        // Remove old marker if it exists
        if (existingMarker && mapRef.current) {
          mapRef.current.removeLayer(existingMarker);
        }

        // Create new marker with branded icon
        const marker = L.marker([location.lat, location.lng], { icon: asterIcon });

        // Track which marker was clicked to sync currentMarkerIndex
        marker.on('popupopen', () => {
          setCurrentMarkerIndex(index);

          // Track POI interaction for analytics
          trackPOIInteraction('popup-opened', {
            name: location.name,
            temperature: location.temperature,
            condition: location.condition,
            distance: location.distance,
            park_type: location.park_type
          });
        });

        // Create sanitized popup content for marker
        const popupContent = createPopupContent(location);

        marker.bindPopup(popupContent, { maxWidth: 280, className: "custom-popup" });
        marker.addTo(mapRef.current!);

        // Store marker reference for direct popup access
        markersRef.current[index] = marker;
      } else {
        // Marker exists and position hasn't changed - update popup if needed
        const existingPopup = existingMarker.getPopup();
        if (existingPopup) {
          updatePopupContent(index);
        }
      }
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]); // canExpand, isAtClosest, isAtFarthest intentionally excluded

  // User location marker creation and management
  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) return; // Already created
    if (!userLocation || userLocation[0] === undefined || userLocation[1] === undefined ||
        isNaN(userLocation[0]) || isNaN(userLocation[1])) return;

    console.log('🔧 Creating user location marker with drag handler');

    // Create user location icon with branded styling
    const coolGuyIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="15" fill="white" stroke="#ddd" stroke-width="1"/>
          <text x="20" y="28" text-anchor="middle" font-size="24" font-family="Arial, sans-serif">😎</text>
        </svg>
      `),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });

    const userMarker = L.marker(userLocation, {
      draggable: true,
      icon: coolGuyIcon
    }) as any;
    userMarker.options.isUserMarker = true;

    // Attach drag handlers for location updates
    userMarker.on('dragend', (e: L.LeafletEvent) => {
      console.log('🎯 User marker dragend event triggered!');
      const marker = (e as any).target;
      const position = marker.getLatLng();
      console.log('📍 New position from drag:', [position.lat, position.lng]);
      if (position && !isNaN(position.lat) && !isNaN(position.lng)) {
        onLocationChange([position.lat, position.lng]);
      } else {
        console.warn('❌ Invalid position from drag:', position);
      }
    });

    // Add instructional popup
    const popupContent = `
      <div class="text-center p-2">
        <div class="text-sm font-bold text-gray-800 mb-1">Our best guess at your location</div>
        <div class="text-xs text-gray-600">Drag and drop for more accuracy</div>
      </div>
    `;

    userMarker.bindPopup(popupContent, { className: "custom-popup" });
    userMarker.addTo(mapRef.current!);

    // Store reference to the marker
    userMarkerRef.current = userMarker;
  }, [onLocationChange, userLocation]); // Dependencies: callback and user location

  // Update user marker position without recreating it
  useEffect(() => {
    if (!userMarkerRef.current) return;
    if (!userLocation || userLocation[0] === undefined || userLocation[1] === undefined ||
        isNaN(userLocation[0]) || isNaN(userLocation[1])) {
      // Location became invalid - remove marker
      if (mapRef.current && userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    // Update position of existing marker (preserves drag handlers)
    console.log('📍 Updating user marker position:', userLocation);
    userMarkerRef.current.setLatLng(userLocation);
  }, [userLocation]);

  // Event delegation for popup navigation buttons and analytics tracking
  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const target = event.target as HTMLElement;

      // Handle directions button analytics
      if (target.matches('[data-analytics-action="directions-clicked"]')) {
        const poiName = target.getAttribute('data-analytics-poi');
        if (poiName) {
          trackFeatureUsage('directions', { poi_name: poiName });
        }
        return; // Let the link work normally
      }

      // Handle navigation buttons
      if (!target.matches('[data-nav-action]')) return;

      event.preventDefault();
      event.stopPropagation();

      const action = target.getAttribute('data-nav-action');

      if (action === 'closer') {
        const result = onNavigateCloser();
        if (result) {
          console.log('Navigate closer result:', result);
          const newPOIIndex = locations.findIndex(loc => loc.id === result.id);
          if (newPOIIndex >= 0 && markersRef.current[newPOIIndex]) {
            updatePopupContent(newPOIIndex);
            markersRef.current[newPOIIndex].openPopup();

            // Smart centering: only pan if marker is outside viewport
            const markerLatLng = L.latLng(result.lat, result.lng);
            if (mapRef.current && !mapRef.current.getBounds().contains(markerLatLng)) {
              mapRef.current.panTo(markerLatLng);
            }
          }
        }
      } else if (action === 'farther') {
        const result = onNavigateFarther();
        if (result && result !== 'NO_MORE_RESULTS') {
          console.log('Navigate farther result:', result);
          const newPOIIndex = locations.findIndex(loc => (loc as POILocation).id === (result as POILocation).id);
          if (newPOIIndex >= 0 && markersRef.current[newPOIIndex]) {
            updatePopupContent(newPOIIndex);
            markersRef.current[newPOIIndex].openPopup();

            // Smart centering: only pan if marker is outside viewport
            const markerLatLng = L.latLng((result as POILocation).lat, (result as POILocation).lng);
            if (mapRef.current && !mapRef.current.getBounds().contains(markerLatLng)) {
              mapRef.current.panTo(markerLatLng);
            }
          }
        } else if (result === 'NO_MORE_RESULTS') {
          console.log('No more results available');
          showEndOfResultsNotification();
        }
      }
    };

    // Add event listener to document for event delegation
    document.addEventListener('click', handleNavigation);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleNavigation);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNavigateCloser, onNavigateFarther, locations]);


  // Auto-open popup for currentPOI
  useEffect(() => {
    if (currentPOI && markersRef.current.length > 0) {
      const currentPOIIndex = locations.findIndex(loc => loc.id === currentPOI.id);

      const openPopupAndCenter = () => {
        if (currentPOIIndex >= 0 && markersRef.current[currentPOIIndex]) {
          console.log(`🎯 Auto-opening popup for currentPOI: ${currentPOI.name} (index ${currentPOIIndex})`);

          // Smart centering: check if marker is outside viewport
          const markerLatLng = L.latLng(currentPOI.lat, currentPOI.lng);
          if (mapRef.current && !mapRef.current.getBounds().contains(markerLatLng)) {
            console.log(`📍 Centering map on ${currentPOI.name}`);
            mapRef.current.panTo(markerLatLng);

            // Wait for pan animation before opening popup
            setTimeout(() => {
              updatePopupContent(currentPOIIndex);
              markersRef.current[currentPOIIndex].openPopup();
            }, 300);
          } else {
            console.log(`📍 ${currentPOI.name} already in viewport`);
            updatePopupContent(currentPOIIndex);
            markersRef.current[currentPOIIndex].openPopup();
          }
        } else if (currentPOIIndex >= 0) {
          // Marker not ready yet, retry after brief delay
          console.log(`⏳ Marker ${currentPOIIndex} not ready, retrying...`);
          setTimeout(openPopupAndCenter, 100);
        }
      };

      openPopupAndCenter();
    }
  }, [currentPOI, locations, updatePopupContent]);

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
