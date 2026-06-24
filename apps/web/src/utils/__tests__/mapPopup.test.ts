/**
 * Tests for the extracted map-popup builders (pure, from MapContainer).
 * Covers HTML sanitization, conditional sections, navigation-control states,
 * and platform-specific mapping-URL generation.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { buildPoiPopupHtml, generateMappingUrl, type PopupLocation, type PopupNavState } from '../mapPopup'

const baseLoc: PopupLocation = {
  id: '1',
  name: 'Theodore Wirth Park',
  lat: 44.98,
  lng: -93.31,
  temperature: 72,
  condition: 'Sunny',
  description: 'A large urban park.',
  precipitation: 10,
  windSpeed: '5 mph',
}

const noNav: PopupNavState = {
  hasNavigation: false,
  isAtClosest: false,
  isAtFarthest: false,
  canExpand: false,
}

describe('buildPoiPopupHtml', () => {
  it('renders the POI name, temperature, precipitation, and wind', () => {
    const html = buildPoiPopupHtml(baseLoc, noNav, false)
    expect(html).toContain('Theodore Wirth Park')
    expect(html).toContain('72°F')
    expect(html).toContain('10%')
    expect(html).toContain('5 mph')
  })

  it('maps known conditions to emoji', () => {
    expect(buildPoiPopupHtml({ ...baseLoc, condition: 'Sunny' }, noNav, false)).toContain('☀️')
    expect(buildPoiPopupHtml({ ...baseLoc, condition: 'Partly Cloudy' }, noNav, false)).toContain('⛅')
    expect(buildPoiPopupHtml({ ...baseLoc, condition: 'Clear' }, noNav, false)).toContain('✨')
  })

  it('falls back to the raw condition text for unknown conditions', () => {
    const html = buildPoiPopupHtml({ ...baseLoc, condition: 'Drizzle' }, noNav, false)
    expect(html).toContain('Drizzle')
  })

  it('escapes HTML in the fields it renders (title + description)', () => {
    const html = buildPoiPopupHtml(
      { ...baseLoc, name: '<img src=x onerror=alert(1)>', description: '<b>bold</b>' },
      noNav,
      false
    )
    // The popup title and description must be HTML-escaped.
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;') // title escaped
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;') // description escaped
    // The poi-title block specifically must not carry a raw tag.
    const titleBlock = html.slice(html.indexOf('poi-title">'), html.indexOf('poi-title">') + 60)
    expect(titleBlock).not.toContain('<img')
    // NOTE: the embedded contextual-ad HTML (generateMediaNetPopupAdHTML) is a
    // separate concern and currently interpolates the RAW name into an inline
    // <script> — a pre-existing injection vector tracked outside this module.
  })

  it('omits the park-type block when park_type is absent', () => {
    const html = buildPoiPopupHtml(baseLoc, noNav, false)
    expect(html).not.toContain('poi-park-type')
  })

  it('includes the park-type block when present', () => {
    const html = buildPoiPopupHtml({ ...baseLoc, park_type: 'State Park' }, noNav, false)
    expect(html).toContain('poi-park-type')
    expect(html).toContain('State Park')
  })

  it('shows weather-station attribution only when provided', () => {
    expect(buildPoiPopupHtml(baseLoc, noNav, false)).not.toContain('Weather from')
    const withStation = buildPoiPopupHtml(
      { ...baseLoc, weather_station_name: 'KMSP', weather_distance_miles: '3.2' },
      noNav,
      false
    )
    expect(withStation).toContain('Weather from KMSP')
    expect(withStation).toContain('(3.2 mi)')
  })

  describe('navigation controls', () => {
    it('omits nav controls when hasNavigation is false', () => {
      expect(buildPoiPopupHtml(baseLoc, noNav, false)).not.toContain('data-popup-nav')
    })

    it('renders Closer/Farther when hasNavigation is true', () => {
      const html = buildPoiPopupHtml(baseLoc, { ...noNav, hasNavigation: true }, false)
      expect(html).toContain('data-popup-nav="true"')
      expect(html).toContain('data-nav-action="closer"')
      expect(html).toContain('data-nav-action="farther"')
      expect(html).toContain('Farther →')
    })

    it('disables Closer at the closest POI', () => {
      const html = buildPoiPopupHtml(baseLoc, { ...noNav, hasNavigation: true, isAtClosest: true }, false)
      expect(html).toMatch(/data-nav-action="closer"\s+disabled/)
    })

    it('shows the expand affordance at the farthest POI when expandable', () => {
      const html = buildPoiPopupHtml(
        baseLoc,
        { hasNavigation: true, isAtClosest: false, isAtFarthest: true, canExpand: true },
        false
      )
      expect(html).toContain('🔍 Expand +30mi')
    })

    it('shows "No More" at the farthest POI when not expandable', () => {
      const html = buildPoiPopupHtml(
        baseLoc,
        { hasNavigation: true, isAtClosest: false, isAtFarthest: true, canExpand: false },
        false
      )
      expect(html).toContain('No More →')
      expect(html).toContain('farther-disabled')
    })
  })
})

describe('generateMappingUrl', () => {
  const origUA = Object.getOwnPropertyDescriptor(window.navigator, 'userAgent')
  const setUA = (ua: string) =>
    Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })

  afterEach(() => {
    if (origUA) Object.defineProperty(window.navigator, 'userAgent', origUA)
  })

  const loc = { lat: 44.98, lng: -93.31, name: 'Wirth Park' }

  it('uses Apple Maps on iOS', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    expect(generateMappingUrl(loc)).toBe('http://maps.apple.com/?daddr=44.98,-93.31&dirflg=d')
  })

  it('uses a geo: URL on Android', () => {
    setUA('Mozilla/5.0 (Linux; Android 14)')
    expect(generateMappingUrl(loc)).toBe('geo:44.98,-93.31?q=44.98,-93.31(Wirth%20Park)')
  })

  it('uses Google Maps web on desktop', () => {
    setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    expect(generateMappingUrl(loc)).toBe('https://www.google.com/maps/dir/?api=1&destination=44.98,-93.31')
  })

  it('url-encodes the location name for mobile geo URLs', () => {
    setUA('Mozilla/5.0 (Linux; Android 14)')
    const url = generateMappingUrl({ ...loc, name: 'Lake Harriet & Bandshell' })
    expect(url).toContain('Lake%20Harriet%20%26%20Bandshell')
  })
})
