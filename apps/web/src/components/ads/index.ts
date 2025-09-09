/**
 * ========================================================================
 * ADS MODULE EXPORTS - Google AdSense Integration
 * ========================================================================
 *
 * @BUSINESS_PURPOSE: Centralized exports for AdSense revenue components
 * @PRD_REF: PRD-GOOGLE-ADSENSE-181.md
 *
 * ========================================================================
 */

export { AdUnit } from './AdUnit'
export { AdManagerProvider } from './AdManager'
export { POIContextualAd } from './POIContextualAd'
export { MediaNetContextualAd } from './MediaNetContextualAd'

// Export context and types from separate file for React Fast Refresh compatibility
export { AdManagerContext, type AdManagerContextType } from './AdManagerContext'

// Export utility functions from their new locations
export { generatePOIAdHTML, generateMediaNetPopupAdHTML } from '../../utils/adUtils'
export { useAdManager } from '../../hooks/useAdManager'

export type { default as AdUnitProps } from './AdUnit'
