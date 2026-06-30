/**
 * useUserLocationMarker — manages the draggable "you are here" marker: creates it
 * once (with the 😎 icon, drag-to-update handler, and instructional popup), keeps
 * its position in sync with the `userLocation` prop, and removes it when the
 * location becomes invalid. Extracted from MapContainer; refs passed in unchanged.
 */
import { useEffect, type MutableRefObject } from 'react';
import L from 'leaflet';

/**
 * Wire up the user-location marker.
 * @param mapRef - the Leaflet map instance ref
 * @param userMarkerRef - holds the user marker (shared with the map-teardown hook)
 * @param userLocation - current user position `[lat, lng]`, or null when unknown
 * @param onLocationChange - fired when the user drags the marker to a new position
 */
export function useUserLocationMarker(
  mapRef: MutableRefObject<L.Map | null>,
  userMarkerRef: MutableRefObject<L.Marker | null>,
  userLocation: [number, number] | null,
  onLocationChange: (newPosition: [number, number]) => void,
): void {
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
  }, [onLocationChange, userLocation, mapRef, userMarkerRef]); // Dependencies: callback and user location

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
  }, [userLocation, mapRef, userMarkerRef]);
}
