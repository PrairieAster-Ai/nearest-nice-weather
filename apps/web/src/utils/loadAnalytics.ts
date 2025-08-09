/**
 * Dynamic Umami Analytics Script Loader
 * Loads analytics script based on environment variables
 */

interface UmamiConfig {
  scriptUrl: string;
  websiteId: string;
  domains: string;
}

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