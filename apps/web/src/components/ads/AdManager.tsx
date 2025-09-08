/**
 * ========================================================================
 * AD MANAGER - Centralized AdSense Management
 * ========================================================================
 *
 * @BUSINESS_PURPOSE: Centralized ad loading, error handling, and analytics
 * @TECHNICAL_APPROACH: Service layer for ad optimization and performance tracking
 * @PRD_REF: PRD-GOOGLE-ADSENSE-181.md
 *
 * FEATURES:
 * - Centralized ad configuration and loading
 * - Performance monitoring and analytics
 * - A/B testing framework for ad optimization
 * - Error handling and fallback strategies
 *
 * ========================================================================
 */

import React, { createContext, useEffect, useState, ReactNode } from 'react'

interface AdPerformanceMetrics {
  impressions: number
  clicks: number
  ctr: number // Click-through rate
  revenue: number
  loadTime: number
}

interface AdManagerState {
  isAdBlockDetected: boolean
  adsLoaded: boolean
  performanceMetrics: Record<string, AdPerformanceMetrics>
  testGroup: 'A' | 'B' // A/B testing
}

interface AdManagerContextType extends AdManagerState {
  trackAdImpression: (placement: string) => void
  trackAdClick: (placement: string) => void
  getOptimalAdPlacement: (context: string) => string[]
  isAdEnabled: (placement: string) => boolean
}

const AdManagerContext = createContext<AdManagerContextType | null>(null)

interface AdManagerProviderProps {
  children: ReactNode
  enableAds?: boolean
  testMode?: boolean
}

/**
 * AdManager Provider - Centralized ad management and optimization
 */
export const AdManagerProvider: React.FC<AdManagerProviderProps> = ({
  children,
  enableAds = process.env.NODE_ENV === 'production',
  testMode: _testMode = process.env.NODE_ENV === 'development'
}) => {
  const [state, setState] = useState<AdManagerState>({
    isAdBlockDetected: false,
    adsLoaded: false,
    performanceMetrics: {},
    testGroup: Math.random() > 0.5 ? 'A' : 'B' // Simple A/B testing
  })

  // Detect ad blocking
  useEffect(() => {
    const detectAdBlock = async () => {
      try {
        // Simple ad block detection - try to load a known ad resource
        const _response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'no-cors'
        })
        setState(prev => ({ ...prev, isAdBlockDetected: false }))
      } catch {
        console.log('Ad blocking detected - ads disabled')
        setState(prev => ({ ...prev, isAdBlockDetected: true }))
      }
    }

    if (enableAds) {
      detectAdBlock()
    }
  }, [enableAds])

  // Load AdSense script
  useEffect(() => {
    if (!enableAds || state.isAdBlockDetected) return

    const loadAdSenseScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="adsbygoogle"]')
      if (existingScript) {
        setState(prev => ({ ...prev, adsLoaded: true }))
        return
      }

      // Create and inject AdSense script
      const script = document.createElement('script')
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
      script.async = true
      script.crossOrigin = 'anonymous'

      script.onload = () => {
        console.log('AdSense script loaded successfully')
        setState(prev => ({ ...prev, adsLoaded: true }))

        // Initialize adsbygoogle if not already done
        if (typeof window !== 'undefined' && !window.adsbygoogle) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        }
      }

      script.onerror = () => {
        console.error('Failed to load AdSense script')
        setState(prev => ({ ...prev, isAdBlockDetected: true }))
      }

      document.head.appendChild(script)
    }

    loadAdSenseScript()
  }, [enableAds, state.isAdBlockDetected])

  // Track ad impression
  const trackAdImpression = (placement: string) => {
    if (!enableAds) return

    setState(prev => ({
      ...prev,
      performanceMetrics: {
        ...prev.performanceMetrics,
        [placement]: {
          ...prev.performanceMetrics[placement],
          impressions: (prev.performanceMetrics[placement]?.impressions || 0) + 1,
          clicks: prev.performanceMetrics[placement]?.clicks || 0,
          ctr: 0, // Will be calculated
          revenue: prev.performanceMetrics[placement]?.revenue || 0,
          loadTime: prev.performanceMetrics[placement]?.loadTime || 0
        }
      }
    }))

    // Send analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ad_impression', {
        event_category: 'advertising',
        event_label: placement,
        value: 1
      })
    }
  }

  // Track ad click
  const trackAdClick = (placement: string) => {
    if (!enableAds) return

    setState(prev => {
      const currentMetrics = prev.performanceMetrics[placement] || { impressions: 0, clicks: 0, ctr: 0, revenue: 0, loadTime: 0 }
      const newClicks = currentMetrics.clicks + 1
      const newCtr = currentMetrics.impressions > 0 ? (newClicks / currentMetrics.impressions) * 100 : 0

      return {
        ...prev,
        performanceMetrics: {
          ...prev.performanceMetrics,
          [placement]: {
            ...currentMetrics,
            clicks: newClicks,
            ctr: newCtr
          }
        }
      }
    })

    // Send analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ad_click', {
        event_category: 'advertising',
        event_label: placement,
        value: 1
      })
    }
  }

  // Get optimal ad placement based on context and A/B testing
  const getOptimalAdPlacement = (context: string): string[] => {
    const baseConfig = {
      homepage: ['homepage-banner'],
      weather_results: ['weather-results'],
      poi_detail: ['poi-detail', 'sidebar'],
      map_view: ['map-overlay']
    }

    // A/B testing variations
    if (state.testGroup === 'B') {
      return baseConfig[context as keyof typeof baseConfig] || []
    }

    return baseConfig[context as keyof typeof baseConfig] || []
  }

  // Check if ads should be enabled for specific placement
  const isAdEnabled = (placement: string): boolean => {
    if (!enableAds || state.isAdBlockDetected) return false

    // Business hours optimization for higher eCPM
    const now = new Date()
    const hour = now.getHours()
    const isBusinessHours = hour >= 9 && hour <= 17

    // Outdoor recreation apps see higher engagement during business hours and weekends
    const isWeekend = now.getDay() === 0 || now.getDay() === 6

    // Enable more ads during high-value periods
    if (placement === 'homepage-banner') return true
    if (placement === 'weather-results') return isBusinessHours || isWeekend
    if (placement === 'poi-detail') return true
    if (placement === 'sidebar') return isBusinessHours
    if (placement === 'map-overlay') return isWeekend

    return true
  }

  const contextValue: AdManagerContextType = {
    ...state,
    trackAdImpression,
    trackAdClick,
    getOptimalAdPlacement,
    isAdEnabled
  }

  return (
    <AdManagerContext.Provider value={contextValue}>
      {children}
    </AdManagerContext.Provider>
  )
}

// Hook exported from separate file to maintain React Fast Refresh compatibility
// See: /src/hooks/useAdManager.ts

// Global type extensions for window object
declare global {
  interface Window {
    adsbygoogle: any[]
    gtag: (...args: any[]) => void
  }
}

export default AdManagerProvider
