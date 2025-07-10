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
    port: parseInt(process.env.DEV_PORT || process.env.VITE_DEV_PORT || '3001'),
    host: process.env.DEV_HOST || process.env.VITE_DEV_HOST || '0.0.0.0',
    hmr: {
      port: parseInt(process.env.DEV_PORT || process.env.VITE_HMR_PORT || '3001'),
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_URL || 'https://www.nearestniceweather.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxying API request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, _req) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          });
        }
      }
    }
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