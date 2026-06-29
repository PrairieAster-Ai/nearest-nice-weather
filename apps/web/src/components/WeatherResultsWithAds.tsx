/**
 * ========================================================================
 * WEATHER RESULTS WITH ADS - AdSense Revenue Integration
 * ========================================================================
 *
 * @BUSINESS_PURPOSE: Strategic ad placement within weather results for revenue optimization
 * @TECHNICAL_APPROACH: Native ad integration between POI weather listings
 * @PRD_REF: PRD-GOOGLE-ADSENSE-181.md
 *
 * REVENUE STRATEGY:
 * - Native ads between weather results for optimal engagement
 * - Context-aware outdoor gear and service advertisements
 * - Performance-optimized lazy loading for mobile experience
 *
 * ========================================================================
 */

import React from 'react'
import { Box, Typography, Card, CardContent, Chip } from '@mui/material'
import { AdUnit } from './ads'

/** A single POI entry returned by `/api/poi-locations-with-weather`. */
interface WeatherLocation {
  /** Stable POI identifier (UUID from `poi_locations` table). */
  id: string
  /** Display name of the park, trail, or nature area. */
  name: string
  /** WGS-84 latitude. */
  lat: number
  /** WGS-84 longitude. */
  lng: number
  /** Current temperature in °F from OpenWeather. */
  temperature: number
  /** Short weather condition label (e.g. "Clear", "Partly Cloudy"). */
  condition: string
  /** Human-readable weather summary sentence. */
  description: string
  /** Precipitation probability as a percentage (0–100). */
  precipitation: number
  /** Wind speed in mph. */
  windSpeed: number
  /** Rounded distance from the user's location in miles, if available. */
  distance_miles?: string
}

/** Props for {@link WeatherResultsWithAds}. */
interface WeatherResultsWithAdsProps {
  /** POI weather entries to display; should come from `usePOINavigation`. */
  locations: WeatherLocation[]
  /** Show skeleton loaders while weather data is being fetched. @defaultValue false */
  isLoading?: boolean
  /** Cap on the number of results rendered (performance guard). @defaultValue 20 */
  maxResults?: number
}

/**
 * WeatherResultsWithAds — POI weather listings with native AdSense placement.
 *
 * Renders a scrollable list of weather cards for Minnesota outdoor POIs,
 * injecting a live AdSense unit after every 4th result (but only when
 * there are ≥ 4 results total). Handles loading and empty states inline.
 *
 * @remarks
 * Ad slot `6059346500` is the live "Weather results inline" slot — do not
 * swap it without updating the AdSense console. The `testMode` flag
 * automatically activates in `NODE_ENV === 'development'` so no real
 * impressions are served locally.
 *
 * @example
 * ```tsx
 * const { visiblePOIs, loading } = usePOINavigation(userLocation, filters)
 *
 * <WeatherResultsWithAds
 *   locations={visiblePOIs}
 *   isLoading={loading}
 *   maxResults={20}
 * />
 * ```
 */
export const WeatherResultsWithAds: React.FC<WeatherResultsWithAdsProps> = ({
  locations,
  isLoading = false,
  maxResults = 20
}) => {
  // Limit results for performance
  const displayLocations = locations.slice(0, maxResults)

  // Strategic ad placement - every 4th result for optimal engagement
  const renderLocationWithAds = (location: WeatherLocation, index: number) => {
    const shouldShowAd = (index + 1) % 4 === 0 && index < displayLocations.length - 1

    return (
      <React.Fragment key={`location-${location.id}`}>
        {/* Weather Location Card */}
        <Card
          sx={{
            mb: 2,
            backgroundColor: 'background.paper',
            boxShadow: 1,
            '&:hover': { boxShadow: 2 }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="h3" color="primary">
                {location.name}
              </Typography>
              {location.distance_miles && (
                <Chip
                  label={`${location.distance_miles} mi`}
                  size="small"
                  color="secondary"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label={`${location.temperature}°F`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip
                label={location.condition}
                color="default"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${location.precipitation}% precip`}
                color="info"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${location.windSpeed} mph`}
                color="warning"
                variant="outlined"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {location.description}
            </Typography>
          </CardContent>
        </Card>

        {/* Strategic Ad Placement - Only show with substantial content */}
        {shouldShowAd && displayLocations.length >= 4 && (
          <Box key={`ad-${index}`} sx={{ mb: 3 }}>
            <AdUnit
              slot="6059346500" // Weather results inline ad slot (LIVE)
              placement="weather-results"
              format="auto"
              testMode={process.env.NODE_ENV === 'development'}
              showLabel={true}
              lazy={true}
            />
          </Box>
        )}
      </React.Fragment>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Loading weather conditions...
        </Typography>
      </Box>
    )
  }

  if (displayLocations.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No locations match your weather preferences
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your weather filters or expanding the search radius
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom color="primary">
        Weather Conditions ({displayLocations.length} locations)
      </Typography>

      <Box>
        {displayLocations.map((location, index) =>
          renderLocationWithAds(location, index)
        )}
      </Box>

    </Box>
  )
}

export default WeatherResultsWithAds
