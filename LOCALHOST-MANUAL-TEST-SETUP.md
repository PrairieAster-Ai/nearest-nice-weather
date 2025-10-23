# Localhost Manual Test Setup - October 23, 2025

**Created**: October 23, 2025
**Purpose**: Document localhost instance setup for manual testing without interfering with other projects
**Status**: ✅ Operational (frontend + API running)

---

## 🎯 Setup Objectives

- Create isolated localhost environment for Nearest Nice Weather testing
- Avoid port conflicts with other running projects
- Document environment configuration for future reference
- Validate Wiki documentation changes in live environment

---

## ✅ Current Status

### Services Running

**API Server**:
- **Port**: 4000
- **PID**: 901083
- **Health Endpoint**: http://localhost:4000/api/health
- **Status**: ✅ Operational
- **Log File**: `/tmp/api-server.log`

**Frontend Server**:
- **Port**: 3001 (Vite default)
- **URL**: http://localhost:3001/
- **Network**: http://192.168.1.75:3001/
- **Status**: ✅ Operational
- **Log File**: `/tmp/frontend-server.log`

### Health Check Results

```bash
# API Health Check
curl -s http://localhost:4000/api/health
{
  "success": true,
  "message": "API server is running",
  "timestamp": "2025-10-23T21:15:03.409Z",
  "port": 4000
}

# Frontend Check
curl -s http://localhost:3001 | head -20
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Nearest Nice Weather</title>
    <meta name="description" content="Find the nearest locations with your perfect weather conditions" />
```

---

## ⚠️ Database Configuration Note

**Issue**: `.env` file contains placeholder database credentials (masked for security).

**Impact**: POI endpoints will fail with database connection error until actual Neon credentials are added.

**Resolution Required**: Update `.env` with actual Neon development branch credentials.

**Workaround**: Frontend UI is fully functional for visual testing and navigation testing without database connectivity.

---

## 🚀 Startup Commands Used

### Manual Startup (Used for This Session)

```bash
# 1. Start API server in background
node dev-api-server.js > /tmp/api-server.log 2>&1 &
echo "API Server started with PID: $!"

# 2. Start frontend server in background
cd apps/web && npm run dev > /tmp/frontend-server.log 2>&1 &
echo "Frontend server started with PID: $!"

# 3. Verify services are running
lsof -i :4000 | grep LISTEN  # API server
lsof -i :3001 | grep LISTEN  # Frontend server

# 4. Test health endpoints
curl -s http://localhost:4000/api/health | jq '.'
curl -s http://localhost:3001 | head -20
```

### Alternative: Unified Startup Script

```bash
# Standard startup (requires configured .env)
npm start

# This runs dev-startup-optimized.sh which:
# - Validates environment
# - Starts API server on port 4000
# - Starts frontend server on port 3001
# - Monitors both services with health checks
```

---

## 📋 Port Configuration

### Standard Ports (No Conflicts)

| Service | Port | Status | URL |
|---------|------|--------|-----|
| **API Server** | 4000 | ✅ Running | http://localhost:4000 |
| **Frontend** | 3001 | ✅ Running | http://localhost:3001 |

### Attempted Custom Ports (Failed)

**Attempted**: DEV_PORT=5001, API_PORT=5002
**Issue**: `dev-api-server.js` doesn't read `API_PORT` environment variable
**Result**: Used standard ports instead

**Note**: Standard ports (3001, 4000) were available and no conflicts with other projects.

---

## 🧪 Testing Capabilities

### ✅ Available Tests (No Database Required)

1. **Frontend UI Testing**
   - Navigate to http://localhost:3001
   - Test responsive design
   - Verify Material-UI components rendering
   - Check PWA manifest and service worker
   - Test navigation and routing

2. **API Health Checks**
   - Test API server responsiveness
   - Verify CORS configuration
   - Check API endpoint availability

3. **Build System Testing**
   - Vite hot reload functionality
   - React component updates
   - CSS/styling changes
   - Asset loading

### ⚠️ Limited Tests (Require Database)

1. **POI Endpoint Testing** - Requires DATABASE_URL configuration
2. **Weather Integration** - Requires DATABASE_URL and OpenWeather API key
3. **Feedback Submission** - Requires DATABASE_URL
4. **User Location Features** - Requires DATABASE_URL for POI queries

---

## 🔧 Environment Configuration

### Required Environment Variables (from .env)

```bash
# Database Configuration (REQUIRED for full functionality)
DATABASE_URL="postgresql://[actual-credentials]"

# Weather API (REQUIRED for weather features)
OPENWEATHER_API_KEY="[actual-api-key]"

# Optional Configuration
NODE_ENV="development"
DEV_PORT=3001  # Frontend port
```

### Current .env Status

- ✅ File exists: `/home/robertspeer/Projects/GitRepo/nearest-nice-weather/.env`
- ⚠️ DATABASE_URL: Contains placeholder credentials
- ⚠️ OPENWEATHER_API_KEY: Not verified
- ✅ NODE_ENV: Set to development

---

## 📊 Service Management

### Check Service Status

```bash
# Check running processes
lsof -i :3001 -i :4000 | grep LISTEN

# View API logs
tail -f /tmp/api-server.log

# View frontend logs
tail -f /tmp/frontend-server.log
```

### Stop Services

