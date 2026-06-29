/**
 * ========================================================================
 * POIContextualAd COMPONENT TESTS
 * ========================================================================
 *
 * Exercises the weather/location-aware ad-content selection across every
 * branch (rainy, cold, warm+park, trail, windy, default) plus the precedence
 * between them, and both the test-mode preview and the production render path.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { POIContextualAd } from '../POIContextualAd'

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
  lat: 45,
  lng: -93,
  temperature: 60,
  condition: 'Clear',
  precipitation: 10,
  windSpeed: '5',
  park_type: 'State Park',
  ...over,
})

describe('POIContextualAd', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('contextual content selection (test-mode preview)', () => {
    it('prioritises rainy → Indoor Alternatives even when other conditions match', () => {
      render(<POIContextualAd location={mkPOI({ id: '1', precipitation: 80, temperature: 30 })} testMode />)
      expect(screen.getByText('Indoor Alternatives')).toBeInTheDocument()
      expect(screen.getByText(/Rain Gear/)).toBeInTheDocument()
    })

    it('selects Cold Weather Gear for cold, dry conditions', () => {
      render(<POIContextualAd location={mkPOI({ id: '2', temperature: 30, precipitation: 0 })} testMode />)
      expect(screen.getByText('Cold Weather Gear')).toBeInTheDocument()
      expect(screen.getByText(/Winter Jackets/)).toBeInTheDocument()
    })

    it('selects Park Activities for warm weather at a park', () => {
      render(<POIContextualAd location={mkPOI({ id: '3', temperature: 75, park_type: 'State Park' })} testMode />)
      expect(screen.getByText('Park Activities')).toBeInTheDocument()
      expect(screen.getByText(/Picnic Supplies/)).toBeInTheDocument()
    })

    it('selects Trail Equipment for a trail when not a warm park', () => {
      render(<POIContextualAd location={mkPOI({ id: '4', temperature: 75, park_type: 'Hiking Trail' })} testMode />)
      expect(screen.getByText('Trail Equipment')).toBeInTheDocument()
      expect(screen.getByText(/Trail Snacks/)).toBeInTheDocument()
    })

    it('selects Wind Protection for windy mild conditions', () => {
      render(
        <POIContextualAd
          location={mkPOI({ id: '5', temperature: 60, windSpeed: '20', park_type: 'Open Area' })}
          testMode
        />,
      )
      expect(screen.getByText('Wind Protection')).toBeInTheDocument()
      expect(screen.getByText(/Kites & Wind Sports/)).toBeInTheDocument()
    })

    it('falls back to Outdoor Recreation when nothing special applies', () => {
      render(
        <POIContextualAd
          location={mkPOI({ id: '6', temperature: 60, windSpeed: '5', park_type: 'Open Area' })}
          testMode
        />,
      )
      expect(screen.getByText('Outdoor Recreation')).toBeInTheDocument()
      expect(screen.getByText(/Activity Guides/)).toBeInTheDocument()
    })

    it('renders the POI weather context summary in the preview', () => {
      render(
        <POIContextualAd
          location={mkPOI({ id: '7', temperature: 72, condition: 'Sunny', park_type: 'State Park' })}
          testMode
        />,
      )
      expect(screen.getByText(/72°F • Sunny • State Park/)).toBeInTheDocument()
    })
  })

  describe('production render path', () => {
    it('renders the production ad space with the contextual category when a real client id is set', () => {
      vi.stubEnv('REACT_APP_ADSENSE_CLIENT_ID', 'ca-pub-1234567890')
      render(
        <POIContextualAd
          location={mkPOI({ id: '8', temperature: 30, precipitation: 0 })}
          testMode={false}
        />,
      )
      // The production block renders "Contextual Ad Space" and the category in
      // the same element, so match the combined text with a substring regex.
      expect(screen.getByText(/Contextual Ad Space/)).toBeInTheDocument()
      expect(screen.getByText(/Cold Weather Gear/)).toBeInTheDocument()
    })
  })
})
