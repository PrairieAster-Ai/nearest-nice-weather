/**
 * ========================================================================
 * UMAMI ANALYTICS INTEGRATION - PRIVACY-FOCUSED TRACKING
 * ========================================================================
 *
 * 📊 PURPOSE: Privacy-first analytics using Umami (GDPR compliant, no cookies)
 * 🔒 PRIVACY: No personal data collection, IP anonymization, no third-party sharing
 * ⚡ PERFORMANCE: <2KB tracking script, minimal impact on page load
 *
 * BUSINESS CONTEXT: Track user interactions for product optimization while respecting privacy
 * - POI discovery patterns for feature prioritization
 * - Weather filter usage for algorithm improvements
 * - Geographic distribution for market expansion planning
 * - Performance metrics for technical optimization
 *
 * INTEGRATION: Works with React + Vite, environment variable configuration
 * @CLAUDE_CONTEXT: Privacy-focused analytics implementation for outdoor recreation platform
 */

// Global Umami interface
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

interface POIAnalytics {
  name: string;
  temperature: number;
  condition: string;
  distance?: number;
  park_type?: string;
}

interface WeatherFilterAnalytics {
  temp_min?: number;
  temp_max?: number;
  conditions?: string[];
  wind_max?: number;
  precipitation_max?: number;
}

interface LocationAnalytics {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'gps' | 'ip' | 'manual';
}

/**
 * Initialize Umami analytics
 * Called automatically when the script loads via index.html
 */
export const initializeAnalytics = (): boolean => {
  // Check if Umami is loaded
  if (typeof window !== 'undefined' && window.umami) {
    console.log('📊 Umami Analytics initialized');
    return true;
  }

  // In development, log events instead of tracking
  if (import.meta.env.DEV) {
    console.log('📊 Analytics in development mode - events will be logged only');
    return false;
  }

  console.warn('📊 Umami Analytics not loaded - check environment variables');
  return false;
};

/**
 * Generic event tracking with development mode fallback
 */
const trackEvent = (eventName: string, eventData?: Record<string, any>): void => {
  if (typeof window === 'undefined') return;

  if (window.umami && typeof window.umami.track === 'function') {
    window.umami.track(eventName, eventData);
  } else if (import.meta.env.DEV) {
    // Log events in development for debugging
    console.log(`📊 [Analytics] ${eventName}:`, eventData || 'no data');
  }
};

/**
 * Track POI interaction events
 */
export const trackPOIInteraction = (action: string, poi: POIAnalytics): void => {
  trackEvent('poi-interaction', {
    action,
    poi_name: poi.name,
    poi_type: poi.park_type || 'unknown',
    temperature: poi.temperature,
    condition: poi.condition,
    distance_miles: poi.distance ? Math.round(poi.distance) : undefined
  });
};

/**
 * Track weather filter usage
 */
export const trackWeatherFilter = (filterType: string, filterData: WeatherFilterAnalytics): void => {
  trackEvent('weather-filter', {
    filter_type: filterType,
    temp_range: filterData.temp_min && filterData.temp_max ?
      `${filterData.temp_min}-${filterData.temp_max}` : undefined,
    conditions: filterData.conditions?.join(','),
    wind_max: filterData.wind_max,
    precipitation_max: filterData.precipitation_max
  });
};

/**
 * Track location changes (user positioning)
 */
export const trackLocationUpdate = (location: LocationAnalytics): void => {
  trackEvent('location-update', {
    source: location.source,
    accuracy_meters: location.accuracy,
    // Don't track exact coordinates for privacy - just general area
    lat_zone: Math.floor(location.lat), // e.g., 44 for Minneapolis area
    lng_zone: Math.floor(location.lng)  // e.g., -93 for Minneapolis area
  });
};

/**
 * Track navigation events (POI discovery flow)
 */
export const trackNavigation = (action: string, context?: Record<string, any>): void => {
  trackEvent('navigation', {
    action, // 'closer', 'farther', 'expand', 'reset'
    ...context
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (feature: string, context?: Record<string, any>): void => {
  trackEvent('feature-usage', {
    feature, // 'directions', 'feedback', 'filter', 'location-drag'
    ...context
  });
};

/**
 * Track errors for debugging (no personal data)
 */
export const trackError = (errorType: string, context?: Record<string, any>): void => {
  trackEvent('error', {
    error_type: errorType,
    ...context
  });
};

/**
 * Track page views manually for SPA
 */
export const trackPageView = (path?: string): void => {
  if (typeof window !== 'undefined' && window.umami) {
    // Umami automatically tracks page views, but we can track custom paths
    trackEvent('page-view', {
      path: path || window.location.pathname
    });
  }
};

/**
 * Utility to check if analytics is enabled and working
 */
export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== 'undefined' &&
         window.umami !== undefined &&
         typeof window.umami.track === 'function';
};

// Export the loading function for manual initialization
export { loadUmamiAnalytics } from './loadAnalytics';
