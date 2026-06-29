/**
 * ========================================================================
 * MapContainer COMPONENT TESTS
 * ========================================================================
 *
 * Drives the Leaflet wrapper end-to-end in jsdom: map initialisation and
 * input validation, center/zoom updates, incremental marker add/remove, the
 * draggable user-location marker lifecycle, and the document-level event
 * delegation for popup "closer/farther" navigation (including the end-of-
 * results notification and the directions analytics hook).
 *
 * trackPOIInteraction / trackFeatureUsage are mocked so analytics calls are
 * observable without any network I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import { MapContainer } from '../MapContainer'

vi.mock('../../utils/analytics', () => ({
  trackPOIInteraction: vi.fn(),
  trackFeatureUsage: vi.fn(),
}))
import { trackPOIInteraction, trackFeatureUsage } from '../../utils/analytics'

interface POI {
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
}

const mkPOI = (over: Partial<POI> & { id: string }): POI => ({
  name: `POI ${over.id}`,
  lat: 44.98,
  lng: -93.27,
  temperature: 70,
  condition: 'Clear',
  description: 'nice',
  precipitation: 10,
  windSpeed: '5',
  park_type: 'State Park',
  ...over,
})

const baseProps = {
  center: [44.98, -93.27] as [number, number],
  zoom: 10,
  locations: [] as POI[],
  userLocation: null as [number, number] | null,
  onLocationChange: vi.fn(),
  currentPOI: null as POI | null,
  isAtClosest: false,
  isAtFarthest: false,
  canExpand: true,
  onNavigateCloser: vi.fn(() => null),
  onNavigateFarther: vi.fn(() => null),
}

describe('MapContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).leafletMapInstance
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('renders the accessible map container element', () => {
    const { getByTestId } = render(<MapContainer {...baseProps} />)
    const container = getByTestId('map-container')
    expect(container).toHaveAttribute('role', 'application')
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('Interactive map'))
  })

  it('initialises a Leaflet map and exposes it for testing', () => {
    render(<MapContainer {...baseProps} />)
    expect((window as any).leafletMapInstance).toBeDefined()
    expect(typeof (window as any).leafletMapInstance.setView).toBe('function')
  })

  it('warns and skips map creation when center is invalid', () => {
    const warnSpy = vi.spyOn(console, 'warn')
    render(<MapContainer {...baseProps} center={[NaN, NaN]} />)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid center or zoom'),
      expect.anything(),
    )
    expect((window as any).leafletMapInstance).toBeUndefined()
  })

  it('updates the view when center and zoom props change', () => {
    const { rerender } = render(<MapContainer {...baseProps} />)
    const map = (window as any).leafletMapInstance
    const setViewSpy = vi.spyOn(map, 'setView')

    rerender(<MapContainer {...baseProps} center={[45.5, -92.5]} zoom={12} />)

    expect(setViewSpy).toHaveBeenCalledWith([45.5, -92.5], 12)
  })

  it('adds a marker for each location', () => {
    const map = () => (window as any).leafletMapInstance
    const locations = [mkPOI({ id: '1', lat: 44.98, lng: -93.27 }), mkPOI({ id: '2', lat: 45.05, lng: -93.3 })]
    render(<MapContainer {...baseProps} locations={locations} />)

    let markerCount = 0
    map().eachLayer((layer: any) => {
      if (layer.getLatLng) markerCount++
    })
    expect(markerCount).toBe(2)
  })

  it('removes excess markers when the location list shrinks', () => {
    const map = () => (window as any).leafletMapInstance
    const three = [mkPOI({ id: '1' }), mkPOI({ id: '2', lat: 45.0 }), mkPOI({ id: '3', lat: 45.1 })]
    const { rerender } = render(<MapContainer {...baseProps} locations={three} />)

    rerender(<MapContainer {...baseProps} locations={[three[0]]} />)

    let markerCount = 0
    map().eachLayer((layer: any) => {
      if (layer.getLatLng) markerCount++
    })
    expect(markerCount).toBe(1)
  })

  it('creates a draggable user-location marker when a location is provided', () => {
    const map = () => (window as any).leafletMapInstance
    render(<MapContainer {...baseProps} userLocation={[44.9, -93.2]} />)

    let userMarker: any = null
    map().eachLayer((layer: any) => {
      if (layer.options && layer.options.isUserMarker) userMarker = layer
    })
    expect(userMarker).not.toBeNull()
    expect(userMarker.options.draggable).toBe(true)
  })

  it('reports a dragged user-location via onLocationChange', () => {
    const onLocationChange = vi.fn()
    const map = () => (window as any).leafletMapInstance
    render(<MapContainer {...baseProps} userLocation={[44.9, -93.2]} onLocationChange={onLocationChange} />)

    let userMarker: any = null
    map().eachLayer((layer: any) => {
      if (layer.options && layer.options.isUserMarker) userMarker = layer
    })

    act(() => {
      userMarker.setLatLng([45.1, -93.4])
      userMarker.fire('dragend', { target: userMarker })
    })

    expect(onLocationChange).toHaveBeenCalledWith([45.1, -93.4])
  })

  describe('popup navigation event delegation', () => {
    const addNavButton = (action: 'closer' | 'farther') => {
      const btn = document.createElement('button')
      btn.setAttribute('data-nav-action', action)
      document.body.appendChild(btn)
      return btn
    }

    it('invokes onNavigateCloser when a "closer" popup button is clicked', () => {
      const onNavigateCloser = vi.fn(() => null)
      render(<MapContainer {...baseProps} locations={[mkPOI({ id: '1' })]} onNavigateCloser={onNavigateCloser} />)

      const btn = addNavButton('closer')
      fireEvent.click(btn)

      expect(onNavigateCloser).toHaveBeenCalledTimes(1)
      btn.remove()
    })

    it('invokes onNavigateFarther and shows the end-of-results notice on NO_MORE_RESULTS', () => {
      const onNavigateFarther = vi.fn(() => 'NO_MORE_RESULTS')
      render(<MapContainer {...baseProps} locations={[mkPOI({ id: '1' })]} onNavigateFarther={onNavigateFarther} />)

      const btn = addNavButton('farther')
      fireEvent.click(btn)

      expect(onNavigateFarther).toHaveBeenCalledTimes(1)
      // The notification is appended to document.body.
      expect(document.body.textContent).toContain('End of Results')
      btn.remove()
    })

    it('tracks a directions click via analytics without preventing the link', () => {
      render(<MapContainer {...baseProps} locations={[mkPOI({ id: '1' })]} />)

      const link = document.createElement('a')
      link.setAttribute('data-analytics-action', 'directions-clicked')
      link.setAttribute('data-analytics-poi', 'Lebanon Hills')
      document.body.appendChild(link)

      fireEvent.click(link)

      expect(trackFeatureUsage).toHaveBeenCalledWith('directions', { poi_name: 'Lebanon Hills' })
      link.remove()
    })
  })

  it('does not crash and cleans up the map on unmount', () => {
    const { unmount } = render(<MapContainer {...baseProps} locations={[mkPOI({ id: '1' })]} />)
    expect(() => unmount()).not.toThrow()
  })
})