```bash
# Find PIDs
lsof -i :4000 | grep LISTEN | awk '{print $2}'  # API server PID
lsof -i :3001 | grep LISTEN | awk '{print $2}'  # Frontend PID

# Kill services
kill [API_PID]
kill [FRONTEND_PID]

# Or kill all Node processes (nuclear option)
pkill -f "node dev-api-server.js"
pkill -f "vite"
```

### Restart Services

```bash
# Quick restart
pkill -f "node dev-api-server.js" && node dev-api-server.js > /tmp/api-server.log 2>&1 &
pkill -f "vite" && cd apps/web && npm run dev > /tmp/frontend-server.log 2>&1 &

# Or use unified startup script
npm start
```

---

## 🎯 Testing Workflow

### For Wiki Documentation Validation

1. **Start Services** (completed above)
2. **Open Frontend**: http://localhost:3001
3. **Verify UI Elements**:
   - Check branding and titles match Wiki documentation
   - Verify "Nearest Nice Weather" appears correctly
   - Test navigation and user flow
   - Validate responsive design claims

4. **Test API Endpoints**:
   - Health check: http://localhost:4000/api/health ✅ Working
   - POI locations: http://localhost:4000/api/poi-locations-with-weather ⚠️ Requires DB

5. **Document Findings**:
   - Capture screenshots if needed
   - Note any discrepancies with Wiki documentation
   - Update Wiki if UI/UX doesn't match claims

---

## 🔍 Troubleshooting

### Issue: API Returns Database Connection Error

**Symptom**: POI endpoints return "getaddrinfo ENOTFOUND ep-development-xxxxx.region.neon.tech"

**Cause**: Placeholder DATABASE_URL in .env file

**Solution**:
```bash
# Option 1: Update .env with actual Neon credentials
# Contact project owner for development branch credentials

# Option 2: Test frontend-only functionality
# Frontend UI works independently of database
```

### Issue: Port Already in Use

**Symptom**: "EADDRINUSE: address already in use"

**Solution**:
```bash
# Find and kill conflicting process
lsof -i :3001 | grep LISTEN
kill [PID]

# Or use different port
export DEV_PORT=3002
cd apps/web && npm run dev
```

### Issue: Frontend Shows Blank Screen

**Symptom**: http://localhost:3001 loads but shows blank page

**Solution**:
```bash
# Check browser console for errors
# Verify logs:
tail -f /tmp/frontend-server.log

# Common fixes:
npm install  # Reinstall dependencies
rm -rf node_modules/.vite  # Clear Vite cache
npm run dev  # Restart frontend
```

---

## 📚 Related Documentation

### Wiki Documentation (Validated)

- **[Investment-One-Pager](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Investment-One-Pager)** - Updated with current traction
- **[Executive-Summary-Quick](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Executive-Summary-Quick)** - B2C-only focus
- **[Financial-Projections](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Financial-Projections)** - Conservative projections
- **[Architecture-Overview](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Architecture-Overview)** - Technical stack

### Local Documentation

- **[Wiki-Editing-Lessons-Learned](https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki/Docs/guides/Wiki-Editing-Lessons-Learned)** - Created today
- **CLAUDE.md** - Development guidelines
- **SESSION-HANDOFF.md** - Session context

---

## ✅ Completion Checklist

- [x] API server started successfully (port 4000)
- [x] Frontend server started successfully (port 3001)
- [x] Health checks verified
- [x] Services running in background
- [x] Logs captured for debugging
- [x] No port conflicts with other projects
- [ ] Database credentials configured (requires user action)
- [ ] Full POI endpoint testing (blocked by database)
- [ ] Weather API integration testing (blocked by database)

---

## 🎓 Lessons Learned

### For Future Localhost Setup

1. **Check Port Availability First**: Use `lsof` to verify ports before starting
2. **Manual Background Processes Work**: Simple `&` backgrounding is reliable
3. **Log Files Are Essential**: Capture stdout/stderr to `/tmp/*.log` for debugging
4. **Environment Variables Matter**: `.env` must have real credentials for full functionality
5. **Frontend Can Test Independently**: UI testing doesn't require database connectivity
6. **Standard Ports Preferred**: Custom ports may not work without code changes

### For Development Workflow

1. **Health Checks First**: Always verify `/api/health` before testing features
2. **Database Dependency**: Many features require valid DATABASE_URL
3. **Service Isolation**: Background processes allow independent service management
4. **Log Monitoring**: Use `tail -f` on log files for real-time debugging

---

## 🚀 Next Steps

### For Manual Testing

1. **Configure Database**: Update `.env` with actual Neon development credentials
2. **Test POI Endpoints**: Verify database connectivity and POI queries
3. **Visual Testing**: Navigate frontend UI and validate against Wiki claims
4. **Screenshot Capture**: Document UI state for Wiki validation

### For Documentation

1. **Update Wiki If Needed**: Based on manual testing findings
2. **Document UI/UX State**: Capture current user experience
3. **Validate Claims**: Cross-reference Wiki documentation with live localhost

---

**Document Status**: Active localhost session running
**Services**: API (port 4000) + Frontend (port 3001)
**Database**: Not configured (placeholder credentials)
**Ready For**: Frontend UI testing and navigation validation

**To Stop Services**:
```bash
pkill -f "node dev-api-server.js"
pkill -f "vite"
```

**To View Live Application**:
- Frontend: http://localhost:3001
- API Health: http://localhost:4000/api/health
