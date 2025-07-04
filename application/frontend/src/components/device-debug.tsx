"use client"

import { useState, useEffect } from "react"
import { useDeviceBreakpoints } from "@/hooks/useDeviceBreakpoints"

export function DeviceDebug() {
  const deviceInfo = useDeviceBreakpoints()
  const [dimensions, setDimensions] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  useEffect(() => {
    setMounted(true)
    const updateDimensions = () => {
      setDimensions(`${window.innerWidth}x${window.innerHeight}`)
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  if (!mounted) {
    return null
  }
  
  const activeDevice = mounted ? Object.entries(deviceInfo)
    .filter(([key, value]) => value === true && key.startsWith('is'))
    .map(([key]) => key.replace('is', ''))
    .join(', ') : 'Loading...'
  
  const layoutType = mounted ? 
    (deviceInfo.shouldUseCompactLayout ? 'Compact' : 
     deviceInfo.shouldUseVerticalLayout ? 'Vertical' : 
     deviceInfo.shouldUseGridLayout ? 'Grid' : 'Auto') : 'Loading...'
  
  return (
    <div className="fixed bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-50 max-w-xs">
      <div className="font-bold">Device Detection:</div>
      <div>{activeDevice || 'Unknown'}</div>
      <div className="text-green-300">
        Layout: {layoutType}
      </div>
      <div className="text-xs opacity-75 mt-1">
        {dimensions}
      </div>
    </div>
  )
}