/**
 * ========================================================================
 * ADUNIT COMPONENT - Google AdSense Integration
 * ========================================================================
 * 
 * @BUSINESS_PURPOSE: Revenue generation through strategic ad placement
 * @TECHNICAL_APPROACH: React AdSense with responsive, performance-optimized integration
 * @PRD_REF: PRD-GOOGLE-ADSENSE-181.md
 * 
 * REVENUE OPTIMIZATION:
 * - Responsive ad units for mobile-first experience
 * - Lazy loading for performance optimization
 * - Material-UI design system integration
 * - Context-aware ad placement
 * 
 * ========================================================================
 */

import React, { Suspense } from 'react'
import { Adsense } from '@ctrl/react-adsense'
import { Box, Skeleton } from '@mui/material'
import { styled } from '@mui/material/styles'

// Styled components for ad integration
const AdContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  margin: theme.spacing(2, 0),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '120px', // Prevent layout shift
  '& .adsbygoogle': {
    display: 'block',
    width: '100%',
  },
  // Mobile-first responsive design
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(1, 0),
    minHeight: '100px',
  },
  // Desktop optimization
  [theme.breakpoints.up('md')]: {
    minHeight: '250px',
  }
}))

const AdLabel = styled(Box)(({ theme }) => ({
  fontSize: '10px',
  color: theme.palette.text.secondary,
  textAlign: 'center',
  marginBottom: theme.spacing(0.5),
  opacity: 0.7,
}))

interface AdUnitProps {
  /** AdSense slot ID */
  slot: string
  /** Ad format - responsive, rectangle, banner, etc. */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  /** Ad placement context for analytics */
  placement: 'homepage-banner' | 'weather-results' | 'poi-detail' | 'sidebar' | 'map-overlay'
  /** Show ad label for transparency */
  showLabel?: boolean
  /** Custom CSS class */
  className?: string
  /** Lazy loading for performance */
  lazy?: boolean
  /** Test mode for development */
  testMode?: boolean
}

/**
 * AdUnit - Responsive Google AdSense component
 * 
 * Optimized for outdoor recreation weather app with strategic placement
 * for maximum revenue while maintaining excellent user experience
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  format = 'auto',
  placement,
  showLabel = true,
  className,
  lazy = true,
  testMode = process.env.NODE_ENV === 'development'
}) => {
  // AdSense client ID - will be configured via environment variables
  const clientId = process.env.REACT_APP_ADSENSE_CLIENT_ID || 'ca-pub-test'
  
  // Responsive ad dimensions based on placement
  const getAdDimensions = () => {
    switch (placement) {
      case 'homepage-banner':
        return { width: 'auto', height: '120' }
      case 'weather-results':
        return { width: 'auto', height: '100' }
      case 'poi-detail':
        return { width: 'auto', height: '250' }
      case 'sidebar':
        return { width: '300', height: '250' }
      case 'map-overlay':
        return { width: 'auto', height: '90' }
      default:
        return { width: 'auto', height: '120' }
    }
  }

  const dimensions = getAdDimensions()

  // Loading placeholder for better UX
  const AdSkeleton = () => (
    <Skeleton
      variant="rectangular"
      width="100%"
      height={dimensions.height}
      sx={{ bgcolor: 'grey.100' }}
    />
  )

  // Don't render ads if AdSense not configured
  if (!clientId || clientId === 'ca-pub-test') {
    if (testMode) {
      return (
        <AdContainer className={className}>
          {showLabel && <AdLabel>Advertisement (Test Mode)</AdLabel>}
          <Box
            sx={{
              width: '100%',
              height: dimensions.height,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed #ccc',
              borderRadius: 1
            }}
          >
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Test Ad Unit
              <br />
              {placement}
            </Box>
          </Box>
        </AdContainer>
      )
    }
    return null
  }

  return (
    <AdContainer className={className}>
      {showLabel && <AdLabel>Advertisement</AdLabel>}
      <Suspense fallback={<AdSkeleton />}>
        <Adsense
          client={clientId}
          slot={slot}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            display: 'block'
          }}
          format={format}
          responsive={format === 'auto'}
          adTest={testMode ? 'on' : 'off'}
          data-ad-placement={placement}
          data-full-width-responsive="true"
        />
      </Suspense>
    </AdContainer>
  )
}

export default AdUnit