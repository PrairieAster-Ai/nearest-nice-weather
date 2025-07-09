import { useEffect, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Create user location marker using standard sunglasses emoji
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" fill="white" stroke="#ddd" stroke-width="1"/>
      <text x="20" y="28" text-anchor="middle" font-size="24" font-family="Arial, sans-serif">😎</text>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
})

interface DraggableUserMarkerProps {
  position: [number, number]
  onLocationChange: (newPosition: [number, number]) => void
}

export function DraggableUserMarker({ position, onLocationChange }: DraggableUserMarkerProps) {
  const markerRef = useRef<L.Marker>(null)

  useEffect(() => {
    const marker = markerRef.current
    if (marker) {
      const handleDragEnd = () => {
        const newPosition = marker.getLatLng()
        const newPos: [number, number] = [newPosition.lat, newPosition.lng]
        onLocationChange(newPos)
      }

      marker.on('dragend', handleDragEnd)
      
      return () => {
        marker.off('dragend', handleDragEnd)
      }
    }
  }, [onLocationChange])

  return (
    <Marker
      ref={markerRef}
      position={position}
      {...({ icon: userIcon } as any)}
      draggable={true}
    >
      <Popup>
        <div className="text-center p-2">
          <div className="text-sm font-bold text-gray-800 mb-1">Our best guess at your location</div>
          <div className="text-xs text-gray-600">Drag and drop for more accuracy</div>
        </div>
      </Popup>
    </Marker>
  )
}