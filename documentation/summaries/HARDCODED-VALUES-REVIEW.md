# Hardcoded Values Review & Remediation Plan

## Executive Summary

Our codebase analysis revealed **42 hardcoded values** that should be environment variables for better flexibility, security, and deployment across different environments. While the codebase shows good practices with extensive environment variable usage, several critical values remain hardcoded.

## Priority Classification

### 🔴 **Critical (Fix Immediately)**
**Security & Stability Issues**

1. **CORS Origins** (`application/app/main.py:16`)
   ```python
   # Current: allow_origins=["http://localhost:3000"]
   # Should be: allow_origins=os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
   ```
   - **Risk**: Production CORS failures
   - **Env Var**: `CORS_ALLOWED_ORIGINS="https://app.com,https://www.app.com"`

2. **Database/Redis Fallbacks** (`application/app/main.py:45,59`)
   ```python
   # Current: Hardcoded fallback URLs
   # Should be: Fail gracefully or use secure fallbacks
   ```
   - **Risk**: Security exposure, wrong database connections
   - **Fix**: Remove fallbacks, require proper env vars

3. **Docker Image Versions** (`docker-compose.yml`)
   ```yaml
   # Current: directus/directus:10.10.4
   # Should be: directus/directus:${DIRECTUS_VERSION:-10.10.4}
   ```
   - **Risk**: Security vulnerabilities, version management issues

### 🟡 **High Priority (Fix This Week)**
**Flexibility & Configuration**

4. **API Endpoints** (`apps/web/src/App.tsx:70`)
   ```typescript
   // Current: '/api/weather-search'
   // Should be: `${process.env.NEXT_PUBLIC_API_BASE_URL}/weather-search`
   ```
   - **Env Var**: `NEXT_PUBLIC_API_BASE_URL="/api"`

5. **Development Ports** (`vite.config.ts:45`, `package.json`)
   ```typescript
   // Current: port: 3002
   // Should be: port: parseInt(process.env.VITE_DEV_PORT || '3002')
   ```
   - **Env Vars**: `VITE_DEV_PORT=3002`, `FASTAPI_PORT=8000`, `VERCEL_API_PORT=4000`

6. **Database Connection Pool** (`api/analytics.ts:8-10`)
   ```typescript
   // Current: max: 10, idleTimeoutMillis: 30000
   // Should be: Use environment variables
   ```
   - **Env Vars**: `DB_POOL_MAX=10`, `DB_POOL_IDLE_TIMEOUT=30000`

### 🟢 **Medium Priority (Next Sprint)**
**User Experience & Maps**

7. **Map Configuration** (`apps/web/src/App.tsx:170-175`)
   ```typescript
   // Current: [46.7296, -94.6859], zoom: 6
   // Should be: Environment configurable
   ```
   - **Env Vars**: `NEXT_PUBLIC_MAP_CENTER_LAT=46.7296`, `NEXT_PUBLIC_MAP_ZOOM=6`

8. **CDN URLs** (`apps/web/src/App.tsx:23-25`)
   ```typescript
   // Current: Hardcoded Leaflet CDN
   // Should be: Configurable CDN base URL
   ```
   - **Env Var**: `NEXT_PUBLIC_CDN_BASE_URL="https://cdnjs.cloudflare.com"`

### 🔵 **Low Priority (Future Backlog)**
**Infrastructure & Maintenance**

9. **Docker Network Configuration**
10. **Container Names & Paths**
11. **Rate Limiting Granularity**

## Implementation Plan

### Phase 1: Critical Security Fixes (Today)

#### 1. Fix CORS Configuration
```typescript
// apps/web/src/App.tsx - Add environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// application/app/main.py - Fix CORS
CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
)
```

#### 2. Remove Dangerous Fallbacks
```python
# application/app/main.py - Remove fallbacks
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

REDIS_URL = os.getenv("REDIS_URL") 
if not REDIS_URL:
    raise ValueError("REDIS_URL environment variable is required")
```

#### 3. Parameterize Docker Versions
```yaml
# docker-compose.yml - Use environment variables
services:
  directus:
    image: directus/directus:${DIRECTUS_VERSION:-10.10.4}
  redis:
    image: redis:${REDIS_VERSION:-7-alpine}
  postgres:
    image: postgis/postgis:${POSTGRES_VERSION:-15-3.3}
```

### Phase 2: Port Configuration (This Week)

#### 1. Centralize Port Management
```bash
# .env.development - Add all ports
VITE_DEV_PORT=3002
FASTAPI_PORT=8000
VERCEL_API_PORT=4000
POSTGRES_PORT=5432
REDIS_PORT=6379
```

