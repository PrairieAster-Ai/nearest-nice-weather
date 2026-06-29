/**
 * ========================================================================
 * IP GEOLOCATION - CITY/REGION LOCATION VIA ipapi.co
 * ========================================================================
 *
 * Extracted from UserLocationEstimator. Queries the ipapi.co IP-geolocation
 * service, normalizes the response to a LocationEstimate via the shared
 * scoring/accuracy helpers, and returns the best-scored result.
 *
 * The provider list is kept as an array so additional providers can be added
 * later (every response is scored and the best is chosen), but today only
 * ipapi.co is wired up — it is the one provider that works from an HTTPS origin
 * without an API key. Two previously-listed providers were removed because they
 * could never succeed in production:
 *   - ip-api.com is HTTP-only → blocked as mixed-content on the HTTPS app.
 *   - api.ipgeolocation.io requires an `apiKey` query param → returns 401.
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
  }
];

/**
 * Query the configured IP-geolocation provider(s) and return the best-scored
 * estimate. Throws if every provider fails or returns unusable data.
 *
 * Currently a single provider (ipapi.co) is configured; the array/scoring shape
 * is retained so more providers can be added without changing the call site.
 */
export async function fetchIPLocation(): Promise<LocationEstimate> {
  // Query each configured provider (today: ipapi.co), score the responses,
  // and pick the best. Structured for parallel fan-out if more are added.
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
