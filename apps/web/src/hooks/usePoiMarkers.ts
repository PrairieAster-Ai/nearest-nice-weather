/**
 * usePoiMarkers — renders POI markers on the Leaflet map with incremental updates
 * (add/remove/replace only what changed, never a full rebuild) and auto-opens the
 * popup for the currently-navigated POI (smart-centering only when off-screen).
 * Extracted from MapContainer; refs + popup callbacks are passed in unchanged.
 */
import { useEffect, type MutableRefObject } from 'react';
import L from 'leaflet';
import { trackPOIInteraction } from '../utils/analytics';
import { asterIcon } from '../utils/mapIcons';
import type { POILocation } from '../components/mapTypes';

/** Inputs for {@link usePoiMarkers} — the map/markers refs, the POIs, and popup helpers. */
export interface UsePoiMarkersArgs {
  /** The Leaflet map instance ref. */
  mapRef: MutableRefObject<L.Map | null>;
  /** Holds the rendered POI markers, index-aligned with `locations`. */
  markersRef: MutableRefObject<L.Marker[]>;
  /** POIs to render. */
  locations: POILocation[];
  /** The POI to auto-open a popup for, or null. */
  currentPOI: POILocation | null;
  /** Builds popup HTML for a location (current navigation state baked in). */
  createPopupContent: (location: POILocation) => string;
  /** Refreshes an existing marker's popup HTML by index. */
  updatePopupContent: (markerIndex: number) => void;
  /** Records which marker index is currently open (for navigation sync). */
  setCurrentMarkerIndex: (index: number) => void;
}

/** Render + maintain the POI markers and the auto-opened current-POI popup. */
export function usePoiMarkers({
  mapRef,
  markersRef,
  locations,
  currentPOI,
  createPopupContent,
  updatePopupContent,
  setCurrentMarkerIndex,
}: UsePoiMarkersArgs): void {
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
  }, [currentPOI, locations, updatePopupContent, mapRef, markersRef]);
}
