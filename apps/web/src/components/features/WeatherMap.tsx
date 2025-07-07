import { FC } from 'react'
import { Box, Typography } from '@mui/material'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface Location {
  id: number
  name: string
  lat: number
  lng: number
  weather?: {
    temperature: number
    precipitation: number
    windSpeed: number
  }
}

interface WeatherMapProps {
  locations: Location[]
  center?: [number, number]
  zoom?: number
  height?: number
}

export const WeatherMap: FC<WeatherMapProps> = ({
  locations,
  center = [46.7296, -94.6859], // Minnesota center
  zoom = 6,
  height = 400,
}) => {
  if (locations.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <Typography color="text.secondary">
          No locations to display
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height, mb: 3 }}>
      <MapContainer
        {...({ center: center as LatLngExpression, zoom: zoom, style: { height: '100%', width: '100%' } } as any)}
      >
        <TileLayer
          {...({ url: import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
        />
        {locations.map((location) => (
          <Marker {...({ key: location.id, position: [location.lat, location.lng] as LatLngExpression } as any)}>
            <Popup {...({} as any)}>
              <div>
                <strong>{location.name}</strong>
                {location.weather && (
                  <div>
                    <div>Temperature: {location.weather.temperature}°F</div>
                    <div>Precipitation: {location.weather.precipitation}%</div>
                    <div>Wind: {location.weather.windSpeed} mph</div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  )
}

export default WeatherMap