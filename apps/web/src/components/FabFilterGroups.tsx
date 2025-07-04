import { useState, useEffect } from 'react'
import { 
  Fab, 
  Box,
  Tooltip,
  useTheme,
  useMediaQuery,
  Slide,
  Fade 
} from '@mui/material'

interface WeatherFilters {
  temperature: string
  precipitation: string
  wind: string
}

interface FabFilterGroupsProps {
  filters: WeatherFilters
  onFilterChange: (category: keyof WeatherFilters, value: string) => void
}

export function FabFilterGroups({ filters, onFilterChange }: FabFilterGroupsProps) {
  const [openCategory, setOpenCategory] = useState<keyof WeatherFilters | null>(null)
  const [mounted, setMounted] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })

  // Prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter option definitions matching original MVP
  const filterOptions = {
    temperature: [
      { value: "coldest", emoji: "🧊", label: "Cold" },
      { value: "comfortable", emoji: "😌", label: "Nice" },
      { value: "hottest", emoji: "🔥", label: "Hot" }
    ],
    precipitation: [
      { value: "unlikely", emoji: "☀️", label: "Sunny" },
      { value: "sporadic", emoji: "⛅", label: "Mixed" },
      { value: "likely", emoji: "🌧️", label: "Rainy" }
    ],
    wind: [
      { value: "low", emoji: "🌱", label: "Calm" },
      { value: "medium", emoji: "🍃", label: "Breezy" },
      { value: "high", emoji: "💨", label: "Windy" }
    ]
  }

  // Main category buttons with emojis
  const categoryButtons = {
    temperature: { emoji: "🌡️", label: "Temperature" },
    precipitation: { emoji: "🌧️", label: "Precipitation" },
    wind: { emoji: "💨", label: "Wind" }
  }

  const handleCategoryToggle = (category: keyof WeatherFilters) => {
    setOpenCategory(openCategory === category ? null : category)
  }

  const handleOptionSelect = (category: keyof WeatherFilters, value: string) => {
    onFilterChange(category, value)
    setOpenCategory(null)
  }

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <Box className="relative">
      {/* Category Filter Buttons */}
      <Box className="flex flex-col space-y-3">
        {(Object.keys(categoryButtons) as Array<keyof WeatherFilters>).map((category) => {
          const isSelected = filters[category] !== ""
          const isOpen = openCategory === category
          
          return (
            <Box key={category} className="relative">
              <Tooltip title={categoryButtons[category].label} placement="right">
                <Fab
                  size={isMobile ? "medium" : "large"}
                  color={isSelected ? "primary" : "default"}
                  onClick={() => handleCategoryToggle(category)}
                  className={`transition-all duration-300 ${
                    isOpen ? 'scale-110 shadow-lg' : ''
                  } ${isSelected ? 'ring-2 ring-purple-300' : ''}`}
                  sx={{
                    backgroundColor: isSelected ? theme.palette.primary.main : 'white',
                    color: isSelected ? 'white' : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isSelected 
                        ? theme.palette.primary.dark 
                        : theme.palette.grey[100],
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <span className="text-xl">
                    {isSelected 
                      ? filterOptions[category].find(opt => opt.value === filters[category])?.emoji
                      : categoryButtons[category].emoji
                    }
                  </span>
                </Fab>
              </Tooltip>

              {/* Option Selection Menu */}
              <Slide 
                direction="right" 
                in={isOpen} 
                mountOnEnter 
                unmountOnExit
                timeout={300}
              >
                <Box 
                  className="absolute left-full top-0 ml-4 flex space-x-2"
                  sx={{ zIndex: theme.zIndex.fab + 1 }}
                >
                  {filterOptions[category].map((option, index) => (
                    <Fade 
                      key={option.value}
                      in={isOpen}
                      timeout={300 + (index * 100)}
                    >
                      <Box>
                        <Tooltip title={option.label} placement="top">
                          <Fab
                            size="small"
                            onClick={() => handleOptionSelect(category, option.value)}
                            className="transition-all duration-200 hover:scale-110"
                            sx={{
                              backgroundColor: filters[category] === option.value 
                                ? theme.palette.primary.main 
                                : 'white',
                              color: filters[category] === option.value 
                                ? 'white' 
                                : theme.palette.text.primary,
                              '&:hover': {
                                backgroundColor: filters[category] === option.value 
                                  ? theme.palette.primary.dark 
                                  : theme.palette.grey[100],
                              },
                            }}
                          >
                            <span className="text-lg">{option.emoji}</span>
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

      {/* Clear All Button */}
      {Object.values(filters).some(filter => filter !== "") && (
        <Fade in={true} timeout={500}>
          <Box className="mt-4">
            <Tooltip title="Clear All Filters" placement="right">
              <Fab
                size="small"
                onClick={() => {
                  onFilterChange('temperature', '')
                  onFilterChange('precipitation', '')
                  onFilterChange('wind', '')
                  setOpenCategory(null)
                }}
                sx={{
                  backgroundColor: theme.palette.grey[300],
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: theme.palette.grey[400],
                  },
                }}
              >
                <span className="text-sm">✕</span>
              </Fab>
            </Tooltip>
          </Box>
        </Fade>
      )}
    </Box>
  )
}