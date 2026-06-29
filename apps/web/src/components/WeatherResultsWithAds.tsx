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

/** A single POI weather row rendered in the results list. */
interface WeatherLocation {
  /** Stable POI identifier. */
  id: string
  /** Display name of the destination. */
  name: string
  /** Latitude. */
  lat: number
  /** Longitude. */
  lng: number
  /** Current temperature (°F). */
  temperature: number
  /** Weather condition label. */
  condition: string
  /** Human-readable weather description. */
  description: string
  /** Precipitation likelihood/intensity (0-100). */
  precipitation: number
  /** Current wind speed (mph). */
  windSpeed: number
  /** Distance from the user, if computed. */
  distance_miles?: string
}

/** Props for {@link WeatherResultsWithAds}. */
interface WeatherResultsWithAdsProps {
  /** POI weather rows to display. */
  locations: WeatherLocation[]
  /** Shows loading affordances instead of rows. */
  isLoading?: boolean
  /** Caps how many rows render, for performance (default 20). */
  maxResults?: number
}

/**
 * Renders a POI weather results list with a native {@link AdUnit} woven in after
 * every 4th result (never trailing the last row). Slices to `maxResults` for
 * performance; balances ad revenue against an uninterrupted browsing experience.
 *
 * @example
 * ```tsx
 * <WeatherResultsWithAds locations={results} isLoading={loading} maxResults={20} />
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
