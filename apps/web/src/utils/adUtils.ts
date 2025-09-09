// Ad Utilities
// Helper functions for generating contextual advertising content

export interface POILocation {
  id: string;
  name: string;
  temperature?: number;
  precipitation?: number;
  park_type?: string;
  latitude: number;
  longitude: number;
}

/**
 * Generate Media.net contextual ad HTML for map popup integration
 * Optimized for geographic constraint context and weather awareness
 */
export const generateMediaNetPopupAdHTML = (location: POILocation, testMode: boolean = false): string => {
  const contextualKeywords = [
    'outdoor recreation', 'minnesota parks',
    (location.temperature ?? 60) > 75 ? 'summer activities' : (location.temperature ?? 60) < 45 ? 'winter activities' : 'spring activities',
    (location.precipitation ?? 0) > 50 ? 'rain gear' : 'outdoor adventures',
    location.park_type?.toLowerCase().includes('trail') ? 'hiking gear' : 'park activities'
  ].join(', ');

  if (testMode) {
    return `<div style="background: #f0f8ff; padding: 8px; border-radius: 4px; font-size: 12px;">
      <strong>Media.net Test Ad</strong><br/>
      Context: ${contextualKeywords}<br/>
      <em>Real ads will appear here in production</em>
    </div>`;
  }

  return `<div id="medianet-popup-ad-${location.id}" style="margin: 8px 0;">
    <script>
      (function() {
        var contextual = {
          targeting: '${contextualKeywords}',
          location: '${location.name}, Minnesota',
          coordinates: [${location.latitude}, ${location.longitude}]
        };
        if (window.mnet) {
          window.mnet.loadAd('popup-ad-${location.id}', contextual);
        }
      })();
    </script>
    <div style="min-height: 90px; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
      <span style="color: #666;">Contextual Ad Loading...</span>
    </div>
  </div>`;
};

/**
 * Generate POI-specific contextual ad HTML
 * Enhanced for outdoor recreation context optimization
 */
export const generatePOIAdHTML = (location: POILocation, testMode: boolean = false): string => {
  const activityKeywords = [
    'minnesota outdoor recreation',
    location.park_type === 'State Park' ? 'camping gear' : 'hiking equipment',
    (location.temperature ?? 60) > 70 ? 'summer outdoor gear' : 'cold weather gear',
    (location.precipitation ?? 0) < 20 ? 'sunny day activities' : 'indoor alternatives',
    `${location.name} activities`
  ].join(', ');

  if (testMode) {
    return `<div style="background: linear-gradient(135deg, #e3f2fd, #fff3e0); padding: 12px; border-radius: 8px; margin: 10px 0;">
      <div style="font-weight: bold; color: #1976d2; margin-bottom: 4px;">🎯 Contextual Test Ad</div>
      <div style="font-size: 11px; color: #666;">Keywords: ${activityKeywords}</div>
      <div style="font-size: 11px; color: #666;">Weather: ${location.temperature}°F, ${location.precipitation}% chance rain</div>
      <div style="font-style: italic; color: #999; margin-top: 6px;">Production ads will be geo-targeted and weather-aware</div>
    </div>`;
  }

  return `<div id="contextual-poi-ad-${location.id}" class="poi-contextual-ad" style="margin: 10px 0;">
    <script>
      (function() {
        if (window.contextualAds) {
          window.contextualAds.display({
            containerId: 'contextual-poi-ad-${location.id}',
            keywords: '${activityKeywords}',
            location: {
              name: '${location.name}',
              coordinates: [${location.latitude}, ${location.longitude}],
              weather: {
                temperature: ${location.temperature || 'null'},
                precipitation: ${location.precipitation || 'null'}
              }
            }
          });
        }
      })();
    </script>
    <div style="min-height: 120px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
      <span style="color: #999;">Loading contextual ad...</span>
    </div>
  </div>`;
};
