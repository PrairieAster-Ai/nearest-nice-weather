# API Endpoint Cleanup Plan

## Immediate Actions (Phase 1)
1. **Remove dangerous debug endpoints** from production Vercel functions:
   - [ ] Delete `apps/web/api/clear-all-data.js`
   - [ ] Delete `apps/web/api/db-migrate.js`
   - [ ] Delete `apps/web/api/create-poi-schema.js`
   - [ ] Delete `apps/web/api/debug-env.js`
   - [ ] Delete `apps/web/api/auth-bypass.js`
   - [ ] Delete `apps/web/api/poi-locations-broken.js`
   - [ ] Delete `apps/web/api/debug-migrations.js`

2. **Remove deprecated endpoints**:
   - [ ] Delete `apps/web/api/weather-locations.js`
   - [ ] Delete `apps/web/api/poi-locations.js`
   - [ ] Delete `apps/web/api/poi-locations-debug.js`
   - [ ] Remove `useWeatherSearch` hook and tests

## Cleanup Actions (Phase 2)
3. **Clean up localhost API** (`dev-api-server.js`):
   - [ ] Remove `/api/test-db` endpoint
   - [ ] Remove `/api/create-poi-schema` endpoint
   - [ ] Remove `/api/insert-sample-pois` endpoint
   - [ ] Remove `/api/poi-locations` endpoint (keep only `-with-weather`)

4. **Documentation update**:
   - [ ] Update CLAUDE.md with final API endpoints
   - [ ] Document the 3 production endpoints only

## Final Production API Surface
After cleanup, only these endpoints should exist:
- **`GET /api/poi-locations-with-weather`** - POI discovery with weather
- **`POST /api/feedback`** - User feedback submission
- **`GET /api/health`** - System health check

## Testing Impact
- Update Playwright tests to remove references to deprecated endpoints
- Focus testing on the 3 production endpoints
- Add explicit tests for `/api/poi-locations-with-weather` (currently missing)

## Security Benefits
- Reduces attack surface by ~80%
- Removes data manipulation endpoints
- Eliminates environment variable exposure
- Prevents accidental data deletion

## Implementation Priority
**HIGH PRIORITY**: Remove dangerous endpoints immediately (Phase 1)
**MEDIUM PRIORITY**: Clean up deprecated endpoints (Phase 2)
**LOW PRIORITY**: Update documentation after cleanup