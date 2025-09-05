# Environment Variable Audit

## Critical Environment Variables by Environment

### Local Development
```bash
# Database (local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/weather_intelligence"
POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/weather_intelligence"

# API Configuration (local)
VITE_API_PROXY_URL="http://localhost:4001"    # Frontend proxy target
VITE_API_BASE_URL="http://localhost:4001"     # Direct API calls
API_BASE_URL="http://localhost:4000"          # Legacy/backend

# Development server
VITE_DEV_PORT="3002"
VITE_DEV_HOST="0.0.0.0"
```

### Production
```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@hostname.neon.tech/db?sslmode=require"
POSTGRES_URL="postgresql://user:pass@hostname.neon.tech/db?sslmode=require"

# API Configuration (production)
VITE_API_PROXY_URL="https://www.nearestniceweather.com"
VITE_API_BASE_URL="/api"                      # Relative URLs in production
```

### Staging
```bash
# Database (staging)
DATABASE_URL="postgresql://staging_user:pass@staging.neon.tech/db?sslmode=require"

# API Configuration (staging)
VITE_API_PROXY_URL="https://staging.nearestniceweather.com"
VITE_API_BASE_URL="/api"
```

## Environment Variable Usage

### Frontend (Vite)
- **VITE_API_PROXY_URL**: Used by vite.config.ts proxy configuration
- **VITE_API_BASE_URL**: Used by useWeatherLocations.ts for direct API calls
- **VITE_DEV_PORT**: Development server port
- **VITE_DEV_HOST**: Development server host

### Backend (API)
- **DATABASE_URL**: Primary database connection string
- **POSTGRES_URL**: Alternative database connection (Vercel compatibility)
- **API_BASE_URL**: Backend API base URL (legacy)

## Common Issues

### Issue: Frontend shows old data after database changes
**Root Cause**: Frontend proxying to production while expecting local database
**Check**:
- `VITE_API_PROXY_URL` should point to local server
- `VITE_API_BASE_URL` should match local API server
- Local API server should use local `DATABASE_URL`

### Issue: API calls failing in development
**Root Cause**: Mismatch between frontend API URL and running API server
**Check**:
- Verify API server is running on expected port
- Verify `VITE_API_PROXY_URL` matches running server
- Check both direct calls and proxy configuration

### Issue: Database connection errors
**Root Cause**: Wrong database URL for environment
**Check**:
- `DATABASE_URL` format matches database type (local vs cloud)
- SSL settings match database requirements
- Database server is running (local) or accessible (cloud)

## Debugging Commands

```bash
# Check current environment variables
echo "DATABASE_URL: $DATABASE_URL"
echo "VITE_API_PROXY_URL: $VITE_API_PROXY_URL"
echo "VITE_API_BASE_URL: $VITE_API_BASE_URL"

# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(console.error).finally(() => pool.end())"

# Test API endpoint
curl -s "http://localhost:4001/api/weather-locations?limit=5" | jq .

# Check what ports are active
netstat -tlnp | grep -E "(3001|4001|4000)"
```

## Best Practices

1. **Always use environment variables** for URLs, ports, and connection strings
2. **Use different variable names** for different purposes (PROXY vs BASE vs direct)
3. **Include defaults** in code for critical fallbacks
4. **Document variable purpose** in .env.example
5. **Check environment variables FIRST** when debugging data flow issues
6. **Use consistent naming** across environments (dev/staging/prod)

## Environment Variable Checklist

- [ ] All database connections use environment variables
- [ ] All API endpoints use environment variables
- [ ] All ports and hosts use environment variables
- [ ] No hardcoded URLs in production code
- [ ] .env.example documents all required variables
- [ ] Different environments use different variable values
- [ ] Fallback values are appropriate for each environment
