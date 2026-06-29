/**
 * ========================================================================
 * WeatherResultsWithAds COMPONENT TESTS
 * ========================================================================
 *
 * Verifies the results list: loading + empty states, card content (name,
 * temperature, condition, precipitation, wind, optional distance chip),
 * maxResults slicing, and the "ad after every 4th result (never trailing)"
 * placement rule.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeatherResultsWithAds } from '../WeatherResultsWithAds'

interface Row {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number
  windSpeed: number
  distance_miles?: string
}

const mkRow = (over: Partial<Row> & { id: string }): Row => ({
  name: `Park ${over.id}`,
  lat: 45,
  lng: -93,
  temperature: 70,
  condition: 'Sunny',
  description: `Description ${over.id}`,
  precipitation: 10,
  windSpeed: 5,
  ...over,
})

const mkRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => mkRow({ id: String(i + 1) }))

describe('WeatherResultsWithAds', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders a loading state', () => {
    render(<WeatherResultsWithAds locations={[]} isLoading />)
    expect(screen.getByText(/Loading weather conditions/i)).toBeInTheDocument()
  })

  it('renders the empty state when there are no locations', () => {
    render(<WeatherResultsWithAds locations={[]} />)
    expect(screen.getByText(/No locations match your weather preferences/i)).toBeInTheDocument()
    expect(screen.getByText(/expanding the search radius/i)).toBeInTheDocument()
  })

  it('renders a header with the displayed location count', () => {
    render(<WeatherResultsWithAds locations={mkRows(3)} />)
    expect(screen.getByText(/Weather Conditions \(3 locations\)/i)).toBeInTheDocument()
  })

  it('renders each location card with weather details', () => {
    render(
      <WeatherResultsWithAds
        locations={[
          mkRow({ id: '1', name: 'Gooseberry Falls', temperature: 64, condition: 'Cloudy', precipitation: 30, windSpeed: 8, distance_miles: '12.4' }),
        ]}
      />,
    )

    expect(screen.getByText('Gooseberry Falls')).toBeInTheDocument()
    expect(screen.getByText('64°F')).toBeInTheDocument()
    expect(screen.getByText('Cloudy')).toBeInTheDocument()
    expect(screen.getByText('30% precip')).toBeInTheDocument()
    expect(screen.getByText('8 mph')).toBeInTheDocument()
    expect(screen.getByText('12.4 mi')).toBeInTheDocument()
    expect(screen.getByText('Description 1')).toBeInTheDocument()
  })

  it('omits the distance chip when distance_miles is absent', () => {
    render(<WeatherResultsWithAds locations={[mkRow({ id: '1' })]} />)
    expect(screen.queryByText(/ mi$/)).not.toBeInTheDocument()
  })

  it('inserts a single ad after the 4th result when more results follow', () => {
    // AdUnit only renders a visible placeholder in development test mode;
    // in production/test it returns null. Force the placeholder so the
    // placement rule is observable.
    vi.stubEnv('NODE_ENV', 'development')
    // 5 rows: ad slot eligible after index 3 (the 4th), which is not the last.
    render(<WeatherResultsWithAds locations={mkRows(5)} />)
    const ads = screen.getAllByText(/Test Ad Unit - weather-results/i)
    expect(ads).toHaveLength(1)
  })

  it('places a second ad only once an 8th-but-not-final result exists', () => {
    vi.stubEnv('NODE_ENV', 'development')
    // 9 rows: ads after index 3 and index 7 (both followed by more rows).
    render(<WeatherResultsWithAds locations={mkRows(9)} />)
    expect(screen.getAllByText(/Test Ad Unit - weather-results/i)).toHaveLength(2)
  })

  it('does not render an ad when there are fewer than 4 results', () => {
    vi.stubEnv('NODE_ENV', 'development')
    render(<WeatherResultsWithAds locations={mkRows(3)} />)
    expect(screen.queryByText(/Test Ad Unit/i)).not.toBeInTheDocument()
  })

  it('does not place an ad after the final result', () => {
    vi.stubEnv('NODE_ENV', 'development')
    // Exactly 4 rows: the 4th is the last, so the modulo slot is suppressed.
    render(<WeatherResultsWithAds locations={mkRows(4)} />)
    expect(screen.queryByText(/Test Ad Unit/i)).not.toBeInTheDocument()
  })

  it('limits rendered rows to maxResults', () => {
    render(<WeatherResultsWithAds locations={mkRows(30)} maxResults={5} />)
    expect(screen.getByText(/Weather Conditions \(5 locations\)/i)).toBeInTheDocument()
    expect(screen.getByText('Park 5')).toBeInTheDocument()
    expect(screen.queryByText('Park 6')).not.toBeInTheDocument()
  })
})
