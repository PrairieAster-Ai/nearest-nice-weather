"use client"

import { useState, useEffect } from "react"
import { 
  Fab, 
  Box,
  Tooltip,
  useTheme,
  useMediaQuery 
} from "@mui/material"

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

  // Filter option definitions
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

  // Get current active option for display
  const getActiveOption = (category: keyof WeatherFilters) => {
    const currentValue = filters[category]
    return filterOptions[category].find(option => option.value === currentValue)
  }

  // Position configurations for different categories
  // Temperature aligned with zoom controls height (adjusted for 90px header)
  // Precipitation and wind stacked below
  const fabPositions = {
    temperature: { 
      top: isMobile ? 10 : 10, 
      right: isMobile ? 16 : 24 
    },
    precipitation: { 
      top: isMobile ? 74 : 84, 
      right: isMobile ? 16 : 24 
    },
    wind: { 
      top: isMobile ? 138 : 158, 
      right: isMobile ? 16 : 24 
    }
  }

  const handleCategoryToggle = (category: keyof WeatherFilters) => {
    setOpenCategory(openCategory === category ? null : category)
  }

  const handleOptionSelect = (category: keyof WeatherFilters, value: string) => {
    onFilterChange(category, value)
    setOpenCategory(null) // Close after selection
  }

  const renderFabGroup = (category: keyof WeatherFilters) => {
    const isOpen = openCategory === category
    const activeOption = getActiveOption(category)
    const options = filterOptions[category]
    const position = fabPositions[category]

    return (
      <Box key={category}>
        {/* Main Category FAB */}
        <Fab
          size={isMobile ? "medium" : "large"}
          onClick={() => handleCategoryToggle(category)}
          sx={{
            position: 'absolute',
            top: position.top,
            right: position.right,
            zIndex: 1000,
            backgroundColor: activeOption ? '#7563A8' : '#ffffff',
            color: activeOption ? '#ffffff' : '#7563A8',
            border: `2px solid ${activeOption ? '#7563A8' : '#8DA8CC'}`,
            '&:hover': {
              backgroundColor: activeOption ? '#614F94' : '#F3F7FB',
              borderColor: '#7563A8',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {isOpen ? (
            <Box sx={{ fontSize: { xs: '16px', md: '20px' } }}>✕</Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ fontSize: { xs: '16px', md: '20px' } }}>
                {activeOption?.emoji || '🔽'}
              </Box>
              {!isMobile && (
                <Box sx={{ fontSize: '10px', textTransform: 'capitalize' }}>
                  {category === 'temperature' ? 'Temp' : category === 'precipitation' ? 'Rain' : category}
                </Box>
              )}
            </Box>
          )}
        </Fab>

        {/* Option FABs - appear when category is open, expanding to the left */}
        {isOpen && options.map((option, index) => (
          <Tooltip key={option.value} title={option.label} placement="top">
            <Fab
              size="small"
              onClick={() => handleOptionSelect(category, option.value)}
              sx={{
                position: 'absolute',
                top: position.top,
                right: position.right + (index + 1) * (isMobile ? 60 : 70),
                zIndex: 999,
                backgroundColor: filters[category] === option.value ? '#7563A8' : '#ffffff',
                color: filters[category] === option.value ? '#ffffff' : '#7563A8',
                border: `2px solid ${filters[category] === option.value ? '#7563A8' : '#8DA8CC'}`,
                '&:hover': {
                  backgroundColor: filters[category] === option.value ? '#614F94' : '#F3F7FB',
                  borderColor: '#7563A8',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
                animation: `fadeInUp 0.2s ease-out ${index * 0.1}s both`,
                '@keyframes fadeInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ fontSize: '14px' }}>{option.emoji}</Box>
              </Box>
            </Fab>
          </Tooltip>
        ))}
      </Box>
    )
  }

  // Don't render until mounted to prevent hydration mismatches
  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Render FAB groups for each filter category */}
      {renderFabGroup('temperature')}
      {renderFabGroup('precipitation')}  
      {renderFabGroup('wind')}

      {/* Backdrop when any category is open */}
      {openCategory && (
        <Box
          onClick={() => setOpenCategory(null)}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 998,
          }}
        />
      )}
    </>
  )
}