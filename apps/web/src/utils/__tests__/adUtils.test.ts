/**
 * Tests for contextual-ad HTML generation, focused on the inline-<script>
 * injection fix: attacker-controlled POI fields must not be able to break out
 * of the script block or inject live HTML.
 */

import { describe, it, expect } from 'vitest'
import { generateMediaNetPopupAdHTML, generatePOIAdHTML, type POILocation } from '../adUtils'

const base: POILocation = {
  id: '386',
  name: 'Theodore Wirth Park',
  temperature: 72,
  precipitation: 10,
  park_type: 'Regional Park',
  latitude: 44.98,
  longitude: -93.31,
}

// A name engineered to break out of an inline <script> and inject live HTML.
const MALICIOUS = `</script><img src=x onerror=alert(document.cookie)>`

describe('generateMediaNetPopupAdHTML', () => {
  it('produces an ad container with an inline script for normal input', () => {
    const html = generateMediaNetPopupAdHTML(base, false)
    expect(html).toContain('medianet-popup-ad-386')
    expect(html).toContain('window.mnet')
    expect(html).toContain('Theodore Wirth Park, Minnesota')
  })

  it('does NOT allow a malicious name to break out of the <script>', () => {
    const html = generateMediaNetPopupAdHTML({ ...base, name: MALICIOUS }, false)
    // The literal </script> + <img> breakout must not appear in the output.
    expect(html).not.toContain('</script><img')
    expect(html).not.toContain('<img src=x onerror=')
    // There must be exactly one real closing </script> tag (the legit one).
    expect(html.match(/<\/script>/g) ?? []).toHaveLength(1)
    // The payload survives only as an escaped JS-string value.
    expect(html).toContain('\\u003c/script\\u003e')
  })

  it('escapes a malicious id used in the container attribute', () => {
    const html = generateMediaNetPopupAdHTML({ ...base, id: '"><img src=x onerror=alert(1)>' }, false)
    expect(html).not.toContain('"><img')
    expect(html).toContain('&quot;&gt;&lt;img')
  })

  it('escapes keywords in test-mode HTML output', () => {
    const html = generateMediaNetPopupAdHTML({ ...base, park_type: '<b>x</b>' }, true)
    // testMode renders keywords into HTML text — must be escaped (park_type only
    // affects the derived keyword, but ensure no raw tags leak regardless).
    expect(html).not.toContain('<b>x</b>')
  })

  it('serializes coordinates as a numeric array', () => {
    const html = generateMediaNetPopupAdHTML(base, false)
    expect(html).toContain('"coordinates":[44.98,-93.31]')
  })
})

describe('generatePOIAdHTML', () => {
  it('produces a contextual ad container for normal input', () => {
    const html = generatePOIAdHTML(base, false)
    expect(html).toContain('contextual-poi-ad-386')
    expect(html).toContain('window.contextualAds')
    expect(html).toContain('Theodore Wirth Park')
  })

  it('does NOT allow a malicious name to break out of the <script>', () => {
    const html = generatePOIAdHTML({ ...base, name: MALICIOUS }, false)
    expect(html).not.toContain('</script><img')
    expect(html).not.toContain('<img src=x onerror=')
    expect(html.match(/<\/script>/g) ?? []).toHaveLength(1)
  })

  it('preserves a temperature of 0 (uses nullish coalescing, not ||)', () => {
    const html = generatePOIAdHTML({ ...base, temperature: 0 }, false)
    expect(html).toContain('"temperature":0')
  })

  it('escapes user content in test-mode HTML', () => {
    const html = generatePOIAdHTML({ ...base, name: '<script>alert(1)</script>' }, true)
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})
