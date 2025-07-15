import { useState, useEffect, useCallback, useRef } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, CircularProgress, Alert } from '@mui/material'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { FabFilterSystem } from './components/FabFilterSystem'
import { FeedbackFab } from './components/FeedbackFab'
import { UnifiedStickyFooter } from './components/UnifiedStickyFooter'
import { DraggableUserMarker } from './components/DraggableUserMarker'
import { MapController } from './components/MapController'
import { useWeatherLocations } from './hooks/useWeatherLocations'
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

// MapComponent with proper lifecycle management to handle React StrictMode
const MapComponent = ({ center, zoom, locations, userLocation, onLocationChange, showLocationPrompt }: {
  center: [number, number];
  zoom: number;
  locations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    temperature: number;
    condition: string;
    description: string;
    precipitation: number;
    windSpeed: number;
  }>;
  userLocation: [number, number] | null;
  onLocationChange: (newPosition: [number, number]) => void;
  showLocationPrompt: boolean;
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Validate center and zoom before creating map
    if (!center || isNaN(center[0]) || isNaN(center[1]) || !zoom || isNaN(zoom)) {
      console.warn('Invalid center or zoom provided to MapComponent:', { center, zoom });
      return;
    }

    // Create new map instance
    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: false
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Cleanup function
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && center && !isNaN(center[0]) && !isNaN(center[1]) && zoom && !isNaN(zoom)) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Add markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing location markers only (preserve user marker)
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer.options.isUserMarker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Add location markers
    locations.forEach((location) => {
      const marker = L.marker([location.lat, location.lng], { icon: asterIcon });
      
      const popupContent = `
        <div class="p-2 text-xs leading-tight">
          <div class="mb-1">
            <h3 class="font-bold text-sm text-black mb-0">${location.name}</h3>
            <p class="text-xs text-gray-800 mt-0">${location.description}</p>
          </div>
          <div class="bg-gray-100 rounded p-2 mb-2 border">
            <div class="flex justify-between items-center text-xs text-black font-medium" style="gap: 5px">
              <span class="font-bold text-lg text-black">${location.temperature}°F</span>
              <span class="text-lg">
                ${location.condition === 'Sunny' ? '☀️' : 
                  location.condition === 'Partly Cloudy' ? '⛅' :
                  location.condition === 'Cloudy' ? '☁️' :
                  location.condition === 'Overcast' ? '🌫️' :
                  location.condition === 'Clear' ? '✨' : location.condition}
              </span>
              <span>💧 ${location.precipitation}%</span>
              <span>💨 ${location.windSpeed}</span>
            </div>
          </div>
          <div class="space-y-1">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}" 
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(133, 109, 166, 0.5)">
              🗺️ Driving Directions
            </a>
            <a href="https://www.dnr.state.mn.us/search?terms=${encodeURIComponent(location.name.replace(/\s+/g, '+'))}&filter=all"
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(127, 164, 207, 0.5)">
              🌲 MN DNR
            </a>
            <a href="https://www.exploreminnesota.com/search?keys=${encodeURIComponent(location.name.replace(/\s+/g, '+'))}&field_page_type=All"
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(133, 109, 166, 0.5)">
              ⭐ Explore MN
            </a>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, { maxWidth: 280, className: "custom-popup" });
      marker.addTo(mapRef.current!);
    });
  }, [locations]);

  // Create user location marker once and update position as needed
  useEffect(() => {
    if (!mapRef.current) return;

    // Create marker only if it doesn't exist and we have valid location
    if (!userMarkerRef.current && userLocation && userLocation[0] !== undefined && userLocation[1] !== undefined &&
        !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
      
      // Use standard cool guy emoji (😎) with white circular background
      const coolGuyIcon = new L.Icon({
        iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="15" fill="white" stroke="#ddd" stroke-width="1"/>
            <text x="20" y="28" text-anchor="middle" font-size="24" font-family="Arial, sans-serif">😎</text>
          </svg>
        `),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });

      const userMarker = L.marker(userLocation, { 
        draggable: true,
        isUserMarker: true,
        icon: coolGuyIcon
      });
      
      userMarker.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        if (position && !isNaN(position.lat) && !isNaN(position.lng)) {
          onLocationChange([position.lat, position.lng]);
        }
      });

      // Add popup matching original DraggableUserMarker functionality
      const popupContent = `
        <div class="text-center p-2">
          <div class="text-sm font-bold text-gray-800 mb-1">Our best guess at your location</div>
          <div class="text-xs text-gray-600">Drag and drop for more accuracy</div>
        </div>
      `;
      
      userMarker.bindPopup(popupContent, { className: "custom-popup" });
      userMarker.addTo(mapRef.current!);
      
      // Store reference to the marker
      userMarkerRef.current = userMarker;
    }
    
    // Update existing marker position if it exists and we have valid location
    if (userMarkerRef.current && userLocation && userLocation[0] !== undefined && userLocation[1] !== undefined &&
        !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
      userMarkerRef.current.setLatLng(userLocation);
    }
    
    // Remove marker if location becomes invalid
    if (userMarkerRef.current && (!userLocation || userLocation[0] === undefined || userLocation[1] === undefined ||
        isNaN(userLocation[0]) || isNaN(userLocation[1]))) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  }, [userLocation, onLocationChange]);

  // Handle showLocationPrompt separately to avoid marker recreation
  useEffect(() => {
    if (userMarkerRef.current && showLocationPrompt) {
      userMarkerRef.current.openPopup();
    }
  }, [showLocationPrompt]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};

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

