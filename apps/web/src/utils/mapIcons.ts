// Map Icon Utilities
// Shared icon definitions for consistent map branding

import L from 'leaflet';

// 🔗 INTEGRATION: Aster icon for consistent branding across map components
/**
 * Shared Leaflet marker icon (the PrairieAster "aster" SVG) used for POI markers
 * so branding stays consistent across every map component.
 *
 * @remarks Anchored at its center (`iconAnchor` = half of `iconSize`) so the marker
 * sits exactly on the POI's coordinates; the popup opens just above it.
 * @example
 * ```tsx
 * import { asterIcon } from '../utils/mapIcons';
 * <Marker position={[lat, lng]} icon={asterIcon} />
 * ```
 */
export const asterIcon = new L.Icon({
  iconUrl: '/aster-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});
