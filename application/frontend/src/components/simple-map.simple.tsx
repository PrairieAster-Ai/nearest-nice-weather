"use client"

import { useEffect, useRef } from 'react'
import { DEBUG } from '@/lib/debug'

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

const LOCATION_COORDS: Record<string, [number, number]> = {
  "Brainerd Lakes Area": [46.3581, -94.2003],
  "Duluth North Shore": [46.7867, -92.1005],
  "Grand Rapids": [47.2372, -93.5308]
}

export default function SimpleMap({ results, userLocation, mapCenter, mapZoom }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)

  useEffect(() => {
    const initializeMap = async () => {
      DEBUG.log('SimpleMap', 'initStart');
      
      try {
        const L = (await import('leaflet')).default
        DEBUG.log('SimpleMap', 'leafletLoaded');

        if (!mapRef.current) {
          DEBUG.error('SimpleMap', 'No map container');
          return
        }

        // Clear any existing map
        if (leafletMapRef.current) {
          leafletMapRef.current.remove()
          leafletMapRef.current = null
        }

        // Create map
        const map = L.map(mapRef.current).setView(mapCenter, mapZoom)
        leafletMapRef.current = map
        DEBUG.log('SimpleMap', 'mapCreated', { center: mapCenter, zoom: mapZoom });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map)
        DEBUG.log('SimpleMap', 'tilesAdded');

        // Force map to render
        setTimeout(() => {
          if (map) {
            map.invalidateSize()
            DEBUG.log('SimpleMap', 'sizeInvalidated');
          }
        }, 100)

        // Add weather result markers
        results.forEach((result) => {
          const coords = LOCATION_COORDS[result.locationName]
          if (!coords) return

          const marker = L.marker(coords).addTo(map)
          marker.bindPopup(`
            <div style="padding: 8px;">
              <strong>${result.locationName}</strong><br/>
              ${result.temperature}°F, ${result.precipitation} rain<br/>
              ${result.description}
            </div>
          `)
        })
        DEBUG.log('SimpleMap', 'markersAdded', { count: results.length });

      } catch (error) {
        DEBUG.error('SimpleMap', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const timeout = setTimeout(initializeMap, 100)
    return () => {
      clearTimeout(timeout)
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [results, mapCenter, mapZoom])

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '500px',
        borderRadius: '1rem'
      }}
    />
  )
}