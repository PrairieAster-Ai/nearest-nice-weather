# Vercel Deployment Troubleshooting Guide

**Created**: July 13, 2025
**Last Updated**: July 13, 2025
**Purpose**: Prevent API deployment issues that caused 4+ hour debugging session

## 🚨 Common Issues & Solutions

### **Issue 1: API Functions Return 404 (Not Found)**

**Symptoms**:
- `curl https://domain.com/api/endpoint` returns "The page could not be found"
- Vercel deployment succeeds but APIs are inaccessible

**Root Causes & Solutions**:

1. **Wrong Directory Structure**
   ```bash
   # ❌ WRONG - APIs not discovered
   /api/health.js (project root)

   # ✅ CORRECT - APIs discovered by Vercel
   /apps/web/api/health.js
   ```

2. **Incorrect Export Format**
   ```javascript
   // ❌ WRONG - CommonJS not compatible
   module.exports = async function handler(req, res) {}

   // ✅ CORRECT - ES6 exports for Vercel
   export default async function handler(req, res) {}
   ```

3. **Conflicting Rewrite Rules**
   ```json
   // ❌ WRONG - Conflicts with auto-discovery
   "rewrites": [
     {"source": "/api/(.*)", "destination": "/api/$1"}
   ]

   // ✅ CORRECT - Let Vercel auto-discover
   "rewrites": [
     {"source": "/(.*)", "destination": "/index.html"}
   ]
   ```

### **Issue 2: Database Connection Failures**

**Symptoms**:
- APIs return `FUNCTION_INVOCATION_FAILED`
- Database queries timeout or fail

**Root Causes & Solutions**:

1. **Wrong Database Driver**
   ```javascript
   // ❌ WRONG - pg driver incompatible with serverless
   import { Pool } from 'pg'
   const pool = new Pool({connectionString: process.env.DATABASE_URL})

   // ✅ CORRECT - Neon serverless driver
   import { neon } from '@neondatabase/serverless'
   const sql = neon(process.env.WEATHERDB_URL)
   ```

2. **Environment Variable Mismatch**
   ```bash
   # ❌ WRONG - Multiple conflicting variables
   DATABASE_URL=postgresql://localhost:5432/local_db
   POSTGRES_URL=postgresql://neon_host/cloud_db

   # ✅ CORRECT - Single consistent variable
   WEATHERDB_URL=postgresql://neon_host/weather_db
   ```

3. **Environment Variable Not Set in Correct Project**
   - Check: Vercel Dashboard → Project → Settings → Environment Variables
   - Verify: Variable exists for target environment (Production/Preview)
   - Test: Redeploy after adding environment variables

### **Issue 3: Authentication Blocking Production APIs**

**Symptoms**:
- APIs redirect to Vercel authentication page
- Production APIs require login

**Root Cause & Solution**:
```
Vercel Project Settings → Deployment Protection → Authentication
❌ WRONG: "All Deployments"
✅ CORRECT: "Only Preview Deployments"
```

### **Issue 4: Environment Variable Confusion**

**Symptoms**:
- Local works, production fails
- Database connections work intermittently

**Prevention Checklist**:
1. **Use single, consistent variable name** (`WEATHERDB_URL`)
2. **Never mix local and cloud connections** in same environment
3. **Document which database each variable points to**
4. **Test environment variables** via health endpoint debug info

## 🔧 Pre-Deployment Validation

### **API Function Checklist**
```bash
# 1. Verify file location
ls apps/web/api/
# Should show: health.js, weather-locations.js, test-db.js

# 2. Check export syntax
grep -n "export default" apps/web/api/*.js
# Should show ES6 export statements

# 3. Verify serverless driver
grep -n "@neondatabase/serverless" apps/web/api/*.js
# Should show Neon imports, not pg imports

# 4. Test locally first
npm run dev
curl http://localhost:3002/api/health
```

### **Environment Variable Validation**
```bash
# 1. Check variable consistency
echo $WEATHERDB_URL
# Should be single Neon database connection string

# 2. Verify in Vercel dashboard
# Go to: vercel.com/project/settings/environment-variables
# Confirm: WEATHERDB_URL exists for Production

# 3. Test after deployment
curl https://deployment-url/api/health
# Check debug.has_weatherdb_url: true
```

## 📋 Emergency Recovery Procedures

### **If APIs are completely broken**:
1. **Identify working baseline**: Use `git log` to find last working commit
2. **Check environment variables**: Verify database connections in Vercel
3. **Test simple endpoint first**: Start with `/api/health` before complex queries
4. **Use direct deployment URLs**: Test `web-xxx.vercel.app` before custom domain

### **If database queries fail**:
1. **Verify database exists**: Connect via Neon console
2. **Check table schema**: Ensure `locations`, `weather_conditions` tables exist
3. **Test connection**: Use `/api/test-db` endpoint first
4. **Rebuild if necessary**: Use provided SQL rebuild script

## 🎯 Success Criteria

**APIs are working correctly when**:
- ✅ `GET /api/health` returns 200 with JSON
- ✅ `GET /api/test-db` connects to database successfully
- ✅ `GET /api/weather-locations?limit=3` returns Minnesota location data
- ✅ All 4 persona workflows can access their required weather data
- ✅ Response times under 3 seconds for rural network compatibility

## 📊 Monitoring & Alerts

**Add to monitoring dashboard**:
- API response time alerts (>3s threshold)
- Database connection failure alerts
- 404 error rate monitoring on `/api/*` endpoints
- Environment variable validation in health checks

---

**Remember**: Most API deployment issues stem from environment variable management and serverless architecture incompatibility. Always verify these first before debugging complex issues.
