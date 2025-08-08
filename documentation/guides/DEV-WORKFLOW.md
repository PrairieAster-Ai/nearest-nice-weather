# Development Workflow Guide

## Quick Start

### One-Command Setup
```bash
# Initial setup (run once)
./scripts/dev-setup.sh

# Start all services
npm run dev
```

## Development Commands

### Core Workflow
```bash
# Start everything (infrastructure + backend + API + frontend)
npm run dev

# Start individual services
npm run dev:infrastructure  # PostgreSQL + Redis
npm run dev:backend        # FastAPI on :8000
npm run dev:api            # Vercel functions on :4000  
npm run dev:web            # Vite React app on :3002

# Build everything
npm run build

# Test everything
npm run test

# Lint everything
npm run lint

# Health check all services
npm run health
```

### Service URLs
- **Frontend (Vite)**: http://localhost:3002
- **Backend (FastAPI)**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Vercel Functions**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Rapid Iteration Workflow

### 1. **Feature Development**
```bash
# Create feature branch
git checkout -b feature/weather-search

# Start development environment
npm run dev

# Make changes, auto-reload enabled
# - Frontend: Vite hot reload
# - Backend: FastAPI auto-reload
# - API: Vercel dev auto-reload

# Test changes
npm run test:web    # Frontend tests
npm run test:backend # Backend tests

# Lint and type check
npm run lint
npm run type-check
```

### 2. **Testing Strategy**
```bash
# Unit tests
npm run test:web      # React components
npm run test:backend  # FastAPI endpoints
npm run test:api      # Vercel functions

# Integration tests
npm run health        # End-to-end service health

# Manual testing
open http://localhost:3002  # Frontend
open http://localhost:8000/docs  # API docs
```

### 3. **Deployment Pipeline**
```bash
# Create PR (triggers validation)
git push origin feature/weather-search

# PR validation runs:
# - Linting and type checking
# - All test suites
# - Build verification
# - Security scanning

# Merge to main (triggers deployment)
# - Automatic deployment to Vercel
# - Health checks
# - Rollback on failure
```

## Environment Management

### Development
- **File**: `.env.development`
- **Database**: Local PostgreSQL
- **APIs**: Development keys
- **CORS**: Localhost origins

### Production
- **File**: `.env.production` (template)
- **Database**: Production PostgreSQL
- **APIs**: Production keys
- **CORS**: Production domains

### Environment Variables
```bash
# Required for development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/weather_intelligence"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_API_URL="http://localhost:8000"

# API Keys (get from providers)
OPENWEATHER_API_KEY="your-key"
GOOGLE_MAPS_API_KEY="your-key"
```

## Code Quality Gates

### Pre-commit Hooks
- **Linting**: ESLint + Prettier
- **Type checking**: TypeScript strict mode
- **Testing**: Critical path tests
- **Security**: Secret detection

### CI/CD Pipeline
- **PR Validation**: Full test suite + build
- **Deploy on Main**: Automated production deployment
- **Health Checks**: Post-deployment validation
- **Rollback**: Automatic on health check failure

## Development Best Practices

### 1. **Rapid Feedback Loop**
```bash
# Keep services running during development
npm run dev  # Leave running

# In separate terminal for testing
npm run test:web -- --watch
npm run test:backend -- --watch
```

### 2. **Error Handling**
- Frontend errors: React Error Boundaries
- Backend errors: FastAPI exception handlers
- API errors: Vercel function error responses
- Database errors: Connection pooling + retries

### 3. **Performance Monitoring**
```bash
# Build analysis
npm run build:web  # Check bundle sizes

# Runtime monitoring
# - Vite dev tools for frontend
# - FastAPI profiling for backend
# - Vercel analytics for deployment
```

### 4. **Debugging**
```bash
# Frontend debugging
# - React DevTools
# - Browser dev tools
# - Vite debug mode

# Backend debugging
# - FastAPI debug mode enabled
# - Database query logging
# - Redis connection monitoring

# API debugging
# - Vercel function logs
# - Network tab for requests
```

## Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker
docker ps  # Ensure postgres + redis running

# Check ports
lsof -i :3002  # Frontend
lsof -i :8000  # Backend
lsof -i :4000  # API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Reset environment
npm run clean
npm run reset
./scripts/dev-setup.sh
```

#### Database Connection Issues
```bash
# Check PostgreSQL
docker exec weather_postgres pg_isready -U postgres

# Check environment
echo $DATABASE_URL

# Reset database
docker compose down
docker compose up -d postgres
```

#### Build Failures
```bash
# Clear caches
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 22+

# Type check
npm run type-check
```

### Performance Issues
```bash
# Frontend slow
npm run build:web  # Check bundle size
# Optimize: Code splitting, lazy loading

# Backend slow  
# Check: Database queries, Redis caching

# API slow
# Check: Vercel function cold starts
```

## Monitoring & Observability

### Development Monitoring
- **Frontend**: Vite dev server logs
- **Backend**: FastAPI access logs
- **Database**: PostgreSQL slow query log
- **Redis**: Connection monitoring

### Production Monitoring
- **Deployment**: GitHub Actions logs
- **Runtime**: Vercel function logs
- **Uptime**: Health check endpoints
- **Performance**: Core Web Vitals

This workflow is optimized for rapid, reliable iterations with minimal friction and maximum confidence in deployments.