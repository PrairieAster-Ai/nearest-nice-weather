"use client"

import { useEffect, useRef } from 'react'

interface WeatherResult {
  id: string
  locationName: string
  distance: string
  temperature: number
  precipitation: string
  wind: string
  description: string
}

interface SimpleMapProps {
  results: WeatherResult[]
  userLocation: [number, number] | null
  mapCenter: [number, number]
  mapZoom: number
}

// Enhanced Minnesota location data with official tourism resources and POI information
const LOCATION_DATA: Record<string, {
  coords: [number, number],
  resources: {
    exploreMN?: string,
    dnr?: string,
    nps?: string,
    additionalInfo?: string
  },
  highlights: string[],
  nearbyAttractions: string[]
}> = {
  "Brainerd Lakes Area": {
    coords: [46.3581, -94.2003],
    resources: {
      exploreMN: "https://www.exploreminnesota.com/search?keys=Brainerd Lakes Area&field_page_type=All",
      dnr: "https://www.dnr.state.mn.us/state_parks/index.html",
      additionalInfo: "Brainerd Area Tourism"
    },
    highlights: ["Paul Bunyan Trail", "Gull Lake", "Fishing Paradise", "Family Resorts"],
    nearbyAttractions: ["Pequot Lakes", "Nisswa", "Breezy Point Resort", "Cragun's Resort"]
  },
  "Duluth North Shore": {
    coords: [46.7867, -92.1005],
    resources: {
      exploreMN: "https://www.exploreminnesota.com/search?keys=Duluth North Shore&field_page_type=All",
      dnr: "https://www.dnr.state.mn.us/state_parks/gooseberry_falls/index.html",
      nps: "https://www.nps.gov/apis/index.htm",
      additionalInfo: "Visit Duluth"
    },
    highlights: ["Lake Superior", "Split Rock Lighthouse", "Gooseberry Falls", "Superior Hiking Trail"],
    nearbyAttractions: ["Two Harbors", "Grand Marais", "Lutsen Mountains", "Canal Park"]
  },
  "Grand Rapids": {
    coords: [47.2372, -93.5308],
    resources: {
      exploreMN: "https://www.exploreminnesota.com/search?keys=Grand Rapids&field_page_type=All",
      dnr: "https://www.dnr.state.mn.us/state_parks/scenic/index.html",
      additionalInfo: "Visit Grand Rapids MN"
    },
    highlights: ["Judy Garland Museum", "BWCA Entry Point", "Forest History Center", "Mississippi Headwaters"],
    nearbyAttractions: ["Itasca State Park", "Pokegama Lake", "Cohasset", "Deer River"]
  }
}

// Legacy coordinate lookup for backwards compatibility
const LOCATION_COORDS: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(LOCATION_DATA).map(([name, data]) => [name, data.coords])
)

