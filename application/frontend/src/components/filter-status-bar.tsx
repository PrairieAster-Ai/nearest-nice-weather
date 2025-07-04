"use client"

interface FilterStatusBarProps {
  temperature: string
  precipitation: string
  wind: string
}

const getFilterEmoji = (category: string, value: string) => {
  const emojiMap: Record<string, Record<string, string>> = {
    temperature: {
      coldest: "🧊",
      comfortable: "😌", 
      hottest: "🔥"
    },
    precipitation: {
      unlikely: "☀️",
      sporadic: "⛅",
      likely: "🌧️"
    },
    wind: {
      low: "🌱",
      medium: "🍃",
      high: "💨"
    }
  }
  return emojiMap[category]?.[value] || "❓"
}

const getFilterLabel = (category: string, value: string) => {
  const labelMap: Record<string, Record<string, string>> = {
    temperature: {
      coldest: "Cold",
      comfortable: "Nice", 
      hottest: "Hot"
    },
    precipitation: {
      unlikely: "Sunny",
      sporadic: "Mixed",
      likely: "Rainy"
    },
    wind: {
      low: "Calm",
      medium: "Breezy",
      high: "Windy"
    }
  }
  return labelMap[category]?.[value] || value
}

export function FilterStatusBar({ temperature, precipitation, wind }: FilterStatusBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-2 px-4 bg-purple-50 rounded-lg border border-purple-200">
      <div className="text-xs text-purple-600 font-medium">Looking for:</div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-sm">{getFilterEmoji('temperature', temperature)}</span>
          <span className="text-xs text-gray-700">{getFilterLabel('temperature', temperature)}</span>
        </div>
        
        <div className="w-px h-4 bg-purple-300"></div>
        
        <div className="flex items-center gap-1">
          <span className="text-sm">{getFilterEmoji('precipitation', precipitation)}</span>
          <span className="text-xs text-gray-700">{getFilterLabel('precipitation', precipitation)}</span>
        </div>
        
        <div className="w-px h-4 bg-purple-300"></div>
        
        <div className="flex items-center gap-1">
          <span className="text-sm">{getFilterEmoji('wind', wind)}</span>
          <span className="text-xs text-gray-700">{getFilterLabel('wind', wind)}</span>
        </div>
      </div>
    </div>
  )
}