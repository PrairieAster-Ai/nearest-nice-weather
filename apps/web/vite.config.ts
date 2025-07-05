import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
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
    port: parseInt(process.env.VITE_DEV_PORT || '3003'),
    host: process.env.VITE_DEV_HOST || '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_URL || 'http://localhost:4000',
        changeOrigin: true,
        secure: process.env.VITE_API_PROXY_SECURE === 'true'
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Material-UI ecosystem
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor'
            }
            // Map libraries
            if (id.includes('leaflet')) {
              return 'map-vendor'
            }
            // Query and state management
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            // Validation libraries
            if (id.includes('zod')) {
              return 'validation-vendor'
            }
            // Everything else
            return 'vendor'
          }
          
          // App chunks
          if (id.includes('/components/ui/')) {
            return 'ui-components'
          }
          if (id.includes('/components/features/')) {
            return 'feature-components'
          }
          if (id.includes('/services/')) {
            return 'services'
          }
          if (id.includes('/hooks/')) {
            return 'hooks'
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('components/features/')) {
              return 'assets/features/[name]-[hash].js'
            }
            if (facadeModuleId.includes('components/ui/')) {
              return 'assets/ui/[name]-[hash].js'
            }
          }
          return 'assets/[name]-[hash].js'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/styles/[name]-[hash][extname]'
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|ico)$/)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    // Performance budgets
    chunkSizeWarningLimit: 1000, // 1MB warning for chunks
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})