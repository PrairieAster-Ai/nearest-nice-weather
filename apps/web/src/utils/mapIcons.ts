// Map Icon Utilities
// Shared icon definitions for consistent map branding

import L from 'leaflet';

// 🔗 INTEGRATION: Aster icon for consistent branding across map components
export const asterIcon = new L.Icon({
  iconUrl: '/aster-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});
