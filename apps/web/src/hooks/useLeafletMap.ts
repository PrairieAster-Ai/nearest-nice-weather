/**
 * useLeafletMap — owns the Leaflet map instance lifecycle for MapContainer:
 * StrictMode-safe creation (with the OSM tile layer) on mount, recenter/zoom on
 * prop change, and teardown on unmount. Extracted from MapContainer to keep the
 * component thin; the map/userMarker refs are passed in so the wiring is unchanged.
 */
import { useEffect, type RefObject, type MutableRefObject } from 'react';
import L from 'leaflet';

/**
 * Wire up the Leaflet map instance.
 * @param containerRef - the map's container `<div>` ref
 * @param mapRef - holds the created `L.Map` (shared with the marker/nav hooks)
 * @param userMarkerRef - cleared on map teardown so a remount recreates it
 * @param center - map center `[lat, lng]`
 * @param zoom - Leaflet zoom level
 */
export function useLeafletMap(
  containerRef: RefObject<HTMLDivElement>,
  mapRef: MutableRefObject<L.Map | null>,
  userMarkerRef: MutableRefObject<L.Marker | null>,
  center: [number, number],
  zoom: number,
): void {
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
  }, [center, zoom, mapRef]);
}
