/**
 * ========================================================================
 * MediaNetContextualAd COMPONENT TESTS
 * ========================================================================
 *
 * Verifies the test-mode placeholder and the production render path, and
 * exercises every contextual-keyword branch (temperature tiers, precipitation,
 * and park-type) by inspecting the data-keywords / data-* attributes the
 * production markup exposes for Media.net targeting.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaNetContextualAd } from '../MediaNetContextualAd'

interface POI {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  precipitation: number
  windSpeed: string
  park_type?: string
}

const mkPOI = (over: Partial<POI> & { id: string }): POI => ({
  name: `POI ${over.id}`,
  lat: 45.1,
  lng: -93.2,
  temperature: 60,
  condition: 'Clear',
  precipitation: 10,
  windSpeed: '5',
  park_type: 'State Park',
  ...over,
})

/** Render the production markup and return the keyword-bearing ad div. */
function renderProduction(poi: POI) {
  const { container } = render(<MediaNetContextualAd location={poi} testMode={false} />)
  const adDiv = container.querySelector(`#your-popup-slot-id-${poi.id}`) as HTMLElement
  return { container, adDiv }
}

describe('MediaNetContextualAd', () => {
  describe('test-mode placeholder', () => {
    it('renders the labelled test placeholder with the POI context summary', () => {
      render(
        <MediaNetContextualAd
          location={mkPOI({ id: '1', temperature: 80, condition: 'Sunny', park_type: 'State Park' })}
          testMode
        />,
      )
      expect(screen.getByText(/Media.net Contextual Ad \(Test Mode\)/i)).toBeInTheDocument()
      expect(screen.getByText(/80°F, Sunny, State Park/)).toBeInTheDocument()
      expect(screen.getByText(/Keywords:/)).toBeInTheDocument()
    })
  })

  describe('production render path', () => {
    it('renders the Media.net label and geo/weather data attributes', () => {
      const poi = mkPOI({ id: '42', temperature: 70, condition: 'Cloudy', park_type: 'State Park' })
      const { adDiv } = renderProduction(poi)

      expect(screen.getByText(/Powered by Media.net/i)).toBeInTheDocument()
      expect(adDiv).not.toBeNull()
      expect(adDiv.getAttribute('data-geo-lat')).toBe('45.1')
      expect(adDiv.getAttribute('data-geo-lng')).toBe('-93.2')
      expect(adDiv.getAttribute('data-weather-temp')).toBe('70')
      expect(adDiv.getAttribute('data-weather-condition')).toBe('Cloudy')
      expect(adDiv.getAttribute('data-park-type')).toBe('State Park')
    })

    it('includes base recreation keywords for every POI', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1' }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('outdoor recreation')
      expect(kw).toContain('minnesota parks')
    })

    it('adds summer keywords for hot temperatures (>75)', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', temperature: 85 }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('summer activities')
      expect(kw).toContain('camping equipment')
    })

    it('adds winter keywords for cold temperatures (<45)', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', temperature: 30 }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('winter activities')
      expect(kw).toContain('indoor alternatives')
    })

    it('adds shoulder-season keywords for mild temperatures', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', temperature: 60 }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('spring activities')
      expect(kw).toContain('layered clothing')
    })

    it('adds rain keywords when precipitation is high (>50)', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', precipitation: 80 }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('rain gear')
      expect(kw).toContain('waterproof equipment')
    })

    it('adds outdoor-adventure keywords when precipitation is low', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', precipitation: 5 }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('outdoor adventures')
      expect(kw).toContain('hiking trails')
    })

    it('adds trail keywords for trail park types', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', park_type: 'Hiking Trail' }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('hiking boots')
      expect(kw).toContain('backpacking gear')
    })

    it('adds lake keywords for lake park types', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', park_type: 'Lake Park' }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('fishing gear')
      expect(kw).toContain('boat rentals')
    })

    it('adds generic park keywords for other park types', () => {
      const { adDiv } = renderProduction(mkPOI({ id: '1', park_type: 'State Park' }))
      const kw = adDiv.getAttribute('data-keywords') || ''
      expect(kw).toContain('family recreation')
      expect(kw).toContain('outdoor games')
    })
  })
})
