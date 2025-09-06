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
export { AdManagerProvider, useAdManager } from './AdManager'
export { POIContextualAd, generatePOIAdHTML } from './POIContextualAd'
export { MediaNetContextualAd, generateMediaNetPopupAdHTML } from './MediaNetContextualAd'
export type { default as AdUnitProps } from './AdUnit'
