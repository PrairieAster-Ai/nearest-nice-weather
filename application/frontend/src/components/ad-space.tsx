"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface AdSpaceProps {
  size?: 'header' | 'sidebar' | 'banner'
  className?: string
}

export function AdSpace({ size = 'header', className = '' }: AdSpaceProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  if (!isVisible) return null

  // Standard ad sizes based on IAB (Interactive Advertising Bureau) guidelines
  const sizeConfig = {
    header: {
      width: 'w-72', // 288px - Standard leaderboard width (728px scaled for mobile)
      height: 'h-14', // 56px - Ultra-compact leaderboard height for maximum density
      fontSize: 'text-xs',
      padding: 'px-2 py-1'
    },
    sidebar: {
      width: 'w-full max-w-xs',
      height: 'h-24 sm:h-32',
      fontSize: 'text-sm',
      padding: 'p-3'
    },
    banner: {
      width: 'w-full',
      height: 'h-16 sm:h-20',
      fontSize: 'text-sm',
      padding: 'p-4'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className={`
      ${config.width} ${config.height} ${config.padding}
      bg-gradient-to-r from-blue-50 to-purple-50 
      border border-blue-200 rounded-lg 
      flex items-center justify-center 
      relative group hover:shadow-sm transition-all duration-200
      ${className}
    `}>
      {/* Close button for demo purposes */}
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-1 right-1 w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Close ad"
      >
        <X className="w-2 h-2 text-gray-600" />
      </button>

      {/* Ad content */}
      <div className="text-center">
        <div className={`${config.fontSize} font-medium text-gray-600 mb-1`}>
          {size === 'header' ? 'Advertisement' : 'Advertisement'}
        </div>
        <div className="text-xs text-gray-500">
          {size === 'header' ? '288 × 80 standard ad space' : 'Revenue space for MVP'}
        </div>
      </div>

      {/* Revenue indicator for development */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-b-lg opacity-30"></div>
    </div>
  )
}