#### 2. Update Configuration Files
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: parseInt(process.env.VITE_DEV_PORT || '3002'),
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_URL || 'http://localhost:4000',
      }
    }
  }
})
```

#### 3. Update Package.json Scripts
```json
{
  "scripts": {
    "dev:backend": "cd application/app && uvicorn main:app --host 0.0.0.0 --port ${FASTAPI_PORT:-8000} --reload",
    "dev:web": "cd apps/web && vite --port ${VITE_DEV_PORT:-3002}"
  }
}
```

### Phase 3: Database & API Configuration

#### 1. Database Pool Configuration
```typescript
// api/analytics.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000'),
});
```

#### 2. API Configuration
```typescript
// apps/web/src/App.tsx
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
};
```

## Updated Environment Files

### Enhanced .env.development
```bash
# Application Ports
VITE_DEV_PORT=3002
FASTAPI_PORT=8000
VERCEL_API_PORT=4000
POSTGRES_PORT=5432
REDIS_PORT=6379

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
NEXT_PUBLIC_API_TIMEOUT="10000"

# Database Pool Configuration
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# Map Configuration
NEXT_PUBLIC_MAP_CENTER_LAT=46.7296
NEXT_PUBLIC_MAP_CENTER_LNG=-94.6859
NEXT_PUBLIC_MAP_ZOOM=6
NEXT_PUBLIC_MAP_TILE_URL="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

# CDN Configuration
NEXT_PUBLIC_CDN_BASE_URL="https://cdnjs.cloudflare.com"

# CORS Configuration
CORS_ALLOWED_ORIGINS="http://localhost:3002,http://localhost:8000"

# Docker Configuration
DIRECTUS_VERSION=10.10.4
REDIS_VERSION=7-alpine
POSTGRES_VERSION=15-3.3
```

### Enhanced .env.production
```bash
# Application Configuration
NEXT_PUBLIC_API_BASE_URL="https://api.nearestnice.weather"
NEXT_PUBLIC_API_TIMEOUT="30000"

# Database Pool (Production)
DB_POOL_MAX=50
DB_POOL_IDLE_TIMEOUT=60000
DB_POOL_CONNECTION_TIMEOUT=5000

# Map Configuration (Production)
NEXT_PUBLIC_MAP_CENTER_LAT=46.7296
NEXT_PUBLIC_MAP_CENTER_LNG=-94.6859
NEXT_PUBLIC_MAP_ZOOM=6

# CORS Configuration (Production)
CORS_ALLOWED_ORIGINS="https://nearestnice.weather,https://www.nearestnice.weather"

# CDN Configuration (Production)
NEXT_PUBLIC_CDN_BASE_URL="https://cdn.nearestnice.weather"
```

## Validation Script

### Environment Variable Validator
```bash
#!/bin/bash
# scripts/validate-env.sh

required_vars=(
  "DATABASE_URL"
  "REDIS_URL" 
  "CORS_ALLOWED_ORIGINS"
  "NEXT_PUBLIC_API_BASE_URL"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

echo "✅ All required environment variables are set"
```

## Testing Strategy

### Environment-Specific Tests
```typescript
// tests/environment.test.ts
describe('Environment Configuration', () => {
  it('should have all required environment variables', () => {
    const required = ['NEXT_PUBLIC_API_BASE_URL', 'CORS_ALLOWED_ORIGINS'];
    required.forEach(env => {
      expect(process.env[env]).toBeDefined();
    });
  });

  it('should validate port configurations', () => {
    const port = parseInt(process.env.VITE_DEV_PORT || '3002');
    expect(port).toBeGreaterThan(1000);
    expect(port).toBeLessThan(65536);
  });
});
```

## Benefits After Implementation

### 🔒 **Security**
- No hardcoded credentials or URLs
- Environment-specific CORS policies
- Secure fallback handling

### 🚀 **Deployment Flexibility**
- Easy environment switching
- Container orchestration ready
- Multi-region deployment support

### 🔧 **Development Experience**
- Configurable development ports
- Easy local environment setup
- Conflict-free multi-project development

### 📊 **Operational Benefits**
- Environment-specific performance tuning
- Easy feature flag management
- Simplified monitoring and debugging

## Implementation Timeline

- **Day 1**: Critical security fixes (CORS, fallbacks)
- **Day 2-3**: Port configuration and API endpoints
- **Week 1**: Database and map configuration
- **Week 2**: Testing and validation implementation

This remediation eliminates configuration debt while establishing best practices for scalable, secure, multi-environment deployments.