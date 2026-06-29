/**
 * Dynamic Umami Analytics Script Loader
 * Loads analytics script based on environment variables
 */

/** Resolved Umami configuration needed to inject the analytics script tag. */
interface UmamiConfig {
  /** URL of the hosted Umami tracker script. */
  scriptUrl: string;
  /** Umami website id this deployment reports under. */
  websiteId: string;
  /** Comma-separated allowlist of domains Umami should track. */
  domains: string;
}

/**
 * Read Umami settings from Vite env vars.
 * @returns A complete {@link UmamiConfig}, or `null` when the required env vars are absent (analytics disabled).
 */
const getUmamiConfig = (): UmamiConfig | null => {
  const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL;
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

  if (!scriptUrl || !websiteId) {
    console.log('📊 Umami Analytics: Environment variables not set, analytics disabled');
    return null;
  }

  return {
    scriptUrl,
    websiteId,
    domains: 'nearestniceweather.com,localhost'
  };
};

/**
 * Lazily inject the Umami analytics script, once, based on environment config.
 *
 * Resolves rather than rejects on every outcome so callers never need a try/catch:
 * the boolean tells you whether tracking is active.
 *
 * @returns A promise resolving `true` when the script is loaded (or already present),
 * and `false` when analytics is disabled (missing env vars) or the script failed to load.
 * @example
 * ```ts
 * const tracking = await loadUmamiAnalytics();
 * if (tracking) console.log('Umami active');
 * ```
 */
export const loadUmamiAnalytics = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const config = getUmamiConfig();

    if (!config) {
      resolve(false);
      return;
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src="${config.scriptUrl}"]`)) {
      console.log('📊 Umami Analytics: Script already loaded');
      resolve(true);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.src = config.scriptUrl;
    script.setAttribute('data-website-id', config.websiteId);
    script.setAttribute('data-domains', config.domains);
    script.setAttribute('data-cache', 'false');

    script.onload = () => {
      console.log('📊 Umami Analytics: Script loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.error('📊 Umami Analytics: Failed to load script');
      resolve(false);
    };

    // Add to document head
    document.head.appendChild(script);
  });
};
