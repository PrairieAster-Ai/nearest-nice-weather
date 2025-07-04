import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { Location } from './WeatherMap'

interface LocationCardProps {
  location: Location
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6">{location.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </Typography>
      {location.weather && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            🌡️ {location.weather.temperature}°F
          </Typography>
          <Typography variant="body2">
            🌧️ {location.weather.precipitation}% chance
          </Typography>
          <Typography variant="body2">
            💨 {location.weather.windSpeed} mph
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default LocationCard