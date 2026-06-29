/**
 * ========================================================================
 * USER LOCATION ESTIMATOR - INTELLIGENT POSITIONING SERVICE
 * ========================================================================
 *
 * 📋 PURPOSE: Encapsulated service for accurate user location estimation
 * 🎯 ACCURACY FOCUS: Multiple strategies with fallback chain for maximum precision
 * 🔒 PRIVACY-AWARE: Respects user permissions and provides transparent fallbacks
 * ⚡ PERFORMANCE: Optimized timeouts and caching for responsive UX
 *
 * ESTIMATION STRATEGIES (Priority Order):
 * 1. 📍 Browser Geolocation (HIGH ACCURACY): GPS/WiFi/Cell tower triangulation
 * 2. 🌐 IP Geolocation (MEDIUM ACCURACY): City/region level via IP address
 * 3. 🗺️ Cached Location (VARIABLE ACCURACY): Previously stored user position
 * 4. 📱 Network-based Location (MEDIUM ACCURACY): WiFi access point mapping
 * 5. 🎯 Manual Location (HIGH ACCURACY): User-set position via map interaction
 * 6. 🏠 Default Fallback (LOW ACCURACY): Minneapolis center for Minnesota focus
 *
 * @CLAUDE_CONTEXT: Centralized location intelligence for personalized outdoor discovery
 * @BUSINESS_RULE: P0 MUST provide location within 10 seconds for all users
 * @PRIVACY_COMPLIANT: Transparent about data collection and storage
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json
 *
 * ACCURACY MEASUREMENTS:
 * - GPS: 1-5 meters (optimal conditions)
 * - WiFi/Cell: 10-100 meters (typical mobile)
 * - IP Geolocation: 1-50 miles (ISP-dependent)
 * - Network Location: 100-1000 meters (urban areas)
 *
 * LAST UPDATED: 2025-08-08
 */

import {
  calculateConfidence,
  scoreEstimate,
  isCacheValid,
} from '../utils/locationEstimationUtils';
import { fetchIPLocation } from './ipGeolocation';

/**
 * A resolved estimate of the user's position plus how it was obtained and how
 * much to trust it.
 */
export interface LocationEstimate {
  /** `[latitude, longitude]` in decimal degrees. */
  coordinates: [number, number];
  /** Approximate accuracy radius in meters (larger = less precise). */
  accuracy: number;
  /** Which strategy produced this estimate. */
  method: LocationMethod;
  /** Unix epoch (ms) when the estimate was captured. */
  timestamp: number;
  /** Derived trust level for {@link LocationEstimate.accuracy} and freshness. */
  confidence: LocationConfidence;
  /** Optional provenance label, e.g. `'browser_geolocation'`, `'default_minnesota'`. */
  source?: string;
}

/**
 * The strategy that produced a {@link LocationEstimate}, listed roughly from most
 * to least accurate (`'none'` means no location is available).
 */
export type LocationMethod =
  | 'gps'           // High accuracy GPS
  | 'network'       // Network-based (WiFi/cell towers)
  | 'ip'           // IP geolocation
  | 'cached'       // Previously stored location
  | 'manual'       // User-set location
  | 'fallback'     // Default Minneapolis center
  | 'none';        // No location available

/**
 * Trust level for a {@link LocationEstimate}, derived from accuracy and freshness.
 */
export type LocationConfidence =
  | 'high'         // <50m accuracy, recent timestamp
  | 'medium'       // <1km accuracy, reasonable timestamp
  | 'low'          // City-level accuracy or stale data
  | 'unknown';     // Accuracy unknown

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackCoordinates?: [number, number];
  cacheMaxAge?: number; // Maximum age for cached location (ms)
}

/**
 * Estimates the user's location through a prioritized fallback chain
 * (cache → IP → optional high-accuracy GPS → Minneapolis default).
 *
 * Use the shared {@link locationEstimator} singleton rather than constructing
 * your own instance, so the in-memory and `localStorage` caches are shared
 * app-wide. All persistence is local; coordinates are never sent to a server.
 *
 * @example
 * ```ts
 * // Fast, no permission prompt:
 * const fast = await locationEstimator.getFastLocation()
 * // Best available (may request GPS permission):
 * const best = await locationEstimator.estimateLocation({ enableHighAccuracy: true })
 * ```
 *
 * @remarks Business rule (P0): must return a location within ~10s for every user.
 */
export class UserLocationEstimator {
  private defaultOptions: LocationOptions = {
    enableHighAccuracy: false, // Start with fast, lower accuracy
    timeout: 8000,
    maximumAge: 300000, // 5 minutes
    fallbackCoordinates: [44.9537, -93.0900], // Minneapolis center
    cacheMaxAge: 1800000 // 30 minutes
  };

  private cachedLocation: LocationEstimate | null = null;
  private isEstimating = false;

