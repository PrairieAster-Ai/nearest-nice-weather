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
 * Serialize a value for safe embedding inside an inline <script> block.
 *
 * JSON.stringify escapes quotes/backslashes; the unicode replacements prevent
 * a `</script>` (or `<!--`) sequence in the data from breaking out of the
 * script element — which would otherwise allow injecting live HTML (e.g.
 * `</script><img src=x onerror=...>`) even when the surrounding markup is set
 * via innerHTML.  /  are escaped because they are valid JSON but
 * illegal raw in a JS string literal.
 */
function toScriptJson(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Escape a value for an HTML attribute or text context. */
function escapeHtmlAttr(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
      Context: ${escapeHtmlAttr(contextualKeywords)}<br/>
      <em>Real ads will appear here in production</em>
    </div>`;
  }

  // All dynamic data is embedded via toScriptJson so an attacker-controlled POI
  // name cannot break out of the inline <script>.
  const safeId = escapeHtmlAttr(location.id);
  const contextual = {
    targeting: contextualKeywords,
    location: `${location.name}, Minnesota`,
    coordinates: [location.latitude, location.longitude],
  };
  return `<div id="medianet-popup-ad-${safeId}" style="margin: 8px 0;">
    <script>
      (function() {
        var contextual = ${toScriptJson(contextual)};
        if (window.mnet) {
          window.mnet.loadAd(${toScriptJson(`popup-ad-${location.id}`)}, contextual);
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
      <div style="font-size: 11px; color: #666;">Keywords: ${escapeHtmlAttr(activityKeywords)}</div>
      <div style="font-size: 11px; color: #666;">Weather: ${escapeHtmlAttr(location.temperature)}°F, ${escapeHtmlAttr(location.precipitation)}% chance rain</div>
      <div style="font-style: italic; color: #999; margin-top: 6px;">Production ads will be geo-targeted and weather-aware</div>
    </div>`;
  }

  // Embed the config via toScriptJson to neutralize injection through the POI
  // name / keywords inside the inline <script>.
  const safeId = escapeHtmlAttr(location.id);
  const adConfig = {
    containerId: `contextual-poi-ad-${location.id}`,
    keywords: activityKeywords,
    location: {
      name: location.name,
      coordinates: [location.latitude, location.longitude],
      weather: {
        temperature: location.temperature ?? null,
        precipitation: location.precipitation ?? null,
      },
    },
  };
  return `<div id="contextual-poi-ad-${safeId}" class="poi-contextual-ad" style="margin: 10px 0;">
    <script>
      (function() {
        if (window.contextualAds) {
          window.contextualAds.display(${toScriptJson(adConfig)});
        }
      })();
    </script>
    <div style="min-height: 120px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
      <span style="color: #999;">Loading contextual ad...</span>
    </div>
  </div>`;
};
