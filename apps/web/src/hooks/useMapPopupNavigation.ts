/**
 * useMapPopupNavigation — document-level click delegation for the POI popup's
 * navigation buttons (closer / farther) and the "directions" analytics link.
 * Drives the parent's distance-based navigation, opens + smart-centers the target
 * marker's popup, and shows the end-of-results toast at the boundary. Extracted
 * from MapContainer; refs + callbacks passed in unchanged.
 */
import { useEffect, type MutableRefObject } from 'react';
import L from 'leaflet';
import { trackFeatureUsage } from '../utils/analytics';
import type { POILocation } from '../components/mapTypes';

/** Inputs for {@link useMapPopupNavigation}. */
export interface UseMapPopupNavigationArgs {
  /** The Leaflet map instance ref. */
  mapRef: MutableRefObject<L.Map | null>;
  /** The rendered POI markers, index-aligned with `locations`. */
  markersRef: MutableRefObject<L.Marker[]>;
  /** The current POIs (to map a navigation result back to a marker index). */
  locations: POILocation[];
  /** Step to the next-closer POI; returns it, or null at the boundary. */
  onNavigateCloser: () => POILocation | null;
  /** Step to the next-farther POI, or expand the radius; may return a status string. */
  onNavigateFarther: () => POILocation | string | null;
  /** Refreshes an existing marker's popup HTML by index. */
  updatePopupContent: (markerIndex: number) => void;
  /** Shows the "end of results" toast when navigation can't go farther. */
  showEndOfResultsNotification: () => void;
}

/** Attach the popup-button click delegation for the lifetime of the component. */
export function useMapPopupNavigation({
  mapRef,
  markersRef,
  locations,
  onNavigateCloser,
  onNavigateFarther,
  updatePopupContent,
  showEndOfResultsNotification,
}: UseMapPopupNavigationArgs): void {
  // Event delegation for popup navigation buttons and analytics tracking
  useEffect(() => {
    // Open the navigated POI's popup and smart-center on it (shared by closer +
    // farther). Smart centering only pans if the marker is outside the viewport.
    const focusPoiMarker = (poi: POILocation) => {
      const index = locations.findIndex(loc => loc.id === poi.id);
      const marker = index >= 0 ? markersRef.current[index] : undefined;
      if (!marker) return;

      updatePopupContent(index);
      marker.openPopup();

      const markerLatLng = L.latLng(poi.lat, poi.lng);
      if (mapRef.current && !mapRef.current.getBounds().contains(markerLatLng)) {
        mapRef.current.panTo(markerLatLng);
      }
    };

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
          focusPoiMarker(result);
        }
      } else if (action === 'farther') {
        const result = onNavigateFarther();
        if (result === 'NO_MORE_RESULTS') {
          console.log('No more results available');
          showEndOfResultsNotification();
        } else if (result) {
          console.log('Navigate farther result:', result);
          focusPoiMarker(result as POILocation);
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
}
