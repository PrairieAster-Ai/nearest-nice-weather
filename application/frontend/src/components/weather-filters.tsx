"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, Grid3X3, List, Layers } from "lucide-react"
import { 
  ToggleButtonGroup, 
  ToggleButton, 
  Box, 
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip 
} from "@mui/material"
import { CompactFilterOption } from "@/components/compact-filter-option"
import { useDeviceBreakpoints } from "@/hooks/useDeviceBreakpoints"

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
  const [layoutMode, setLayoutMode] = useState<'grid' | 'compact' | 'vertical'>('grid')
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

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
    
    // ALWAYS trigger search for user feedback, even if same value
    if (onSearch) {
      // console.log('Filter changed:', category, '=', value, 'calling onSearch')
      onSearch(newFilters)
    }
  }

  // Handle clicking the same filter button to retrigger search
  const handleFilterClick = (category: keyof WeatherFilters, value: string) => {
    // console.log('Filter clicked:', category, '=', value)
    
    // If clicking the same value, still trigger search for animation
    if (filters[category] === value && onSearch) {
      // console.log('Same filter clicked, retriggering search for animation')
      onSearch(filters)
    } else {
      // Different value, use normal change handler
      handleFilterChange(category, value)
    }
  }

  const handleSearch = async () => {
    if (!isSearchEnabled) return
    
    setIsLoading(true)
    // console.log("Searching with filters:", filters)
    
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
    // console.log("Saving filters:", filters)
  }

  // Material Design ToggleButtonGroup component with responsive scaling
  const MaterialButtonGroup = ({ 
    category, 
    options 
  }: { 
    category: keyof WeatherFilters
    options: Array<{ value: string; emoji: string; label: string }>
  }) => {
    const theme = useTheme()
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
    
    // Static sizing to prevent hydration mismatches
    const buttonSize: 'small' | 'medium' | 'large' = 'small'
    const buttonPaddingX = 0.75
    const buttonPaddingY = 0.5
    const buttonGap = 0.5
    const borderRadius = '6px'
    const minButtonWidth = '44px'
    const minButtonHeight = '44px'
    
    return (
      <ToggleButtonGroup
        value={filters[category]}
        exclusive
        onChange={(event, newValue) => {
          if (newValue !== null) {
            handleFilterChange(category, newValue)
          }
        }}
        size={buttonSize}
        sx={{
          '& .MuiToggleButton-root': {
            border: '1px solid #8DA8CC', // PrairieAster Polo Blue
            borderRadius: 0,
            px: buttonPaddingX,
            py: buttonPaddingY,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#7563A8', // PrairieAster Deluge Purple
            backgroundColor: '#ffffff',
            minWidth: minButtonWidth,
            minHeight: minButtonHeight,
            transition: 'all 0.2s ease-in-out',
            // Touch optimization
            touchAction: 'manipulation',
            userSelect: 'none',
            '&:active': {
              transform: 'scale(0.98)',
            },
            '&:first-of-type': {
              borderTopLeftRadius: borderRadius,
              borderBottomLeftRadius: borderRadius,
            },
            '&:last-of-type': {
              borderTopRightRadius: borderRadius,
              borderBottomRightRadius: borderRadius,
            },
            '&:hover': {
              backgroundColor: '#F3F7FB', // Light blue tint
              color: '#614F94', // Darker purple
              borderColor: '#7493B8', // Darker blue
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(117, 99, 168, 0.2)',
            },
            '&.Mui-selected': {
              backgroundColor: '#7563A8', // PrairieAster Deluge Purple
              color: '#ffffff',
              borderColor: '#7563A8',
              boxShadow: '0 2px 8px rgba(117, 99, 168, 0.3)',
              '&:hover': {
                backgroundColor: '#614F94', // Darker purple on hover
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(117, 99, 168, 0.4)',
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
              gap: buttonGap,
              minWidth: 'auto',
              flexDirection: isSmall ? 'column' : 'row',
            }}
          >
            <span className="text-base leading-none">
              {option.emoji}
            </span>
            <span className="inline text-sm leading-tight text-center">
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
  const deviceBreakpoints = useDeviceBreakpoints()
  const {
    isIPhone14ProMaxPortrait,
    isIPhone14ProMaxLandscape,
    isIPadMiniPortrait,
    isIPadMiniLandscape,
    isIPadProPortrait,
    isIPadProLandscape,
    shouldUseCompactLayout,
    shouldUseGridLayout,
    shouldUseVerticalLayout
  } = deviceBreakpoints

  // Legacy breakpoints for fallback
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
  const isMedium = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true })

  // Auto-select best layout for specific devices (only after mount)
  useEffect(() => {
    if (!mounted) return
    
    // Determine the optimal layout mode based on device breakpoints
    const optimalLayoutMode = shouldUseCompactLayout ? 'compact' 
      : shouldUseVerticalLayout ? 'vertical' 
      : shouldUseGridLayout ? 'grid' 
      : layoutMode

    // Only update if the optimal mode is different from current
    if (optimalLayoutMode !== layoutMode) {
      setLayoutMode(optimalLayoutMode)
    }
  }, [mounted, shouldUseCompactLayout, shouldUseVerticalLayout, shouldUseGridLayout])

  // Compact layout renderer with device-specific sizing
  const renderCompactLayout = () => {
    const compactSize = isIPhone14ProMaxPortrait ? 'small' : 'medium'
    const compactGap = isIPhone14ProMaxPortrait ? 1 : 1.5
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: compactGap, width: '100%' }}>
        <CompactFilterOption
          label="Temperature"
          value={filters.temperature}
          options={temperatureOptions}
          onChange={(value) => handleFilterChange('temperature', value)}
          size={compactSize}
        />
        <CompactFilterOption
          label="Weather"
          value={filters.precipitation}
          options={precipitationOptions}
          onChange={(value) => handleFilterChange('precipitation', value)}
          size={compactSize}
        />
        <CompactFilterOption
          label="Wind"
          value={filters.wind}
          options={windOptions}
          onChange={(value) => handleFilterChange('wind', value)}
          size={compactSize}
        />
      </Box>
    )
  }

  // Vertical layout renderer (single column grid)
  const renderVerticalLayout = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <MaterialButtonGroup category="temperature" options={temperatureOptions} />
      <MaterialButtonGroup category="precipitation" options={precipitationOptions} />
      <MaterialButtonGroup category="wind" options={windOptions} />
    </Box>
  )

  // Grid layout renderer with device-specific layouts
  const renderGridLayout = () => {
    let gridColumns = 'repeat(3, 1fr)'
    let gridRows = 'auto'
    let gridGap = 1.5
    
    if (isIPhone14ProMaxPortrait) {
      gridColumns = '1fr'
      gridRows = 'repeat(3, auto)'
      gridGap = 0.75
    } else if (isIPhone14ProMaxLandscape) {
      gridColumns = 'repeat(3, 1fr)'
      gridRows = 'auto'
      gridGap = 1
    } else if (isIPadMiniPortrait) {
      gridColumns = '1fr'
      gridRows = 'repeat(3, auto)'
      gridGap = 1.25
    } else if (isIPadMiniLandscape || isIPadProLandscape) {
      gridColumns = 'repeat(3, 1fr)'
      gridRows = 'auto'
      gridGap = 1.5
    } else if (isIPadProPortrait) {
      gridColumns = 'repeat(2, 1fr)'
      gridRows = 'repeat(2, auto)'
      gridGap = 1.5
    }
    
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gridTemplateRows: gridRows,
          gap: gridGap,
          alignItems: 'stretch',
          justifyItems: 'stretch',
          width: '100%',
          '& > *': {
            display: 'flex',
            justifyContent: 'center',
          },
        }}
      >
        <MaterialButtonGroup category="temperature" options={temperatureOptions} />
        <MaterialButtonGroup category="precipitation" options={precipitationOptions} />
        <MaterialButtonGroup category="wind" options={windOptions} />
      </Box>
    )
  }

  // Show basic layout until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
          {/* Basic fallback layout */}
          <MaterialButtonGroup category="temperature" options={temperatureOptions} />
          <MaterialButtonGroup category="precipitation" options={precipitationOptions} />
          <MaterialButtonGroup category="wind" options={windOptions} />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isIPhone14ProMaxPortrait ? 0.75 : isIPhone14ProMaxLandscape ? 1 : isIPadMiniPortrait ? 1.25 : 1.5,
        width: '100%',
        maxWidth: isLarge ? '800px' : '100%',
        margin: '0 auto',
      }}
    >
      {/* Dynamic Layout Rendering */}
      {layoutMode === 'compact' && renderCompactLayout()}
      {layoutMode === 'vertical' && renderVerticalLayout()}
      {layoutMode === 'grid' && renderGridLayout()}

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