  /**
   * PRIMARY METHOD: Get best available location estimate
   * ENHANCED: Progressive enhancement strategy for optimal UX
   */
  async estimateLocation(options: LocationOptions = {}): Promise<LocationEstimate> {
    const opts = { ...this.defaultOptions, ...options };

    if (this.isEstimating) {
      // Return cached or wait for current estimation
      if (this.cachedLocation && isCacheValid(this.cachedLocation, opts.cacheMaxAge!)) {
        return this.cachedLocation;
      }
      throw new Error('Location estimation already in progress');
    }

    this.isEstimating = true;

    try {
      // PHASE 1: Fast estimation for immediate UX (parallel non-blocking methods)
      const fastMethods = [
        this.getCachedLocation(),
        this.getIPLocation(),
      ];

      // PHASE 2: Slower high-accuracy methods (only if requested)
      const accurateMethods = opts.enableHighAccuracy ? [
        this.getBrowserGeolocation(opts)
      ] : [];

      // Execute fast methods first
      const fastResults = await Promise.allSettled(fastMethods);
      const fastEstimates = fastResults
        .filter((result): result is PromiseFulfilledResult<LocationEstimate> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      // If we have a decent fast estimate, use it immediately
      let bestFastEstimate: LocationEstimate | null = null;
      if (fastEstimates.length > 0) {
        bestFastEstimate = fastEstimates
          .sort((a, b) => scoreEstimate(b) - scoreEstimate(a))[0];
      }

      // Execute accurate methods if requested and if fast estimate isn't already high quality
      if (accurateMethods.length > 0 && (!bestFastEstimate || bestFastEstimate.confidence !== 'high')) {
        try {
          const accurateResults = await Promise.allSettled(accurateMethods);
          const accurateEstimates = accurateResults
            .filter((result): result is PromiseFulfilledResult<LocationEstimate> =>
              result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value);

          // Select the most accurate estimate if significantly better
          if (accurateEstimates.length > 0) {
            const bestAccurate = accurateEstimates
              .sort((a, b) => scoreEstimate(b) - scoreEstimate(a))[0];

            // Use accurate estimate if it's significantly better or if no fast estimate
            if (!bestFastEstimate || bestAccurate.accuracy < bestFastEstimate.accuracy * 0.5) {
              bestFastEstimate = bestAccurate;
            }
          }
        } catch (error) {
          console.log('High accuracy location failed, using fast estimate:', error instanceof Error ? error.message : String(error));
        }
      }

      if (bestFastEstimate) {
        this.cacheLocation(bestFastEstimate);
        console.log(`📍 Location estimated: ${this.getLocationSummary(bestFastEstimate)}`);
        return bestFastEstimate;
      }

      // Fallback to default location
      const fallback = this.getFallbackLocation(opts.fallbackCoordinates!);
      console.log(`📍 Using fallback location: ${this.getLocationSummary(fallback)}`);
      return fallback;

    } finally {
      this.isEstimating = false;
    }
  }

  /**
   * HIGH ACCURACY: Request precise GPS location (requires user permission)
   */
  async requestPreciseLocation(options: LocationOptions = {}): Promise<LocationEstimate> {
    const opts = { ...this.defaultOptions, ...options, enableHighAccuracy: true, timeout: 15000 };

    return this.getBrowserGeolocation(opts);
  }

  /**
   * FAST LOCATION: Get immediate location without permission prompts
   */
  async getFastLocation(): Promise<LocationEstimate> {
    // Try cached first
    if (this.cachedLocation && isCacheValid(this.cachedLocation, 1800000)) {
      return this.cachedLocation;
    }

    // Then IP location (no permissions required)
    try {
      return await this.getIPLocation();
    } catch {
      return this.getFallbackLocation();
    }
  }

  /**
   * BROWSER GEOLOCATION: Native GPS/network location
   */
  private async getBrowserGeolocation(options: LocationOptions): Promise<LocationEstimate> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const estimate: LocationEstimate = {
            coordinates: [position.coords.latitude, position.coords.longitude],
            accuracy: position.coords.accuracy,
            method: position.coords.accuracy < 100 ? 'gps' : 'network',
            timestamp: position.timestamp,
            confidence: calculateConfidence(position.coords.accuracy, position.timestamp),
            source: 'browser_geolocation'
          };
          resolve(estimate);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge
        }
      );
    });
  }

  /**
   * IP GEOLOCATION: City/region level location via multiple providers.
   * Implementation lives in ./ipGeolocation (pure + testable).
   */
  private async getIPLocation(): Promise<LocationEstimate> {
    return fetchIPLocation();
  }

  /**
   * CACHED LOCATION: Previously stored location (enhanced with localStorage)
   */
  private async getCachedLocation(): Promise<LocationEstimate | null> {
    // Check in-memory cache first
    if (this.cachedLocation && isCacheValid(this.cachedLocation, this.defaultOptions.cacheMaxAge!)) {
      return {
        ...this.cachedLocation,
        method: 'cached'
      };
    }

    // PRIVACY ENHANCEMENT: Check localStorage cache
    try {
      const cached = localStorage.getItem('location_cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - parsedCache.timestamp;

        if (cacheAge < this.defaultOptions.cacheMaxAge!) {
          const cachedEstimate: LocationEstimate = {
            coordinates: parsedCache.coordinates,
            accuracy: parsedCache.accuracy,
            method: 'cached',
            timestamp: parsedCache.timestamp,
            confidence: parsedCache.confidence,
            source: parsedCache.source
          };

          // Update in-memory cache
          this.cachedLocation = cachedEstimate;
          console.log(`📍 Loaded cached location: ${this.getLocationSummary(cachedEstimate)}`);
          return cachedEstimate;
        } else {
          // Cache expired, remove it
          localStorage.removeItem('location_cache');
        }
      }
    } catch (error) {
      console.warn('Failed to load cached location:', error);
    }

    return null;
  }

  /**
   * FALLBACK LOCATION: Default coordinates for when all else fails
   */
  private getFallbackLocation(coordinates: [number, number] = [44.9537, -93.0900]): LocationEstimate {
    return {
      coordinates,
      accuracy: 50000, // 50km uncertainty
      method: 'fallback',
      timestamp: Date.now(),
      confidence: 'unknown',
      source: 'default_minnesota'
    };
  }

  // NOTE: calculateConfidence, estimateIPAccuracy, calculateIPConfidence,
  // scoreEstimate, and isCacheValid now live in ../utils/locationEstimationUtils
  // (pure + unit-tested) and are imported above — removing the duplicate copies
  // that had drifted from that module.

  private cacheLocation(estimate: LocationEstimate): void {
    this.cachedLocation = estimate;

    // PRIVACY: Only store location locally, never send to external servers
    try {
      localStorage.setItem('location_cache', JSON.stringify({
        coordinates: estimate.coordinates,
        accuracy: estimate.accuracy,
        method: estimate.method,
        timestamp: estimate.timestamp,
        confidence: estimate.confidence,
        source: estimate.source
      }));
    } catch (error) {
      console.warn('Failed to cache location locally:', error);
    }
  }

  /**
   * UTILITIES
   */
  getLocationSummary(estimate: LocationEstimate): string {
    const accuracy = estimate.accuracy < 1000
      ? `±${Math.round(estimate.accuracy)}m`
      : `±${Math.round(estimate.accuracy / 1000)}km`;

    const age = Date.now() - estimate.timestamp;
    const ageStr = age < 60000
      ? 'just now'
      : age < 3600000
        ? `${Math.round(age / 60000)}min ago`
        : `${Math.round(age / 3600000)}hr ago`;

    return `${estimate.method.toUpperCase()}: ${accuracy} (${ageStr})`;
  }

  /**
   * PRIVACY METHODS
   */
  clearStoredLocation(): void {
    this.cachedLocation = null;
    try {
      localStorage.removeItem('location_cache');
      console.log('🔒 Cleared stored location data');
    } catch (error) {
      console.warn('Failed to clear stored location:', error);
    }
  }

  getPrivacySummary(): { hasStoredData: boolean, lastUpdate: number | null, dataAge: string } {
    try {
      const cached = localStorage.getItem('location_cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const age = Date.now() - parsedCache.timestamp;
        const ageStr = age < 60000
          ? 'just now'
          : age < 3600000
            ? `${Math.round(age / 60000)}min ago`
            : `${Math.round(age / 3600000)}hr ago`;

        return {
          hasStoredData: true,
          lastUpdate: parsedCache.timestamp,
          dataAge: ageStr
        };
      }
    } catch (error) {
      console.warn('Failed to check privacy data:', error);
    }

    return {
      hasStoredData: false,
      lastUpdate: null,
      dataAge: 'never'
    };
  }

  async checkPermissionStatus(): Promise<{
    geolocation: PermissionState | 'not_supported';
    hasPermissionApi: boolean;
  }> {
    const result = {
      geolocation: 'not_supported' as PermissionState | 'not_supported',
      hasPermissionApi: 'permissions' in navigator
    };

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        result.geolocation = permission.state;
      } catch (error) {
        console.warn('Failed to check geolocation permission:', error);
      }
    }

    return result;
  }

  /**
   * DEBUGGING AND MONITORING
   */
  async testAllMethods(): Promise<{ [key: string]: LocationEstimate | Error }> {
    const results: { [key: string]: LocationEstimate | Error } = {};

    try {
      results.gps = await this.getBrowserGeolocation({ enableHighAccuracy: true, timeout: 10000 });
    } catch (error) {
      results.gps = error as Error;
    }

    try {
      results.network = await this.getBrowserGeolocation({ enableHighAccuracy: false, timeout: 5000 });
    } catch (error) {
      results.network = error as Error;
    }

    try {
      results.ip = await this.getIPLocation();
    } catch (error) {
      results.ip = error as Error;
    }

    results.cached = this.cachedLocation || new Error('No cached location');
    results.fallback = this.getFallbackLocation();

    return results;
  }
}

/**
 * Shared app-wide {@link UserLocationEstimator} instance. Prefer this over
 * `new UserLocationEstimator()` so the location cache is shared across callers.
 */
export const locationEstimator = new UserLocationEstimator();
