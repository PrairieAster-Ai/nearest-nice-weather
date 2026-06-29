/**
 * ========================================================================
 * FAB FILTER SYSTEM - WEATHER PREFERENCE INTERFACE
 * ========================================================================
 *
 * 📋 PURPOSE: Floating action button interface showing SELECTED weather preferences
 * 🔗 CONNECTS TO: App.tsx (main container), FilterManager hook (state logic)
 * 📊 DATA FLOW: User clicks FAB → slide-out options → selection → instant UI update → debounced filter → POI refresh
 * ⚙️ STATE: filters (current selections), isLoading (feedback)
 * 🎯 USER IMPACT: Immediate visual feedback for weather preference changes
 *
 * DISPLAY PATTERN: FABs show CURRENT SELECTIONS, not category icons
 * - Temperature FAB shows: 😊 (mild), 🥶 (cold), or 🥵 (hot)
 * - Precipitation FAB shows: ☀️ (none), 🌦️ (light), or 🌧️ (heavy)
 * - Wind FAB shows: 🌱 (calm), 🍃 (breezy), or 💨 (windy)
 * - Clicking opens slide-out with all 3 options for that category
 *
 * BUSINESS CONTEXT: Core UX for Minnesota outdoor recreation weather optimization
 * - Enables users to find POIs matching their weather comfort preferences
 * - Instant gratification UI with <100ms feedback for biological UX optimization
 * - Clean interface focused on preference selection
 *
 * TECHNICAL IMPLEMENTATION: Material-UI FAB with animated slide-out options
 * - Debounced filtering prevents API thrashing during rapid user interactions
 * - Optimistic UI updates provide instant feedback before API completion
 * - Streamlined UI focused on preference selection
 *
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - FAB pattern chosen for mobile-first outdoor use case (thumb-friendly)
 * - Selected preference display eliminates cognitive load (user sees current state)
 * - Slide-out animation for premium app feel without complexity
 * - Clean aesthetic for focused user experience
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

import { useState, useMemo, useCallback } from 'react'
import {
  Fab,
  Box,
  Tooltip,
  Slide,
  Fade,
  CircularProgress
} from '@mui/material'

// 🔗 INTEGRATION: Works with FilterManager.tsx for weather preference state logic
// 🔗 INTEGRATION: Consumed by App.tsx as primary filter interface
// 🔗 SEE ALSO: LocationManager.tsx for user positioning context

/** The user's current weather preference selection, one bucket per axis. */
interface WeatherFilters {
  /** Temperature bucket: `'cold' | 'mild' | 'hot'`. */
  temperature: string
  /** Precipitation bucket: `'none' | 'light' | 'heavy'`. */
  precipitation: string
  /** Wind bucket: `'calm' | 'breezy' | 'windy'`. */
  wind: string
}

/** Props for {@link FabFilterSystem}. */
interface FabFilterSystemProps {
  /** Current selections; each FAB renders the glyph for its selected value. */
  filters: WeatherFilters
  /** Called when the user picks an option from a category's slide-out. */
  onFilterChange: (category: keyof WeatherFilters, value: string) => void
  /** Shows a spinner overlay for instant feedback while filtering is in flight. */
  isLoading?: boolean
}

/**
 * Floating-action-button cluster for weather preferences. Each FAB shows the
 * user's *current* selection (e.g. 😊 mild, ☀️ none, 🌱 calm) and, when tapped,
 * slides out the three options for that axis. Optimised for thumb-friendly
 * mobile use; selections fire `onFilterChange` immediately for <100ms feedback
 * while the parent debounces the actual POI refresh.
 *
 * @example
 * ```tsx
 * <FabFilterSystem
 *   filters={debouncedFilters}
 *   onFilterChange={handleFilterChange}
 *   isLoading={isFiltering}
 * />
 * ```
 */
export function FabFilterSystem({ filters, onFilterChange, isLoading = false }: FabFilterSystemProps) {
  const [openCategory, setOpenCategory] = useState<keyof WeatherFilters | null>(null)

  // Memoized filter configurations for performance
  const filterConfigs = useMemo(() => ({
    temperature: {
      icon: '🌡️',
      label: 'Temperature',
      testId: 'filter-temperature',
      options: [
        { value: 'cold', icon: '🥶', label: 'Cold', testId: 'temperature-cold' },
        { value: 'mild', icon: '😊', label: 'Mild', testId: 'temperature-mild' },
        { value: 'hot', icon: '🥵', label: 'Hot', testId: 'temperature-hot' }
      ]
    },
    precipitation: {
      icon: '🌧️',
      label: 'Precipitation',
      testId: 'filter-precipitation',
      options: [
        { value: 'none', icon: '☀️', label: 'None', testId: 'precipitation-none' },
        { value: 'light', icon: '🌦️', label: 'Light', testId: 'precipitation-light' },
        { value: 'heavy', icon: '🌧️', label: 'Heavy', testId: 'precipitation-heavy' }
      ]
    },
    wind: {
      icon: '💨',
      label: 'Wind',
      testId: 'filter-wind',
      options: [
        { value: 'calm', icon: '🌱', label: 'Calm', testId: 'wind-calm' },
        { value: 'breezy', icon: '🍃', label: 'Breezy', testId: 'wind-breezy' },
        { value: 'windy', icon: '💨', label: 'Windy', testId: 'wind-windy' }
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
                data-testid={config.testId}
                aria-label={`${config.label} filter: ${selectedOption?.label || 'All'}`}
                aria-expanded={isOpen}
                role="button"
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
                          data-testid={option.testId}
                          aria-label={`Select ${option.label} ${config.label.toLowerCase()}`}
                          aria-pressed={filters[category] === option.value}
                          role="button"
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
