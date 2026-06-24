/**
 * ========================================================================
 * MAP POPUP CONTENT BUILDERS
 * ========================================================================
 *
 * Pure helpers for the Leaflet POI popups, extracted from MapContainer.tsx
 * so the (XSS-sanitized) HTML generation and platform mapping-URL logic are
 * unit-testable and the component stays focused on imperative map wiring.
 *
 * All user-supplied fields are escaped via escapeHtml; the directions URL is
 * passed through sanitizeUrl. These functions are deterministic given their
 * inputs (generateMappingUrl additionally reads navigator.userAgent).
 *
 * @CLAUDE_CONTEXT: Extracted from MapContainer.tsx for testability + size.
 * ========================================================================
 */

import { escapeHtml, sanitizeUrl } from './sanitize'
import { generateMediaNetPopupAdHTML } from './adUtils'

/** Subset of the POI shape the popup needs. */
export interface PopupLocation {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number
  windSpeed: string
  park_type?: string
  weather_station_name?: string
  weather_distance_miles?: string
}

/** Navigation-control state that drives the popup's Closer/Farther buttons. */
export interface PopupNavState {
  /** Whether to render the navigation controls at all (multiple POIs or expandable). */
  hasNavigation: boolean
  isAtClosest: boolean
  isAtFarthest: boolean
  canExpand: boolean
}

/**
 * Build a platform-appropriate mapping/directions URL for a location.
 * iOS → Apple Maps, Android/other-mobile → geo: URL, desktop → Google Maps web.
 */
export function generateMappingUrl(location: Pick<PopupLocation, 'lat' | 'lng' | 'name'>): string {
  const coords = `${location.lat},${location.lng}`
  const locationName = encodeURIComponent(location.name)

  const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)
  const isMobile = /Mobi|Android/i.test(userAgent)

  if (isIOS) {
    return `http://maps.apple.com/?daddr=${coords}&dirflg=d`
  } else if (isAndroid) {
    return `geo:${coords}?q=${coords}(${locationName})`
  } else if (isMobile) {
    return `geo:${coords}?q=${coords}(${locationName})`
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`
  }
}

/** Map an OpenWeather-style condition string to a display emoji. */
function conditionEmoji(condition: string): string {
  switch (condition) {
    case 'Sunny':
      return '☀️'
    case 'Partly Cloudy':
      return '⛅'
    case 'Cloudy':
      return '☁️'
    case 'Overcast':
      return '🌫️'
    case 'Clear':
      return '✨'
    default:
      return condition
  }
}

/**
 * Build the sanitized HTML string for a POI marker popup.
 *
 * @param location POI to render
 * @param nav navigation-control state
 * @param isDev passed to the contextual-ad generator (test-mode placeholder)
 */
export function buildPoiPopupHtml(
  location: PopupLocation,
  nav: PopupNavState,
  isDev: boolean
): string {
  // Sanitize all user content
  const safeName = escapeHtml(location.name)
  const safeParkType = location.park_type ? escapeHtml(location.park_type) : ''
  const safeDescription = escapeHtml(location.description)
  const safeCondition = escapeHtml(location.condition)
  const safeWindSpeed = escapeHtml(location.windSpeed)
  const safeWeatherStation = location.weather_station_name ? escapeHtml(location.weather_station_name) : ''
  const safeWeatherDistance = location.weather_distance_miles ? escapeHtml(location.weather_distance_miles) : ''

  const mapsUrl = sanitizeUrl(generateMappingUrl(location))

  // Contextual ad content (adUtils uses latitude/longitude field names)
  const adUtilsLocation = {
    id: location.id,
    name: location.name,
    temperature: location.temperature,
    precipitation: location.precipitation,
    latitude: location.lat,
    longitude: location.lng,
    park_type: location.park_type,
  }
  const contextualAdHTML = generateMediaNetPopupAdHTML(adUtilsLocation, isDev)

  return `
      <div class="poi-popup-container">
        <div class="mb-2">
          <!-- Title row with directions button -->
          <div class="poi-title-row">
            <a href="${mapsUrl}"
               target="_blank" rel="noopener noreferrer"
               title="Get directions"
               class="poi-directions-button"
               data-analytics-poi="${safeName}"
               data-analytics-action="directions-clicked">
              🧭
            </a>
            <h3 class="poi-title">${safeName}</h3>
          </div>

          ${safeParkType ? `<div class="poi-park-type">${safeParkType}</div>` : ''}

          <!-- Full width description -->
          <p class="poi-description">${safeDescription}</p>

          <!-- Full width contextual Ad Container -->
          ${contextualAdHTML}
        </div>

        <!-- Weather Information -->
        <div class="bg-gray-100 rounded p-2 mb-2 border">
          <div class="flex justify-between items-center text-xs text-black font-medium" style="gap: 5px">
            <span class="font-bold text-lg text-black">${escapeHtml(location.temperature)}°F</span>
            <span class="text-lg">
              ${conditionEmoji(safeCondition)}
            </span>
            <span>💧 ${escapeHtml(location.precipitation)}%</span>
            <span>💨 ${safeWindSpeed}</span>
          </div>
          ${safeWeatherStation ? `<div class="text-xs text-gray-600 mt-1">Weather from ${safeWeatherStation}${safeWeatherDistance ? ` (${safeWeatherDistance} mi)` : ''}</div>` : ''}
        </div>

        <!-- Navigation Controls -->
        ${nav.hasNavigation ? `
        <div class="poi-nav-container" data-popup-nav="true">
          <button data-nav-action="closer"
                  ${nav.isAtClosest ? 'disabled' : ''}
                  class="poi-nav-button ${nav.isAtClosest ? '' : ''}">
            ← Closer
          </button>
          <button data-nav-action="farther"
                  class="poi-nav-button ${nav.isAtFarthest && !nav.canExpand ? 'farther-disabled' : ''}">
            ${nav.canExpand && nav.isAtFarthest ? '🔍 Expand +30mi' : nav.isAtFarthest && !nav.canExpand ? 'No More →' : 'Farther →'}
          </button>
        </div>
        ` : ''}
      </div>
    `
}
