/**
 * Vercel deploys serverless functions from this repo-root `api/` directory
 * (project rootDirectory = repo root). The real implementation lives in
 * `apps/web/api/` alongside the rest of the web app. This file is a thin
 * re-export so there is a SINGLE source of truth — no manual sync between
 * `api/` and `apps/web/api/`.
 *
 * @see apps/web/api/feedback.js
 */
export { default } from '../apps/web/api/feedback.js'
