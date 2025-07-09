import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

interface MapControllerProps {
  center: [number, number]
  zoom: number
}

export function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (map && center) {
      map.flyTo(center, zoom)
    }
  }, [map, center, zoom])

  return null
}