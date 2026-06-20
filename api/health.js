/**
 * Vercel deploys serverless functions from this repo-root `api/` directory.
 * Thin re-export of the real implementation in `apps/web/api/` so there is a
 * single source of truth (no manual sync).
 *
 * @see apps/web/api/health.js
 */
export { default } from '../apps/web/api/health.js'
