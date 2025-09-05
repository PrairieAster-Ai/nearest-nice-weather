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

export interface LocationEstimate {
  coordinates: [number, number]; // [latitude, longitude]
  accuracy: number; // Accuracy in meters (approximate)
  method: LocationMethod;
  timestamp: number; // Unix timestamp
  confidence: LocationConfidence;
  source?: string; // Optional source identifier
}

export type LocationMethod =
  | 'gps'           // High accuracy GPS
  | 'network'       // Network-based (WiFi/cell towers)
  | 'ip'           // IP geolocation
  | 'cached'       // Previously stored location
  | 'manual'       // User-set location
  | 'fallback'     // Default Minneapolis center
  | 'none';        // No location available

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

interface NetworkLocationProvider {
  name: string;
  endpoint: string;
  apiKey?: string;
  parser: (response: any) => LocationEstimate | null;
}

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
      if (this.cachedLocation && this.isCacheValid(this.cachedLocation, opts.cacheMaxAge!)) {
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
          .sort((a, b) => this.scoreEstimate(b) - this.scoreEstimate(a))[0];
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
              .sort((a, b) => this.scoreEstimate(b) - this.scoreEstimate(a))[0];

            // Use accurate estimate if it's significantly better or if no fast estimate
            if (!bestFastEstimate || bestAccurate.accuracy < bestFastEstimate.accuracy * 0.5) {
              bestFastEstimate = bestAccurate;
            }
          }
        } catch (error) {
          console.log('High accuracy location failed, using fast estimate:', error.message);
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
    if (this.cachedLocation && this.isCacheValid(this.cachedLocation, 1800000)) {
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
            confidence: this.calculateConfidence(position.coords.accuracy, position.timestamp),
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
   * IP GEOLOCATION: City/region level location via multiple providers with parallel requests
   */
  private async getIPLocation(): Promise<LocationEstimate> {
    const providers: NetworkLocationProvider[] = [
      {
        name: 'ipapi',
        endpoint: 'https://ipapi.co/json/',
        parser: (data) => {
          if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
            return {
              coordinates: [data.latitude, data.longitude],
              accuracy: this.estimateIPAccuracy(data.city, data.region),
              method: 'ip',
              timestamp: Date.now(),
              confidence: this.calculateIPConfidence(data.city, data.region, data.country_code),
              source: `ipapi_${data.city || 'unknown'}_${data.region || 'unknown'}`
            };
          }
          return null;
        }
      },
      {
        name: 'ip-api',
        endpoint: 'http://ip-api.com/json/?fields=status,lat,lon,city,region,country',
        parser: (data) => {
          if (data.status === 'success' && data.lat && data.lon) {
            return {
              coordinates: [data.lat, data.lon],
              accuracy: this.estimateIPAccuracy(data.city, data.region),
              method: 'ip',
              timestamp: Date.now(),
              confidence: this.calculateIPConfidence(data.city, data.region, data.country),
              source: `ip-api_${data.city || 'unknown'}_${data.region || 'unknown'}`
            };
          }
          return null;
        }
      },
      {
        name: 'ipgeolocation',
        endpoint: 'https://api.ipgeolocation.io/ipgeo',
        parser: (data) => {
          if (data.latitude && data.longitude && parseFloat(data.latitude) !== 0) {
            return {
              coordinates: [parseFloat(data.latitude), parseFloat(data.longitude)],
              accuracy: this.estimateIPAccuracy(data.city, data.state_prov),
              method: 'ip',
              timestamp: Date.now(),
              confidence: this.calculateIPConfidence(data.city, data.state_prov, data.country_code2),
              source: `ipgeolocation_${data.city || 'unknown'}`
            };
          }
          return null;
        }
      }
    ];

    // ENHANCED: Try multiple providers in parallel for speed and reliability
    const providerPromises = providers.map(async (provider) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per provider

        const response = await fetch(provider.endpoint, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const estimate = provider.parser(data);

        if (estimate) {
          console.log(`📍 IP Location from ${provider.name}: ${estimate.source}, ±${estimate.accuracy}m`);
          return { provider: provider.name, estimate, error: null };
        }

        return { provider: provider.name, estimate: null, error: 'Invalid response data' };

      } catch (error) {
        console.warn(`IP provider ${provider.name} failed:`, error.message);
        return { provider: provider.name, estimate: null, error: error.message };
      }
    });

    // Wait for all providers with a race condition to return the first successful result
    const results = await Promise.allSettled(providerPromises);

    // Collect all successful estimates
    const successfulEstimates = results
      .filter((result): result is PromiseFulfilledResult<any> =>
        result.status === 'fulfilled' && result.value.estimate !== null
      )
      .map(result => result.value.estimate);

    if (successfulEstimates.length > 0) {
      // Select best estimate based on scoring
      const bestEstimate = successfulEstimates
        .sort((a, b) => this.scoreEstimate(b) - this.scoreEstimate(a))[0];

      console.log(`📍 Selected best IP location: ${bestEstimate.source} (${successfulEstimates.length} providers responded)`);
      return bestEstimate;
    }

    // Log all failures for debugging
    const failedProviders = results.map((result, i) => ({
      name: providers[i].name,
      error: result.status === 'fulfilled' ? result.value.error : result.reason.message
    }));

    console.warn('All IP geolocation providers failed:', failedProviders);
    throw new Error(`IP geolocation unavailable: ${failedProviders.map(p => `${p.name}: ${p.error}`).join(', ')}`);
  }

  /**
   * CACHED LOCATION: Previously stored location (enhanced with localStorage)
   */
  private async getCachedLocation(): Promise<LocationEstimate | null> {
    // Check in-memory cache first
    if (this.cachedLocation && this.isCacheValid(this.cachedLocation, this.defaultOptions.cacheMaxAge!)) {
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

  /**
   * ACCURACY HELPERS
   */
  private calculateConfidence(accuracy: number, timestamp: number): LocationConfidence {
    const age = Date.now() - timestamp;

    if (accuracy < 50 && age < 300000) return 'high';      // <50m, <5min
    if (accuracy < 1000 && age < 1800000) return 'medium'; // <1km, <30min
    if (accuracy < 10000) return 'low';                    // <10km
    return 'unknown';
  }

  private estimateIPAccuracy(city?: string, region?: string): number {
    // Urban areas typically have better IP geolocation
    const urbanCities = ['minneapolis', 'saint paul', 'duluth', 'rochester', 'bloomington', 'st. paul'];
    const cityName = city?.toLowerCase() || '';
    const regionName = region?.toLowerCase() || '';

    // Minnesota-specific accuracy improvements
    if (regionName.includes('minnesota') || regionName.includes('mn')) {
      if (urbanCities.some(city => cityName.includes(city))) {
        return 3000; // ~3km for Minnesota urban areas (better ISP mapping)
      }
      return 15000; // ~15km for rural Minnesota
    }

    // General urban vs rural classification
    if (urbanCities.includes(cityName) || cityName.includes('minneapolis') || cityName.includes('paul')) {
      return 5000; // ~5km for urban areas
    }
    return 25000; // ~25km for rural areas
  }

  private calculateIPConfidence(city?: string, region?: string, country?: string): LocationConfidence {
    // Higher confidence for areas with known good IP geolocation
    const hasCity = city && city.toLowerCase() !== 'unknown';
    const hasRegion = region && region.toLowerCase() !== 'unknown';
    const isMinnesota = region?.toLowerCase().includes('minnesota') || region?.toLowerCase().includes('mn');
    const isUS = country?.toLowerCase().includes('us') || country?.toLowerCase().includes('united states');

    if (isMinnesota && hasCity) {
      return 'medium'; // Good confidence for Minnesota cities
    } else if (isUS && hasCity && hasRegion) {
      return 'low'; // Basic confidence for US cities with region
    } else if (hasCity || hasRegion) {
      return 'low'; // Some confidence with partial location data
    } else {
      return 'unknown'; // No confidence without location details
    }
  }

  private scoreEstimate(estimate: LocationEstimate): number {
    const confidenceScores = { 'high': 100, 'medium': 75, 'low': 50, 'unknown': 25 };
    const methodScores = { 'gps': 100, 'network': 80, 'manual': 75, 'cached': 60, 'ip': 40, 'fallback': 10, 'none': 0 };
    const ageScore = Math.max(0, 100 - (Date.now() - estimate.timestamp) / 60000); // Decay over time
    const accuracyScore = Math.max(0, 100 - Math.log10(estimate.accuracy));

    return (
      confidenceScores[estimate.confidence] * 0.3 +
      methodScores[estimate.method] * 0.3 +
      accuracyScore * 0.2 +
      ageScore * 0.2
    );
  }

  private isCacheValid(location: LocationEstimate, maxAge: number): boolean {
    return (Date.now() - location.timestamp) < maxAge;
  }

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

// Singleton instance for app-wide use
export const locationEstimator = new UserLocationEstimator();
