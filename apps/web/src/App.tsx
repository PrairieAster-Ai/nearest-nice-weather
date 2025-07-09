import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { FabFilterSystem } from './components/FabFilterSystem'
import { FeedbackFab } from './components/FeedbackFab'
import { UnifiedStickyFooter } from './components/UnifiedStickyFooter'
import { DraggableUserMarker } from './components/DraggableUserMarker'
import 'leaflet/dist/leaflet.css'
import './popup-styles.css'
import L, { LatLngExpression } from 'leaflet'

// Create custom purple aster marker icon with white background
const asterIcon = new L.Icon({
  iconUrl: '/aster-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
})

// PrairieAster.Ai theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#7563A8',
    },
    secondary: {
      main: '#4FC3F7',
    },
  },
})

interface WeatherFilters {
  temperature: string
  precipitation: string  
  wind: string
}

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number // 0-100 scale (0 = clear, 100 = heavy rain/snow)
  windSpeed: number     // mph
}

// Sample Minnesota locations
const locations: Location[] = [
  {
    id: '1',
    name: 'Brainerd Lakes Area',
    lat: 46.3581,
    lng: -94.2003,
    temperature: 72,
    condition: 'Sunny',
    description: 'Perfect for lake activities',
    precipitation: 5,   // Light chance
    windSpeed: 8        // Calm
  },
  {
    id: '2', 
    name: 'Duluth',
    lat: 46.7867,
    lng: -92.1005,
    temperature: 68,
    condition: 'Partly Cloudy',
    description: 'Great for North Shore adventures',
    precipitation: 25,  // Light rain
    windSpeed: 15       // Breezy
  },
  {
    id: '3',
    name: 'Grand Rapids',
    lat: 47.2372,
    lng: -93.5308,
    temperature: 75,
    condition: 'Clear',
    description: 'Ideal for BWCA entry',
    precipitation: 0,   // No precipitation
    windSpeed: 5        // Very calm
  },
  {
    id: '4',
    name: 'Ely',
    lat: 47.9034,
    lng: -91.8673,
    temperature: 70,
    condition: 'Overcast',
    description: 'BWCA gateway',
    precipitation: 60,  // Heavy chance
    windSpeed: 22       // Windy
  },
  {
    id: '5',
    name: 'Alexandria',
    lat: 45.8852,
    lng: -95.3775,
    temperature: 74,
    condition: 'Sunny',
    description: 'Lake country',
    precipitation: 10,  // Very light
    windSpeed: 12       // Light breeze
  }
]