// Weather locations now fetched from database via API

export default function App() {
  const [filters, setFilters] = useState<WeatherFilters>({
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  })
  
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.7296, -94.6859]) // Default to Minnesota
  const [mapZoom, setMapZoom] = useState(7)
  const [, setMapReady] = useState(false)
  const [userLocation, setUserLocationState] = useState<[number, number] | null>(null)
  
  const setUserLocation = (location: [number, number] | null) => {
    console.log('setUserLocation called with:', location)
    setUserLocationState(location)
  }
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const locationInitialized = useRef(false)

  // Fetch weather locations from API
  const { 
    locations: apiLocations, 
    loading: locationsLoading, 
    error: locationsError, 
    refetch: refetchLocations 
  } = useWeatherLocations({ 
    userLocation, 
    limit: 150 // Sensible maximum for nearest nice weather (no geographic restrictions)
  })

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

  // Helper function to calculate dynamic center and zoom from user location + closest 5 results
  const calculateDynamicMapView = useCallback((filtered: Location[], userPos: [number, number] | null): { center: [number, number], zoom: number } => {
    if (!userPos || filtered.length === 0) {
      return { center: [46.7296, -94.6859], zoom: 15 } // Default Minnesota center (12 + 30% = ~15)
    }
    
    // Calculate distances from user location to all results
    const distancesWithLocations = filtered.map(location => {
      const latDiff = location.lat - userPos[0]
      const lngDiff = location.lng - userPos[1]
      return {
        distance: Math.sqrt(latDiff * latDiff + lngDiff * lngDiff),
        location
      }
    })
    
    // Sort by distance (closest first)
    distancesWithLocations.sort((a, b) => a.distance - b.distance)
    
    // Get the closest 5 results (or all if less than 5)
    const targetCount = Math.min(5, filtered.length)
    const closestResults = distancesWithLocations.slice(0, targetCount)
    
    // Calculate bounds including user location and closest 5 results
    const allLats = [userPos[0], ...closestResults.map(r => r.location.lat)]
    const allLngs = [userPos[1], ...closestResults.map(r => r.location.lng)]
    
    const minLat = Math.min(...allLats)
    const maxLat = Math.max(...allLats)
    const minLng = Math.min(...allLngs)
    const maxLng = Math.max(...allLngs)
    
    // Calculate dynamic center that optimizes the view of user + closest results
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // Calculate the geographic spread for zoom optimization
    const latRange = maxLat - minLat
    const lngRange = maxLng - minLng
    const maxRange = Math.max(latRange, lngRange)
    
    // Minimal padding factor for edge visibility - maximum zoom while keeping all points visible
    const paddedRange = maxRange * 1.1
    
    // Convert range to zoom level - granular increments for precise control
    let zoom = 18 // Start with maximum zoom
    if (paddedRange > 0.008) zoom = 17.5   // Ultra-fine adjustment
    if (paddedRange > 0.012) zoom = 17     // Extremely close grouping
    if (paddedRange > 0.018) zoom = 16.5   // Fine adjustment
    if (paddedRange > 0.025) zoom = 16     // Very close grouping
    if (paddedRange > 0.035) zoom = 15.5   // Fine adjustment
    if (paddedRange > 0.050) zoom = 15     // Close grouping
    if (paddedRange > 0.070) zoom = 14.5   // Fine adjustment
    if (paddedRange > 0.095) zoom = 14     // Medium-close grouping
    if (paddedRange > 0.125) zoom = 13.5   // Fine adjustment
    if (paddedRange > 0.165) zoom = 13     // Medium grouping
    if (paddedRange > 0.220) zoom = 12.5   // Fine adjustment
    if (paddedRange > 0.290) zoom = 12     // Medium-wide grouping
    if (paddedRange > 0.380) zoom = 11.5   // Fine adjustment
    if (paddedRange > 0.500) zoom = 11     // Wide grouping
    if (paddedRange > 0.650) zoom = 10.5   // Fine adjustment
    if (paddedRange > 0.850) zoom = 10     // Very wide grouping
    if (paddedRange > 1.100) zoom = 9.5    // Fine adjustment
    if (paddedRange > 1.450) zoom = 9      // Extra wide grouping
    if (paddedRange > 1.900) zoom = 8.5    // Fine adjustment
    if (paddedRange > 2.500) zoom = 8      // Continental grouping
    
    return { center: [centerLat, centerLng], zoom }
  }, [])

  // Helper function to update map view - uses dynamic center calculation
  const updateMapView = useCallback((filtered: Location[]) => {
    if (userLocation) {
      // When user location exists, use dynamic center calculation
      const { center, zoom } = calculateDynamicMapView(filtered, userLocation)
      setMapCenter(center)
      setMapZoom(zoom)
    } else if (filtered.length > 0) {
      // No user location - fit all markers with geographic bounds
      const lats = filtered.map(loc => loc.lat)
      const lngs = filtered.map(loc => loc.lng)
      
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      
      // Calculate center
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      setMapCenter([centerLat, centerLng])
      
      // Calculate zoom to fit all markers with padding
      const latRange = maxLat - minLat
      const lngRange = maxLng - minLng
      const maxRange = Math.max(latRange, lngRange)
      
      // Dynamic zoom based on geographic spread
      let zoom = 9 // default higher zoom
      if (maxRange < 0.1) zoom = 12      // Very close
      else if (maxRange < 0.5) zoom = 10  // Close
      else if (maxRange < 1.0) zoom = 9   // Medium spread
      else if (maxRange < 2.0) zoom = 8   // Wide spread
      else if (maxRange < 5.0) zoom = 7   // Very wide spread
      else zoom = 6                       // Continental spread
      
      setMapZoom(zoom)
    }
  }, [userLocation, calculateDynamicMapView])

  // Comprehensive location strategy: geolocation → IP → fallback position
  useEffect(() => {
    // Prevent re-initialization if already done
    if (locationInitialized.current) {
      return
    }

    // Wait for initial API data before attempting location initialization
    if (apiLocations.length === 0) {
      return
    }

    locationInitialized.current = true

    const getLocationFromIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        if (data.latitude && data.longitude) {
          const ipLocation: [number, number] = [data.latitude, data.longitude]
          setUserLocation(ipLocation)
          setMapCenter(ipLocation)
          setShowLocationPrompt(false)
          // Location set from IP
          return true
        }
      } catch {
        // IP location failed
      }
      return false
    }

    const setFallbackLocation = () => {
      // Center on available results and place marker there with popup open
      const lats = apiLocations.map(loc => loc.lat)
      const lngs = apiLocations.map(loc => loc.lng)
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
      const fallbackLocation: [number, number] = [centerLat, centerLng]
      setUserLocation(fallbackLocation)
      setMapCenter(fallbackLocation)
      setShowLocationPrompt(true) // Show popup to prompt user to move marker
      // Location set to results center (fallback)
    }

    const initializeLocation = async () => {
      // Try geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos: [number, number] = [position.coords.latitude, position.coords.longitude]
            setUserLocation(userPos)
            setMapCenter(userPos)
            setShowLocationPrompt(false)
            console.log('Location set from geolocation')
          },
          async (error) => {
            console.log('Geolocation failed:', error.message)
            // Try IP location
            const ipSuccess = await getLocationFromIP()
            if (!ipSuccess) {
              // Use fallback location
              setFallbackLocation()
            }
          },
          { timeout: 10000, enableHighAccuracy: false }
        )
      } else {
        // No geolocation support, try IP
        const ipSuccess = await getLocationFromIP()
        if (!ipSuccess) {
          setFallbackLocation()
        }
      }
    }

    initializeLocation()
  }, [apiLocations])

  // Apply filters when user location or API data changes
  useEffect(() => {
    // Wait for API data to load before any map calculations
    if (apiLocations.length === 0) {
      return
    }

    if (userLocation === null) {
      // No user location yet - apply default filters to show good variety of locations
      const defaultFilters = {
        temperature: '', // Show all temperatures initially
        precipitation: '', // Show all precipitation levels
        wind: '' // Show all wind speeds
      }
      const filtered = applyRelativeFilters(apiLocations, defaultFilters)
      setFilteredLocations(filtered)
      
      // Use smarter zoom calculation for filtered markers
      if (filtered.length > 0) {
        // For Minnesota weather platform, show regional context with all filtered markers
        // Use all filtered markers to provide comprehensive regional view
        const markersToShow = filtered
        
        const lats = markersToShow.map(loc => loc.lat)
        const lngs = markersToShow.map(loc => loc.lng)
        
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        
        // Calculate center of the closest markers
        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2
        setMapCenter([centerLat, centerLng])
        
        // Use tighter zoom calculation for initial view focused on marker cluster
        const latRange = maxLat - minLat
        const lngRange = maxLng - minLng
        const maxRange = Math.max(latRange, lngRange)
        
        // Use appropriate padding for regional Minnesota view
        const paddedRange = Math.max(maxRange * 1.2, 0.5) // Ensure good regional context for Minnesota
        
        // Use zoom levels optimized for Minnesota regional weather view
        let zoom = 8 // Start with regional view for statewide weather
        if (paddedRange < 4.0) zoom = 8   // Statewide view
        if (paddedRange < 3.0) zoom = 8.5 // Large regional view  
        if (paddedRange < 2.0) zoom = 9   // Regional view
        if (paddedRange < 1.5) zoom = 9.5 // Sub-regional view
        if (paddedRange < 1.0) zoom = 10  // Multi-city view
        if (paddedRange < 0.7) zoom = 10.5
        if (paddedRange < 0.5) zoom = 11  // City cluster view
        if (paddedRange < 0.3) zoom = 11.5
        if (paddedRange < 0.2) zoom = 12  // Close cluster view
        if (paddedRange < 0.1) zoom = 13  // Very close markers
        
        setMapZoom(zoom)
        
        // Give markers time to render, then ensure they're visible
        setTimeout(() => {
          // Visual indicator that our zoom fix is running
          // Debug info - app is working
          console.log('Zoom fix active:', zoom, 'Center:', centerLat.toFixed(3), centerLng.toFixed(3))
          setMapCenter([centerLat, centerLng])
          setMapZoom(zoom)
        }, 100)
      }
    } else {
      // User location available - use current filters with dynamic center calculation
      const filtered = applyRelativeFilters(apiLocations, filters)
      setFilteredLocations(filtered)
      const { center, zoom } = calculateDynamicMapView(filtered, userLocation)
      setMapCenter(center)
      setMapZoom(zoom)
    }
    
    setMapReady(true)
  }, [userLocation, filters, apiLocations, calculateDynamicMapView])

  const handleFilterChange = (category: keyof WeatherFilters, value: string) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    
    // Apply relative filtering logic
    const filtered = applyRelativeFilters(apiLocations, newFilters)
    setFilteredLocations(filtered)
    
    // Use consistent dynamic center calculation for all scenarios
    if (userLocation) {
      // User location exists - use dynamic center for optimal view of results
      const { center, zoom } = calculateDynamicMapView(filtered, userLocation)
      setMapCenter(center)
      setMapZoom(zoom)
    } else {
      // No user location - fit all markers using geographic bounds
      updateMapView(filtered)
    }
  }

  const handleUserLocationChange = (newPosition: [number, number]) => {
    console.log('handleUserLocationChange called with:', newPosition)
    setUserLocation(newPosition)
    setShowLocationPrompt(false) // User has moved the marker, so hide the prompt
    
    // Re-apply current filters with new user location
    const filtered = applyRelativeFilters(apiLocations, filters)
    setFilteredLocations(filtered)
    
    // Use dynamic center calculation for optimal view of user + closest results
    const { center, zoom } = calculateDynamicMapView(filtered, newPosition)
    setMapCenter(center)
    setMapZoom(zoom)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="h-screen w-screen flex flex-col" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>

        {/* Loading State */}
        {locationsLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[2000]">
            <div className="flex flex-col items-center space-y-4">
              <CircularProgress size={48} sx={{ color: '#7563A8' }} />
              <div className="text-lg font-medium text-gray-700">Loading weather locations...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {locationsError && !locationsLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000] max-w-md">
            <Alert 
              severity="error" 
              action={
                <button 
                  onClick={refetchLocations}
                  className="text-sm font-medium underline text-red-800 hover:text-red-900"
                >
                  Retry
                </button>
              }
            >
              Failed to load weather data: {locationsError}
            </Alert>
          </div>
        )}

        {/* Map Container - Full height, no padding, seamless with footer */}
        <div className="flex-1 relative">
          <MapComponent
            center={mapCenter}
            zoom={mapZoom}
            locations={filteredLocations}
            userLocation={userLocation}
            onLocationChange={handleUserLocationChange}
            showLocationPrompt={showLocationPrompt}
          />

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