export default function SimpleMap({ results, userLocation, mapCenter, mapZoom }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    const initializeMap = async () => {
      try {
        // Dynamic import of Leaflet
        const L = (await import('leaflet')).default
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        if (!isMounted || !mapRef.current) return

        // Clean up existing map
        if (leafletMapRef.current) {
          leafletMapRef.current.remove()
        }

        // Create the map
        const map = L.map(mapRef.current).setView(mapCenter, mapZoom)
        leafletMapRef.current = map

        // Add default OpenStreetMap tiles - natural, friendly colors for travel app
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        // Add custom CSS styling to integrate PrairieAster.Ai branding colors
        const mapContainer = map.getContainer()
        if (mapContainer) {
          const style = document.createElement('style')
          style.textContent = `
            .leaflet-control-zoom a {
              background-color: #7563A8 !important;
              color: white !important;
              border: 1px solid #8DA8CC !important;
            }
            .leaflet-control-zoom a:hover {
              background-color: #8DA8CC !important;
            }
            .leaflet-popup-content-wrapper {
              background-color: white;
              border: 2px solid #7563A8;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(117, 99, 168, 0.3);
            }
            .leaflet-popup-tip {
              background-color: white;
              border: 1px solid #7563A8;
            }
          `
          document.head.appendChild(style)
        }

        // Calculate bounds to fit all weather results
        if (results.length > 0) {
          const resultCoords = results
            .map(result => LOCATION_COORDS[result.locationName])
            .filter(coords => coords !== undefined)
          
          if (resultCoords.length > 0) {
            // Add user location to bounds calculation if available
            const allCoords = userLocation ? [userLocation, ...resultCoords] : resultCoords
            const group = L.featureGroup(allCoords.map(coords => L.marker(coords)))
            map.fitBounds(group.getBounds().pad(0.1)) // 10% padding around all markers
          }
        }

        // Add user location marker if available
        if (userLocation) {
          const userIcon = L.divIcon({
            html: '<div style="background-color: #8DA8CC; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(141, 168, 204, 0.4);"><div style="color: white; font-size: 10px;">📍</div></div>',
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 20]
          })
          
          const userMarker = L.marker(userLocation, { icon: userIcon }).addTo(map)
          userMarker.bindPopup('<div style="text-align: center; padding: 8px; color: #7563A8;"><strong>Your Location</strong><br>You are here</div>')
        }

        // Add weather result markers with animation
        results.forEach((result, index) => {
          const coords = LOCATION_COORDS[result.locationName]
          if (!coords) return

          const weatherIcon = L.divIcon({
            html: `<div class="marker-animate-in" style="background-color: rgba(255, 255, 255, 0.95); border: 2px solid #7563A8; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(117, 99, 168, 0.4); animation-delay: ${index * 200}ms;"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 100 100" style="margin: 0; padding: 0;"><g transform="scale(1.0) translate(0, 0)"><path d="M28.253,44.949l11.361,4.612c0.18,0.186,0.319,0.364,0.419,0.531c-0.098,0.161-0.233,0.331-0.406,0.51 c-1.852,0.76-6.214,2.555-11.21,4.615C21.709,56.358,13.063,55.739,5,50.169C12.99,44.572,21.564,43.868,28.253,44.949 L28.253,44.949z M13.497,76.581c9.402-0.161,16.575-4.323,21.379-8.94c2.726-4.366,5.342-8.541,7.158-11.469 c0.003-0.065,0.002-0.127,0-0.187c-0.185-0.112-0.433-0.202-0.742-0.265l-12.288,3.059C23.019,61.869,16.623,67.461,13.497,76.581 L13.497,76.581z M38.948,68.039l7.051-8.164c0.349-0.196,0.661-0.322,0.927-0.379c0.112,0.147,0.221,0.326,0.328,0.537 c0.237,3.191,0.543,7.536,0.87,12.121c-1.004,6.705-4.268,14.676-12,20.59C33.142,82.888,35.549,74.105,38.948,68.039L38.948,68.039 z M63.949,92.768c-8.004-5.984-11.32-14.153-12.297-20.947l0.988-11.924c0.12-0.208,0.244-0.378,0.369-0.507 c0.122,0.028,0.254,0.071,0.395,0.129l8.349,9.813C64.791,75.336,66.708,83.586,63.949,92.768L63.949,92.768z M64.106,66.492 c4.758,4.927,12.227,9.619,22.208,9.794c-3.219-9.143-9.739-14.699-15.789-17.738l-12.188-2.933 c-0.124,0.026-0.235,0.056-0.339,0.09c-0.048,0.273-0.033,0.626,0.047,1.047C59.305,58.767,61.574,62.411,64.106,66.492 L64.106,66.492z M95,49.9c-7.885,5.595-16.352,6.397-23.032,5.396c-5.098-2.071-9.697-3.931-11.901-4.816 c-0.142-0.159-0.253-0.311-0.336-0.455c0.079-0.137,0.185-0.281,0.319-0.432l12.034-4.902C78.737,43.68,87.144,44.434,95,49.9 L95,49.9z M70.341,41.568c6.09-3.034,12.7-8.652,15.909-17.947c-9.546,0.171-16.793,4.468-21.59,9.17l-6.897,11.141 c-0.004,0.078-0.004,0.151-0.003,0.221c0.194,0.114,0.455,0.205,0.781,0.267C61.045,43.806,65.462,42.741,70.341,41.568 L70.341,41.568z M63.844,7.232c2.875,9.443,0.81,17.891-2.359,23.936c-3.234,3.798-6.158,7.238-7.82,9.208 c-0.295,0.149-0.561,0.245-0.79,0.288c-0.094-0.119-0.187-0.261-0.277-0.425c-0.14-2.065-0.472-7.104-0.855-12.83 C52.85,20.766,56.189,12.999,63.844,7.232L63.844,7.232z M48.158,27.538l-0.966,12.7c-0.118,0.198-0.238,0.361-0.361,0.486 c-0.12-0.028-0.25-0.071-0.388-0.128c-1.292-1.541-4.601-5.508-8.368-10.012c-2.959-6.013-4.773-14.219-1.977-23.315 C43.774,13.082,47.089,20.893,48.158,27.538L48.158,27.538z M13.659,23.675c3.21,9.246,9.806,14.85,15.889,17.895 c5.43,1.321,10.127,2.467,11.896,2.901c0.137-0.026,0.259-0.059,0.372-0.095c0.048-0.281,0.028-0.646-0.056-1.08l-6.023-9.74 C31.012,28.622,23.593,23.917,13.659,23.675z" fill="#7563A8" fill-rule="evenodd" clip-rule="evenodd"/></g></svg></div>`,
            className: 'weather-location-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 36]
          })

          const marker = L.marker(coords, { icon: weatherIcon }).addTo(map)
          
          // Get enhanced location data
          const locationData = LOCATION_DATA[result.locationName]
          const [lat, lng] = coords
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
          
          const popupContent = `
            <div style="padding: 12px; min-width: 280px; font-family: system-ui, sans-serif; max-height: 400px; overflow-y: auto;">
              <!-- Header -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #7563A8; padding-bottom: 8px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #7563A8;">
                  ${result.locationName}
                </h3>
                <span style="background-color: #8DA8CC; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                  ${result.distance}
                </span>
              </div>
              
              <!-- Weather Info -->
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <div style="background-color: #F3F0FF; border: 1px solid #E0D4FD; border-radius: 6px; padding: 6px 8px; text-align: center; flex: 1;">
                  <div style="font-size: 14px; color: #7563A8; font-weight: 600;">${result.temperature}°F</div>
                  <div style="font-size: 9px; color: #8B5CF6;">Temperature</div>
                </div>
                <div style="background-color: #EEF4FF; border: 1px solid #C7D2FE; border-radius: 6px; padding: 6px 8px; text-align: center; flex: 1;">
                  <div style="font-size: 11px; color: #8DA8CC; font-weight: 500; text-transform: capitalize;">${result.precipitation}</div>
                  <div style="font-size: 9px; color: #6B7280;">Rain</div>
                </div>
                <div style="background-color: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 6px; padding: 6px 8px; text-align: center; flex: 1;">
                  <div style="font-size: 11px; color: #0EA5E9; font-weight: 500; text-transform: capitalize;">${result.wind}</div>
                  <div style="font-size: 9px; color: #6B7280;">Wind</div>
                </div>
              </div>

              <!-- Highlights -->
              ${locationData ? `
              <div style="margin-bottom: 10px;">
                <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #7563A8;">Must-See Attractions</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${locationData.highlights.map(highlight => 
                    `<span style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 2px 6px; font-size: 10px; color: #374151;">${highlight}</span>`
                  ).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Action Buttons -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
                <a href="${googleMapsUrl}" target="_blank" style="background-color: #7563A8; color: white; text-decoration: none; padding: 8px; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 500; display: block;">
                  🚗 Directions
                </a>
                ${locationData?.resources.exploreMN ? `
                <a href="${locationData.resources.exploreMN}" target="_blank" style="background-color: #8DA8CC; color: white; text-decoration: none; padding: 8px; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 500; display: block;">
                  🏞️ Explore MN
                </a>
                ` : `
                <div style="background-color: #F3F4F6; color: #9CA3AF; padding: 8px; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 500;">
                  More Info
                </div>
                `}
              </div>

              <!-- Additional Resources -->
              ${locationData ? `
              <div style="font-size: 10px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 8px;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${locationData.resources.dnr ? `<a href="${locationData.resources.dnr}" target="_blank" style="color: #059669; text-decoration: none;">🌲 State Parks</a>` : ''}
                  ${locationData.resources.nps ? `<a href="${locationData.resources.nps}" target="_blank" style="color: #D97706; text-decoration: none;">🏛️ National Parks</a>` : ''}
                </div>
                <div style="margin-top: 4px; font-size: 9px; color: #9CA3AF;">
                  Nearby: ${locationData.nearbyAttractions.slice(0, 3).join(', ')}
                </div>
              </div>
              ` : ''}
            </div>
          `
          
          marker.bindPopup(popupContent)
        })

      } catch (error) {
        console.error('Failed to initialize Leaflet map:', error)
        
        // Show error in the map container
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #fee2e2; border-radius: 1rem;">
              <div style="text-align: center; color: #dc2626;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                <div style="font-weight: 600;">Map Loading Error</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Unable to load interactive map</div>
              </div>
            </div>
          `
        }
      }
    }

    // Add a small delay to ensure DOM is ready
    const timeout = setTimeout(initializeMap, 100)

    return () => {
      isMounted = false
      clearTimeout(timeout)
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [results, userLocation, mapCenter, mapZoom])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full leaflet-container"
      style={{ minHeight: '384px', borderRadius: '1rem' }}
    />
  )
}