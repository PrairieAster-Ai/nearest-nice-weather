/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEV_PORT: string
  readonly VITE_DEV_HOST: string
  readonly VITE_API_PROXY_URL: string
  readonly VITE_API_PROXY_SECURE: string
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly VITE_OPENSTREETMAP_ATTRIBUTION: string
  readonly VITE_ENABLE_MONITORING: string
  readonly VITE_MONITORING_DSN: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}