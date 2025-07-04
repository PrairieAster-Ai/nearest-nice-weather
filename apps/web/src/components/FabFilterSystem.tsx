import { useState } from 'react'
import { 
  Fab, 
  Box, 
  Tooltip,
  Slide,
  Fade
} from '@mui/material'

interface WeatherFilters {
  temperature: string
  precipitation: string
  wind: string
}

interface FabFilterSystemProps {
  filters: WeatherFilters
  onFilterChange: (category: keyof WeatherFilters, value: string) => void
}

export function FabFilterSystem({ filters, onFilterChange }: FabFilterSystemProps) {
  const [openCategory, setOpenCategory] = useState<keyof WeatherFilters | null>(null)

  // Filter configurations matching the screenshot
  const filterConfigs = {
    temperature: {
      icon: '🌡️',
      label: 'Temperature',
      options: [
        { value: 'cold', icon: '🥶', label: 'Cold' },
        { value: 'mild', icon: '😊', label: 'Mild' },
        { value: 'hot', icon: '🥵', label: 'Hot' }
      ]
    },
    precipitation: {
      icon: '🌧️', 
      label: 'Precipitation',
      options: [
        { value: 'none', icon: '☀️', label: 'None' },
        { value: 'light', icon: '🌦️', label: 'Light' },
        { value: 'heavy', icon: '🌧️', label: 'Heavy' }
      ]
    },
    wind: {
      icon: '💨',
      label: 'Wind',
      options: [
        { value: 'calm', icon: '🌱', label: 'Calm' },
        { value: 'breezy', icon: '🍃', label: 'Breezy' },
        { value: 'windy', icon: '💨', label: 'Windy' }
      ]
    }
  }

  const handleCategoryClick = (category: keyof WeatherFilters) => {
    setOpenCategory(openCategory === category ? null : category)
  }

  const handleOptionSelect = (category: keyof WeatherFilters, value: string) => {
    onFilterChange(category, value)
    setOpenCategory(null)
  }

  return (
    <Box className="flex flex-col space-y-3">
      {/* Main Filter Categories */}
      {(Object.keys(filterConfigs) as Array<keyof WeatherFilters>).map((category) => {
        const config = filterConfigs[category]
        const isSelected = filters[category] !== ''
        const isOpen = openCategory === category
        const selectedOption = config.options.find(opt => opt.value === filters[category])

        return (
          <Box key={category} className="relative">
            <Tooltip title={config.label} placement="right">
              <Fab
                size="large"
                onClick={() => handleCategoryClick(category)}
                sx={{
                  backgroundColor: isSelected ? '#7563A8' : 'white',
                  color: isSelected ? 'white' : '#333',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: isSelected ? '#6B5B95' : '#f5f5f5',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                  border: isOpen ? '2px solid #7563A8' : 'none',
                }}
              >
                <span className="text-2xl">
                  {isSelected ? selectedOption?.icon : config.icon}
                </span>
              </Fab>
            </Tooltip>

            {/* Option Selection Menu */}
            <Slide 
              direction="left" 
              in={isOpen} 
              mountOnEnter 
              unmountOnExit
              timeout={250}
            >
              <Box 
                className="absolute right-full top-0 mr-4 flex space-x-2"
                sx={{ zIndex: 1001 }}
              >
                {config.options.map((option, index) => (
                  <Fade 
                    key={option.value}
                    in={isOpen}
                    timeout={250 + (index * 50)}
                  >
                    <Box>
                      <Tooltip title={option.label} placement="top">
                        <Fab
                          size="medium"
                          onClick={() => handleOptionSelect(category, option.value)}
                          sx={{
                            backgroundColor: filters[category] === option.value ? '#7563A8' : 'white',
                            color: filters[category] === option.value ? 'white' : '#333',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': {
                              backgroundColor: filters[category] === option.value ? '#6B5B95' : '#f0f0f0',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span className="text-lg">{option.icon}</span>
                        </Fab>
                      </Tooltip>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Slide>
          </Box>
        )
      })}

    </Box>
  )
}