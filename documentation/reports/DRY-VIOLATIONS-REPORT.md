# DRY Violations Report - Nearest Nice Weather

## Critical DRY Violations Requiring Immediate Attention

### 1. Haversine Distance Formula (5+ duplications)
**Files affected:**
- `/dev-api-server.js` (4 instances)
- `/apps/web/api/weather-locations.js`
- `/apps/web/src/hooks/usePOINavigation.ts`
- `/apps/web/src/App.tsx`

**Issue**: Identical distance calculation formula repeated throughout codebase
```javascript
3959 * acos(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) + sin(radians(lat1)) * sin(radians(lat2)))
```

**Recommendation**: Extract to shared utility function

### 2. Dual API Architecture (60% code duplication)
**Major duplications:**
- Weather locations endpoint: 95% identical
- POI locations endpoint: 90% identical  
- Feedback endpoint: 85% identical

**Files:**
- Localhost: `/dev-api-server.js`
- Production: `/apps/web/api/*.js`

**Maintenance burden**: 2-4 hours/week keeping implementations in sync

### 3. CORS Headers (29 files)
**Pattern repeated in every API endpoint:**
```javascript
res.setHeader('Access-Control-Allow-Origin', '*')
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
```

### 4. HTTP Method Validation (20+ instances)
**Identical pattern:**
```javascript
if (req.method !== 'GET') {
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
```

### 5. Error Response Format (All API endpoints)
**Repeated structure:**
```javascript
res.status(500).json({
  success: false,
  error: 'Failed to retrieve data',
  debug: process.env.NODE_ENV === 'development' ? error.message : undefined
})
```

## Immediate Action Items

1. **Create shared utilities module** with:
   - `calculateDistance()` function
   - `setCORSHeaders()` function
   - `validateHTTPMethod()` function
   - `sendErrorResponse()` function

2. **Document sync requirements** between localhost and Vercel implementations

3. **Add automated tests** to verify API parity between environments

## Long-term Recommendation

Consider migrating to a single API implementation post-MVP to eliminate the dual architecture maintenance burden.