/**
 * ========================================================================
 * IP GEOLOCATION - MULTI-PROVIDER CITY/REGION LOCATION
 * ========================================================================
 *
 * Extracted from UserLocationEstimator. Queries several IP-geolocation
 * providers in parallel, normalizes their responses to a LocationEstimate via
 * the shared scoring/accuracy helpers, and returns the best-scored result.
 *
 * Pure of component/service state — depends only on fetch + the pure helpers in
 * locationEstimationUtils, so it is independently unit-testable.
 * ========================================================================
 */

import {
  estimateIPAccuracy,
  calculateIPConfidence,
  scoreEstimate,
  type LocationEstimate,
} from '../utils/locationEstimationUtils';

interface NetworkLocationProvider {
  name: string;
  endpoint: string;
  parser: (response: any) => LocationEstimate | null;
}

const PROVIDERS: NetworkLocationProvider[] = [
  {
    name: 'ipapi',
    endpoint: 'https://ipapi.co/json/',
    parser: (data) => {
      if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
        return {
          coordinates: [data.latitude, data.longitude],
          accuracy: estimateIPAccuracy(data.city, data.region),
          method: 'ip',
          timestamp: Date.now(),
          confidence: calculateIPConfidence(data.city, data.region, data.country_code),
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
          accuracy: estimateIPAccuracy(data.city, data.region),
          method: 'ip',
          timestamp: Date.now(),
          confidence: calculateIPConfidence(data.city, data.region, data.country),
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
          accuracy: estimateIPAccuracy(data.city, data.state_prov),
          method: 'ip',
          timestamp: Date.now(),
          confidence: calculateIPConfidence(data.city, data.state_prov, data.country_code2),
          source: `ipgeolocation_${data.city || 'unknown'}`
        };
      }
      return null;
    }
  }
];

/**
 * Query all IP-geolocation providers in parallel and return the best-scored
 * estimate. Throws if every provider fails or returns unusable data.
 */
export async function fetchIPLocation(): Promise<LocationEstimate> {
  // Try multiple providers in parallel for speed and reliability
  const providerPromises = PROVIDERS.map(async (provider) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per provider

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`IP provider ${provider.name} failed:`, errorMessage);
      return { provider: provider.name, estimate: null, error: errorMessage };
    }
  });

  const results = await Promise.allSettled(providerPromises);

  // Collect all successful estimates
  const successfulEstimates = results
    .filter((result): result is PromiseFulfilledResult<any> =>
      result.status === 'fulfilled' && result.value.estimate !== null
    )
    .map(result => result.value.estimate as LocationEstimate);

  if (successfulEstimates.length > 0) {
    const bestEstimate = successfulEstimates
      .sort((a, b) => scoreEstimate(b) - scoreEstimate(a))[0];

    console.log(`📍 Selected best IP location: ${bestEstimate.source} (${successfulEstimates.length} providers responded)`);
    return bestEstimate;
  }

  // Log all failures for debugging
  const failedProviders = results.map((result, i) => ({
    name: PROVIDERS[i].name,
    error: result.status === 'fulfilled' ? result.value.error : result.reason.message
  }));

  console.warn('All IP geolocation providers failed:', failedProviders);
  throw new Error(`IP geolocation unavailable: ${failedProviders.map(p => `${p.name}: ${p.error}`).join(', ')}`);
}
