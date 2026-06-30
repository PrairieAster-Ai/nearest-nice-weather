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

/** Per-placement ad performance counters used for A/B testing and revenue tracking. */
export interface AdPerformanceMetrics {
  impressions: number
  clicks: number
  ctr: number // Click-through rate
  revenue: number
  loadTime: number
}

/** Ad-manager state shared via context: ad-block detection, load status, per-placement metrics, and the A/B test group. */
export interface AdManagerState {
  isAdBlockDetected: boolean
  adsLoaded: boolean
  performanceMetrics: Record<string, AdPerformanceMetrics>
  testGroup: 'A' | 'B' // A/B testing
}

/** The context value: {@link AdManagerState} plus the actions components call to track and place ads. */
export interface AdManagerContextType extends AdManagerState {
  trackAdImpression: (placement: string) => void
  trackAdClick: (placement: string) => void
  getOptimalAdPlacement: (context: string) => string[]
  isAdEnabled: (placement: string) => boolean
}

/** React context carrying the ad-manager state + actions; null until a provider mounts. */
export const AdManagerContext = createContext<AdManagerContextType | null>(null)
