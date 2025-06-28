/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Force cache busting for all static assets
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  
  // Add cache busting to asset URLs
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Configure headers for cache control
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // Webpack configuration for additional cache busting
  webpack: (config, { buildId, dev }) => {
    if (dev) {
      // In development, add timestamp to chunk names
      config.output.filename = `static/chunks/[name].${Date.now()}.js`
      config.output.chunkFilename = `static/chunks/[name].${Date.now()}.js`
    }
    
    return config
  },
}

module.exports = nextConfig