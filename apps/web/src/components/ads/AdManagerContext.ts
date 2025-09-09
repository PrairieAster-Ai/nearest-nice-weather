/**
 * ========================================================================
 * AD MANAGER CONTEXT - React Context for AdSense Management
 * ========================================================================
 *
 * @BUSINESS_PURPOSE: Provides React context for centralized ad management
 * @TECHNICAL_APPROACH: Separated context from component for React Fast Refresh compatibility
 * @PRD_REF: PRD-GOOGLE-ADSENSE-181.md
 *
 * ========================================================================
 */

import { createContext } from 'react'

export interface AdPerformanceMetrics {
  impressions: number
  clicks: number
  ctr: number // Click-through rate
  revenue: number
  loadTime: number
}

export interface AdManagerState {
  isAdBlockDetected: boolean
  adsLoaded: boolean
  performanceMetrics: Record<string, AdPerformanceMetrics>
  testGroup: 'A' | 'B' // A/B testing
}

export interface AdManagerContextType extends AdManagerState {
  trackAdImpression: (placement: string) => void
  trackAdClick: (placement: string) => void
  getOptimalAdPlacement: (context: string) => string[]
  isAdEnabled: (placement: string) => boolean
}

export const AdManagerContext = createContext<AdManagerContextType | null>(null)
