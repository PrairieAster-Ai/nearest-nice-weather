"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { 
  ToggleButtonGroup, 
  ToggleButton, 
  Box, 
  Typography,
  useTheme,
  useMediaQuery 
} from "@mui/material"

interface WeatherFilters {
  temperature: string
  precipitation: string
  wind: string
}

interface WeatherFiltersProps {
  onSearch?: (filters: WeatherFilters) => void
}

export function WeatherFiltersComponent({ onSearch }: WeatherFiltersProps) {
  const [filters, setFilters] = useState<WeatherFilters>({
    temperature: "comfortable",
    precipitation: "unlikely", 
    wind: "low"
  })

  const [isLoading, setIsLoading] = useState(false)

  const isSearchEnabled = Object.values(filters).every(Boolean)

  // Trigger search on initial load with default values
  useEffect(() => {
    if (isSearchEnabled && onSearch) {
      onSearch(filters)
    }
  }, []) // Empty dependency array for initial load only

  const handleFilterChange = (category: keyof WeatherFilters, value: string) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    
    // Auto-search when filter changes
    if (onSearch) {
      onSearch(newFilters)
    }
  }

  const handleSearch = async () => {
    if (!isSearchEnabled) return
    
    setIsLoading(true)
    console.log("Searching with filters:", filters)
    
    // Call parent search handler if provided
    if (onSearch) {
      onSearch(filters)
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  const handleSaveFilters = () => {
    // TODO: Implement save functionality
    console.log("Saving filters:", filters)
  }

  // Material Design ToggleButtonGroup component
  const MaterialButtonGroup = ({ 
    category, 
    options 
  }: { 
    category: keyof WeatherFilters
    options: Array<{ value: string; emoji: string; label: string }>
  }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    
    return (
      <ToggleButtonGroup
        value={filters[category]}
        exclusive
        onChange={(event, newValue) => {
          if (newValue !== null) {
            handleFilterChange(category, newValue)
          }
        }}
        size={isMobile ? "medium" : "large"}
        sx={{
          '& .MuiToggleButton-root': {
            border: '1px solid #8DA8CC', // PrairieAster Polo Blue
            borderRadius: 0,
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1.5,
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 500,
            color: '#7563A8', // PrairieAster Deluge Purple
            backgroundColor: '#ffffff',
            '&:first-of-type': {
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
            },
            '&:last-of-type': {
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
            },
            '&:hover': {
              backgroundColor: '#F3F7FB', // Light blue tint
              color: '#614F94', // Darker purple
              borderColor: '#7493B8', // Darker blue
            },
            '&.Mui-selected': {
              backgroundColor: '#7563A8', // PrairieAster Deluge Purple
              color: '#ffffff',
              borderColor: '#7563A8',
              '&:hover': {
                backgroundColor: '#614F94', // Darker purple on hover
              },
            },
          },
        }}
      >
        {options.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 1 : 1.5,
              minWidth: 'auto',
            }}
          >
            <span style={{ fontSize: isMobile ? '1rem' : '1.125rem' }}>
              {option.emoji}
            </span>
            <span style={{ display: isMobile ? 'none' : 'inline' }}>
              {option.label}
            </span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    )
  }

  const temperatureOptions = [
    { value: "coldest", emoji: "🧊", label: "Cold" },
    { value: "comfortable", emoji: "😌", label: "Nice" },
    { value: "hottest", emoji: "🔥", label: "Hot" }
  ]

  const precipitationOptions = [
    { value: "unlikely", emoji: "☀️", label: "Sunny" },
    { value: "sporadic", emoji: "⛅", label: "Mixed" },
    { value: "likely", emoji: "🌧️", label: "Rainy" }
  ]

  const windOptions = [
    { value: "low", emoji: "🌱", label: "Calm" },
    { value: "medium", emoji: "🍃", label: "Breezy" },
    { value: "high", emoji: "💨", label: "Windy" }
  ]

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 3 : 4,
      }}
    >
      {/* Filter Groups Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 3 : 4,
          alignItems: isMobile ? 'stretch' : 'center',
        }}
      >
        {/* Temperature Button Group */}
        <MaterialButtonGroup category="temperature" options={temperatureOptions} />

        {/* Precipitation Button Group */}
        <MaterialButtonGroup category="precipitation" options={precipitationOptions} />

        {/* Wind Button Group */}
        <MaterialButtonGroup category="wind" options={windOptions} />
      </Box>

      {/* Auto-search status indicator */}
      {isLoading && (
        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <div className="loading-spinner" />
          <span className="text-sm text-gray-600">Finding...</span>
        </Box>
      )}
    </Box>
  )
}