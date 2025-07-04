"use client"

import { useMediaQuery, useTheme } from '@mui/material'

// Device-specific breakpoints - More inclusive ranges
export const DEVICE_BREAKPOINTS = {
  // Mobile phones (including iPhone 14 Pro Max and smaller)
  mobile: {
    portrait: '(max-width: 480px) and (orientation: portrait)',
    landscape: '(max-width: 932px) and (max-height: 480px) and (orientation: landscape)'
  },
  // Tablets (iPad Mini, iPad, iPad Air)
  tablet: {
    portrait: '(min-width: 481px) and (max-width: 1024px) and (orientation: portrait)',
    landscape: '(min-width: 933px) and (max-width: 1366px) and (max-height: 1024px) and (orientation: landscape)'
  },
  // Desktop/Large tablets
  desktop: {
    landscape: '(min-width: 1367px) or (min-height: 1025px)'
  }
} as const

export function useDeviceBreakpoints() {
  // Simplified device detection
  const isMobilePortrait = useMediaQuery(DEVICE_BREAKPOINTS.mobile.portrait, { noSsr: true })
  const isMobileLandscape = useMediaQuery(DEVICE_BREAKPOINTS.mobile.landscape, { noSsr: true })
  const isTabletPortrait = useMediaQuery(DEVICE_BREAKPOINTS.tablet.portrait, { noSsr: true })
  const isTabletLandscape = useMediaQuery(DEVICE_BREAKPOINTS.tablet.landscape, { noSsr: true })
  const isDesktop = useMediaQuery(DEVICE_BREAKPOINTS.desktop.landscape, { noSsr: true })
  
  // Combined device detection
  const isMobile = isMobilePortrait || isMobileLandscape
  const isTablet = isTabletPortrait || isTabletLandscape
  const isPortrait = isMobilePortrait || isTabletPortrait
  const isLandscape = isMobileLandscape || isTabletLandscape || isDesktop
  
  return {
    // Device types
    isMobilePortrait,
    isMobileLandscape,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    
    // Combined categories
    isMobile,
    isTablet,
    isPortrait,
    isLandscape,
    
    // Legacy compatibility
    isIPhone14ProMaxPortrait: isMobilePortrait,
    isIPhone14ProMaxLandscape: isMobileLandscape,
    isIPadMiniPortrait: isTabletPortrait,
    isIPadMiniLandscape: isTabletLandscape,
    isIPadProPortrait: isTabletPortrait,
    isIPadProLandscape: isTabletLandscape,
    isIPhone: isMobile,
    isIPad: isTablet,
    
    // Layout suggestions
    shouldUseCompactLayout: isMobilePortrait,
    shouldUseGridLayout: isTabletLandscape || isDesktop,
    shouldUseVerticalLayout: isTabletPortrait
  }
}