import { useState, useRef, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { FabFilterSystem } from './components/FabFilterSystem'
import { FeedbackFab } from './components/FeedbackFab'
import 'leaflet/dist/leaflet.css'
import './popup-styles.css'
import L from 'leaflet'

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
    precipitation: 'none',
    wind: 'calm'
  })
  
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.7296, -94.6859])
  const [mapZoom, setMapZoom] = useState(7)

  // Helper function to apply relative filtering
  const applyRelativeFilters = (locations: Location[], filters: WeatherFilters): Location[] => {
    let filtered = [...locations]

    // Temperature filtering - relative to current conditions
    if (filters.temperature && filters.temperature !== '') {
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
    if (filters.precipitation && filters.precipitation !== '') {
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
    if (filters.wind && filters.wind !== '') {
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

  // Helper function to update map view
  const updateMapView = (filtered: Location[]) => {
    if (filtered.length > 0) {
      const avgLat = filtered.reduce((sum, loc) => sum + loc.lat, 0) / filtered.length
      const avgLng = filtered.reduce((sum, loc) => sum + loc.lng, 0) / filtered.length
      setMapCenter([avgLat, avgLng])
      
      // Adjust zoom based on number of results
      if (filtered.length === 1) {
        setMapZoom(10)
      } else if (filtered.length <= 3) {
        setMapZoom(8)
      } else {
        setMapZoom(7)
      }
    }
  }

  // Apply initial filters and calculate center on component mount
  useEffect(() => {
    const filtered = applyRelativeFilters(locations, {
      temperature: 'mild',
      precipitation: 'none', 
      wind: 'calm'
    })
    
    setFilteredLocations(filtered)
    updateMapView(filtered)
  }, [])

  const handleFilterChange = (category: keyof WeatherFilters, value: string) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    
    // Apply relative filtering logic
    const filtered = applyRelativeFilters(locations, newFilters)
    setFilteredLocations(filtered)
    updateMapView(filtered)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="h-screen w-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-purple-200 z-[1001] relative" style={{marginTop: '4px', marginBottom: '-8px'}}>
          <div className="flex items-start" style={{marginLeft: '-10px'}}>
            <img src="/aster-official.svg" alt="Nearest Nice Weather" className="h-8 w-8" style={{marginTop: '-15px', marginRight: '-11px'}} />
            <div style={{marginLeft: '2px', lineHeight: '1'}}>
              <h1 className="text-sm font-semibold text-purple-800 mb-0">Nearest Nice Weather</h1>
              <p className="text-xs mb-0" style={{color: '#7fa4cf', marginTop: '-5px'}}>by PrairieAster.Ai</p>
            </div>
          </div>
        </header>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredLocations.map((location) => (
            <Marker key={location.id} position={[location.lat, location.lng]} icon={asterIcon}>
              <Popup maxWidth={280} className="custom-popup">
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

          {/* Feedback FAB - bottom right */}
          <div className="absolute bottom-6 right-6 z-[1000]">
            <FeedbackFab />
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-purple-50 px-4 py-2 border-t border-purple-200 z-[1001] relative">
          <div className="text-center">
            <span className="text-xs text-purple-600">© 2024 PrairieAster.Ai</span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}