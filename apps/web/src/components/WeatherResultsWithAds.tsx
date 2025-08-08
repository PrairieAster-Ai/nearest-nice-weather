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

interface WeatherLocation {
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

interface WeatherResultsWithAdsProps {
  locations: WeatherLocation[]
  isLoading?: boolean
  maxResults?: number
}

/**
 * WeatherResultsWithAds - POI weather listings with strategic ad placement
 * 
 * Optimizes revenue through native ad integration while maintaining
 * excellent user experience for outdoor recreation planning
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
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
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
            
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
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

        {/* Strategic Ad Placement */}
        {shouldShowAd && (
          <Box key={`ad-${index}`} sx={{ mb: 3 }}>
            <AdUnit
              slot="1234567891" // Different slot for weather results
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
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Loading weather conditions...
        </Typography>
      </Box>
    )
  }

  if (displayLocations.length === 0) {
    return (
      <Box p={2} textAlign="center">
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
    <Box p={2}>
      <Typography variant="h5" gutterBottom color="primary">
        Weather Conditions ({displayLocations.length} locations)
      </Typography>
      
      <Box>
        {displayLocations.map((location, index) => 
          renderLocationWithAds(location, index)
        )}
      </Box>

      {/* Bottom Ad Placement for longer sessions */}
      {displayLocations.length >= 8 && (
        <Box mt={3}>
          <AdUnit
            slot="1234567892" // Different slot for bottom placement
            placement="weather-results"
            format="auto"
            testMode={process.env.NODE_ENV === 'development'}
            showLabel={true}
            lazy={true}
          />
        </Box>
      )}
    </Box>
  )
}

export default WeatherResultsWithAds