export default function App() {
  const [filters, setFilters] = useState<WeatherFilters>({
    temperature: 'mild',
    precipitation: 'light', // More inclusive for nice weather
    wind: 'calm'
  })
  
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.7296, -94.6859]) // Default to Minnesota
  const [mapZoom, setMapZoom] = useState(7)
  const [mapReady, setMapReady] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Helper function to apply relative filtering
  const applyRelativeFilters = (locations: Location[], filters: WeatherFilters): Location[] => {
    let filtered = [...locations]

    // Temperature filtering - relative to current conditions
    if (filters.temperature && filters.temperature.length > 0) {
      const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
      const tempCount = temps.length
      
      if (filters.temperature === 'cold') {
        // Coldest 20%
        const threshold = temps[Math.floor(tempCount * 0.2)]
        filtered = filtered.filter(loc => loc.temperature <= threshold)
      } else if (filters.temperature === 'hot') {
        // Hottest 20%
        const threshold = temps[Math.floor(tempCount * 0.8)]
        filtered = filtered.filter(loc => loc.temperature >= threshold)
      } else if (filters.temperature === 'mild') {
        // Middle 60% (exclude top and bottom 20%)
        const lowThreshold = temps[Math.floor(tempCount * 0.2)]
        const highThreshold = temps[Math.floor(tempCount * 0.8)]
        filtered = filtered.filter(loc => loc.temperature > lowThreshold && loc.temperature < highThreshold)
      }
    }

    // Precipitation filtering - relative to current conditions
    if (filters.precipitation && filters.precipitation.length > 0) {
      const precips = locations.map(loc => loc.precipitation).sort((a, b) => a - b)
      const precipCount = precips.length
      
      if (filters.precipitation === 'none') {
        // Driest 30% (least precipitation)
        const threshold = precips[Math.floor(precipCount * 0.3)]
        filtered = filtered.filter(loc => loc.precipitation <= threshold)
      } else if (filters.precipitation === 'light') {
        // Middle 40% (moderate precipitation)
        const lowThreshold = precips[Math.floor(precipCount * 0.3)]
        const highThreshold = precips[Math.floor(precipCount * 0.7)]
        filtered = filtered.filter(loc => loc.precipitation > lowThreshold && loc.precipitation <= highThreshold)
      } else if (filters.precipitation === 'heavy') {
        // Wettest 30% (most precipitation)
        const threshold = precips[Math.floor(precipCount * 0.7)]
        filtered = filtered.filter(loc => loc.precipitation > threshold)
      }
    }

    // Wind filtering - relative to current conditions
    if (filters.wind && filters.wind.length > 0) {
      const winds = locations.map(loc => loc.windSpeed).sort((a, b) => a - b)
      const windCount = winds.length
      
      if (filters.wind === 'calm') {
        // Calmest 30% (least wind)
        const threshold = winds[Math.floor(windCount * 0.3)]
        filtered = filtered.filter(loc => loc.windSpeed <= threshold)
      } else if (filters.wind === 'breezy') {
        // Middle 40% (moderate wind)
        const lowThreshold = winds[Math.floor(windCount * 0.3)]
        const highThreshold = winds[Math.floor(windCount * 0.7)]
        filtered = filtered.filter(loc => loc.windSpeed > lowThreshold && loc.windSpeed <= highThreshold)
      } else if (filters.wind === 'windy') {
        // Windiest 30% (most wind)
        const threshold = winds[Math.floor(windCount * 0.7)]
        filtered = filtered.filter(loc => loc.windSpeed > threshold)
      }
    }

    // Ensure we always return at least some results
    if (filtered.length === 0) {
      // If no results, return the closest match or fall back to all locations
      return locations.slice(0, Math.min(3, locations.length))
    }

    return filtered
  }

  // Helper function to update map view - fits user location and all markers
  const updateMapView = (filtered: Location[]) => {
    if (filtered.length > 0) {
      // Calculate bounds to fit all markers
      const lats = filtered.map(loc => loc.lat)
      const lngs = filtered.map(loc => loc.lng)
      
      // Include user location in bounds if available
      if (userLocation) {
        lats.push(userLocation[0])
        lngs.push(userLocation[1])
      }
      
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      
      // Calculate center
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      setMapCenter([centerLat, centerLng])
      
      // Calculate zoom to fit all markers + user location with padding
      const latRange = maxLat - minLat
      const lngRange = maxLng - minLng
      const maxRange = Math.max(latRange, lngRange)
      
      // Dynamic zoom based on geographic spread (more zoomed in as shown in screenshot)
      let zoom = 9 // default higher zoom
      if (maxRange < 0.1) zoom = 12      // Very close
      else if (maxRange < 0.5) zoom = 10  // Close
      else if (maxRange < 1.0) zoom = 9   // Medium spread (matches screenshot)
      else if (maxRange < 2.0) zoom = 8   // Wide spread
      else if (maxRange < 5.0) zoom = 7   // Very wide spread
      else zoom = 6                       // Continental spread
      
      setMapZoom(zoom)
    }
  }

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude]
          setUserLocation(userPos)
          setMapCenter(userPos)
        },
        (error) => {
          console.log('Location access denied or unavailable:', error)
          // Keep default Minnesota center
        }
      )
    }
  }, [])

  // Apply initial filters and calculate center on component mount
  useEffect(() => {
    const filtered = applyRelativeFilters(locations, {
      temperature: 'mild',
      precipitation: 'light', // More inclusive for nice weather
      wind: 'calm'
    })
    
    setFilteredLocations(filtered)
    updateMapView(filtered) // Always update view to include user location in bounds
    setMapReady(true)
  }, [userLocation])

  const handleFilterChange = (category: keyof WeatherFilters, value: string) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    
    // Apply relative filtering logic
    const filtered = applyRelativeFilters(locations, newFilters)
    setFilteredLocations(filtered)
    updateMapView(filtered)
  }

  const handleUserLocationChange = (newPosition: [number, number]) => {
    setUserLocation(newPosition)
    // Re-apply current filters with new user location
    const filtered = applyRelativeFilters(locations, filters)
    setFilteredLocations(filtered)
    updateMapView(filtered)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="h-screen w-screen flex flex-col" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>

        {/* Map Container - Full height, no padding, seamless with footer */}
        <div className="flex-1 relative">
          <MapContainer
          {...({ center: mapCenter as LatLngExpression, zoom: mapZoom, style: { height: '100%', width: '100%' }, scrollWheelZoom: true, zoomControl: false } as any)}
        >
          <TileLayer
            {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any)}
          />
          
          {/* User location marker - draggable */}
          {userLocation && (
            <DraggableUserMarker 
              position={userLocation}
              onLocationChange={handleUserLocationChange}
            />
          )}

          {filteredLocations.map((location) => (
            <Marker 
              key={location.id}
              {...({ position: [location.lat, location.lng] as LatLngExpression, icon: asterIcon } as any)}>
              <Popup {...({ maxWidth: 280, className: "custom-popup" } as any)}>
                <div className="p-2 text-xs leading-tight">
                  {/* Header */}
                  <div className="mb-1">
                    <h3 className="font-bold text-sm text-black mb-0">{location.name}</h3>
                    <p className="text-xs text-gray-800 mt-0">{location.description}</p>
                  </div>

                  {/* Weather Summary */}
                  <div className="bg-gray-100 rounded p-2 mb-2 border">
                    <div className="flex justify-between items-center text-xs text-black font-medium" style={{gap: '5px'}}>
                      <span className="font-bold text-lg text-black">{location.temperature}°F</span>
                      <span className="text-lg">
                        {location.condition === 'Sunny' ? '☀️' : 
                         location.condition === 'Partly Cloudy' ? '⛅' :
                         location.condition === 'Cloudy' ? '☁️' :
                         location.condition === 'Overcast' ? '🌫️' :
                         location.condition === 'Clear' ? '✨' : location.condition}
                      </span>
                      <span>💧 {location.precipitation}%</span>
                      <span>💨 {location.windSpeed}</span>
                    </div>
                  </div>

                  {/* Action Links */}
                  <div className="space-y-1">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
                      style={{backgroundColor: 'rgba(133, 109, 166, 0.5)'}}
                    >
                      🗺️ Driving Directions
                    </a>
                    
                    <a 
                      href={`https://www.dnr.state.mn.us/search?terms=${encodeURIComponent(location.name.replace(/\s+/g, '+'))}&filter=all`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
                      style={{backgroundColor: 'rgba(127, 164, 207, 0.5)'}}
                    >
                      🌲 MN DNR
                    </a>
                    <a 
                      href={`https://www.exploreminnesota.com/search?keys=${encodeURIComponent(location.name.replace(/\s+/g, '+'))}&field_page_type=All`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
                      style={{backgroundColor: 'rgba(133, 109, 166, 0.5)'}}
                    >
                      ⭐ Explore MN
                    </a>
                  </div>

                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

          {/* FAB Filter System - top right, expanding left */}
          <div className="absolute top-6 right-6 z-[1000]">
            <FabFilterSystem
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Feedback FAB - positioned above footer, responsive to footer size */}
          <div className="absolute right-6 z-[1000]" style={{ 
            bottom: window.innerWidth < 600 ? 'max(calc(5.6vh + 8px), 50px)' : 'max(calc(6vh + 8px), 58px)'
          }}>
            <FeedbackFab />
          </div>
        </div>

        {/* Unified Sticky Footer */}
        <UnifiedStickyFooter />
      </div>
    </ThemeProvider>
  )
}// Force deployment trigger Sat Jul  5 01:41:20 PM CDT 2025
