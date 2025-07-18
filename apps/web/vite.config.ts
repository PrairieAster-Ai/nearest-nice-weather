import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import vitePluginVercelApi from 'vite-plugin-vercel-api'

export default defineConfig({
  plugins: [
    react({
      // React 18 LTS with classic JSX runtime for stability
      jsxRuntime: 'automatic'
    }),
    // Serve Vercel API routes locally during development
    vitePluginVercelApi({
      // API directory relative to the current working directory (apps/web)
      apiDir: 'api'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      disable: true,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v3',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Nearest Nice Weather',
        short_name: 'Nice Weather',
        description: 'Find the nearest locations with your perfect weather conditions',
        theme_color: '#7563A8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      }
    }),
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  server: {
    port: parseInt(process.env.DEV_PORT || process.env.VITE_DEV_PORT || '3001'),
    host: process.env.DEV_HOST || process.env.VITE_DEV_HOST || '0.0.0.0',
    hmr: {
      port: parseInt(process.env.DEV_PORT || process.env.VITE_HMR_PORT || '3001'),
      host: 'localhost'
    }
    // Proxy removed - API routes now served directly by vite-plugin-vercel-api
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    target: 'es2018',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Enhanced cache busting with build-time timestamp
        entryFileNames: (_chunkInfo) => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Math.random().toString(36).slice(2, 10)
          return `assets/[name]-[hash]-${buildId}.js`
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Math.random().toString(36).slice(2, 10)
          if (facadeModuleId) {
            if (facadeModuleId.includes('components/features/')) {
              return `assets/features/[name]-[hash]-${buildId}.js`
            }
            if (facadeModuleId.includes('components/ui/')) {
              return `assets/ui/[name]-[hash]-${buildId}.js`
            }
          }
          return `assets/[name]-[hash]-${buildId}.js`
        },
        assetFileNames: (assetInfo) => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Math.random().toString(36).slice(2, 10)
          if (assetInfo.name?.endsWith('.css')) {
            return `assets/styles/[name]-[hash]-${buildId}[extname]`
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|ico)$/)) {
            return `assets/images/[name]-[hash]-${buildId}[extname]`
          }
          return `assets/[name]-[hash]-${buildId}[extname]`
        },
        // Separate vendor chunks for better caching and performance
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group major dependencies for optimal caching
            if (id.includes('@mui/')) return 'mui';
            if (id.includes('react') || id.includes('react-dom')) return 'react';
            if (id.includes('leaflet')) return 'leaflet';
            if (id.includes('@tanstack/react-query')) return 'query';
            return 'vendor';
          }
        }
      }
    },
    // Enhanced performance budgets and monitoring
    chunkSizeWarningLimit: 800, // 800KB warning for chunks (stricter than default)
    reportCompressedSize: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})