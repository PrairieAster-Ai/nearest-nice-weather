/**
 * ========================================================================
 * FAB FILTER SYSTEM - WEATHER PREFERENCE INTERFACE
 * ========================================================================
 * 
 * 📋 PURPOSE: Floating action button interface for weather filtering preferences
 * 🔗 CONNECTS TO: App.tsx (main container), FilterManager hook (state logic)
 * 📊 DATA FLOW: User clicks → instant UI feedback → debounced filter update → POI refresh
 * ⚙️ STATE: filters (current), isLoading (feedback), resultCounts (badges)
 * 🎯 USER IMPACT: Immediate visual feedback for weather preference changes
 * 
 * BUSINESS CONTEXT: Core UX for Minnesota outdoor recreation weather optimization
 * - Enables users to find POIs matching their weather comfort preferences  
 * - Instant gratification UI with <100ms feedback for biological UX optimization
 * - Result count badges provide confidence in filter effectiveness
 * 
 * TECHNICAL IMPLEMENTATION: Material-UI FAB with animated slide-out options
 * - Debounced filtering prevents API thrashing during rapid user interactions
 * - Optimistic UI updates provide instant feedback before API completion
 * - Result count integration shows available POIs for each filter option
 * 
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - FAB pattern chosen for mobile-first outdoor use case (thumb-friendly)
 * - Slide-out animation for premium app feel without complexity
 * - Badge system for decision confidence (shows available results)
 * 
 * @CLAUDE_CONTEXT: Primary filter interface for weather-based POI discovery
 * @BUSINESS_RULE: P0 MUST provide instant visual feedback for user engagement
 * @INTEGRATION_POINT: FilterManager hook for debounced state management
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json for testable thresholds
 * 
 * 📚 BUSINESS CONTEXT BREADCRUMBS:
 * Minnesota outdoor recreation → weather optimization → filter preferences → POI discovery
 * USER JOURNEY: Location detection → weather preferences → filtered results → POI selection
 * VALUE CHAIN: User comfort preferences → weather matching → outdoor activity recommendations
 * 
 * LAST UPDATED: 2025-08-08
 */

import React, { useState, useMemo, useCallback } from 'react'
import { 
  Fab, 
  Box, 
  Tooltip,
  Slide,
  Fade,
  CircularProgress,
  Chip,
  Typography
} from '@mui/material'

// 🔗 INTEGRATION: Works with FilterManager.tsx for weather preference state logic
// 🔗 INTEGRATION: Consumed by App.tsx as primary filter interface
// 🔗 SEE ALSO: LocationManager.tsx for user positioning context

interface WeatherFilters {
  temperature: string
  precipitation: string
  wind: string
}

interface FabFilterSystemProps {
  filters: WeatherFilters
  onFilterChange: (category: keyof WeatherFilters, value: string) => void
  isLoading?: boolean // Optional loading state for instant feedback
  resultCounts?: { [key: string]: number } // Optional POI counts for each filter option
  totalPOIs?: number // Total number of POIs available
}

export function FabFilterSystem({ filters, onFilterChange, isLoading = false, resultCounts = {}, totalPOIs = 0 }: FabFilterSystemProps) {
  const [openCategory, setOpenCategory] = useState<keyof WeatherFilters | null>(null)

  // Memoized filter configurations for performance
  const filterConfigs = useMemo(() => ({
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
  }), [])

  const handleCategoryClick = useCallback((category: keyof WeatherFilters) => {
    setOpenCategory(openCategory === category ? null : category)
  }, [openCategory])

  // Optimized filter selection with instant UI feedback
  const handleOptionSelect = useCallback((category: keyof WeatherFilters, value: string) => {
    // Instant UI feedback - close flyout immediately
    setOpenCategory(null)
    
    // Trigger filter change (this may be debounced in parent)
    onFilterChange(category, value)
  }, [onFilterChange])

  return (
    <Box className="flex flex-col space-y-3">
      {/* Main Filter Categories */}
      {(Object.keys(filterConfigs) as Array<keyof WeatherFilters>).map((category) => {
        const config = filterConfigs[category]
        const isSelected = Boolean(filters[category] && filters[category].length > 0)
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
                  transition: 'all 0.1s ease', // Ultra-fast transitions for instant gratification
                  border: isOpen ? '2px solid #7563A8' : 'none',
                  opacity: isLoading ? 0.7 : 1, // Visual loading feedback
                  position: 'relative', // For loading indicator positioning
                  // Subtle pulse animation when loading
                  animation: isLoading ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress 
                    size={24} 
                    sx={{ 
                      color: isSelected ? 'white' : '#7563A8',
                      position: 'absolute'
                    }} 
                  />
                ) : (
                  <span className="text-2xl">
                    {isSelected ? selectedOption?.icon : config.icon}
                  </span>
                )}
                
                {/* Result count badge - always show if we have data */}
                {!isLoading && (
                  <Chip
                    size="small"
                    label={isSelected ? '✓' : (totalPOIs || '0')}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: isSelected ? '#4CAF50' : '#2196F3',
                      color: 'white',
                      fontSize: '0.65rem',
                      height: '20px',
                      minWidth: '20px',
                      '& .MuiChip-label': {
                        padding: '0 6px'
                      }
                    }}
                  />
                )}
              </Fab>
            </Tooltip>

            {/* Option Selection Menu */}
            <Slide 
              direction="left" 
              in={isOpen} 
              mountOnEnter 
              unmountOnExit
              timeout={100} // Ultra-fast animation for instant gratification
            >
              <Box 
                className="absolute right-full top-0 mr-4 flex space-x-2"
                sx={{ zIndex: 1001 }}
              >
                {config.options.map((option, index) => (
                  <Fade 
                    key={option.value}
                    in={isOpen}
                    timeout={100 + (index * 15)} // Ultra-fast staggered animation
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
                            transition: 'all 0.1s ease', // Ultra-fast transitions for instant gratification
                            position: 'relative', // For selection indicator
                          }}
                        >
                          <span className="text-lg">{option.icon}</span>
                          
                          {/* Active option indicator with result count */}
                          {filters[category] === option.value && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -2,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#4CAF50',
                                boxShadow: '0 0 6px rgba(76, 175, 80, 0.6)'
                              }}
                            />
                          )}
                          
                          {/* Result count badge for option - show count or ? */}
                          <Chip
                            size="small"
                            label={resultCounts[`${category}_${option.value}`] || '?'}
                            sx={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              backgroundColor: 'rgba(33, 150, 243, 0.9)',
                              color: 'white',
                              fontSize: '0.6rem',
                              height: '16px',
                              minWidth: '16px',
                              '& .MuiChip-label': {
                                padding: '0 4px'
                              }
                            }}
                          />
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