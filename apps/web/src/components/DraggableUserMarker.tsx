import { useEffect, useRef } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Create user location marker as heart shape (same size as result markers)
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Simple Cool Face -->
      
      <!-- Face circle in brand color -->
      <circle cx="20" cy="20" r="18" fill="#7563A8" stroke="#fff" stroke-width="2"/>
      
      <!-- Oversized Aviator Sunglasses -->
      <!-- Left aviator lens (teardrop shape) -->
      <path d="M4 18 Q4 10 14 10 Q21 10 21 18 Q21 24 14 26 Q6 24 4 18 Z" fill="#000" stroke="#333" stroke-width="0.5"/>
      <!-- Right aviator lens (teardrop shape) -->  
      <path d="M19 18 Q19 10 28 10 Q36 10 36 18 Q36 24 28 26 Q21 24 19 18 Z" fill="#000" stroke="#333" stroke-width="0.5"/>
      
      <!-- Bridge between lenses -->
      <rect x="19" y="16" width="2" height="2" fill="#333" rx="1"/>
      
      <!-- Aviator reflections -->
      <ellipse cx="10" cy="14" rx="2" ry="3" fill="#666" opacity="0.7"/>
      <ellipse cx="29" cy="14" rx="2" ry="3" fill="#666" opacity="0.7"/>
      
      <!-- Lens highlights -->
      <ellipse cx="8" cy="12" rx="1" ry="1.5" fill="#999" opacity="0.5"/>
      <ellipse cx="31" cy="12" rx="1" ry="1.5" fill="#999" opacity="0.5"/>
      
      <!-- Cool smile -->
      <path d="M14 26 Q20 30 26 26" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
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
  const map = useMap()

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
      icon={userIcon}
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