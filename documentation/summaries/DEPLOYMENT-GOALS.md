# Deployment Goals & Requirements

## Primary Objectives

### 1. Preview Environment (`p.nearestniceweather.com`)
- **Purpose**: Test changes before production deployment
- **Trigger**: Commits to `preview` branch
- **Requirements**:
  - Deploy React app with Material-UI components
  - Serve API endpoints from `/api/*` routes
  - Connect to Neon PostgreSQL database
  - No automated testing (manual verification only)

### 2. Production Environment (`nearestniceweather.com`, `www.nearestniceweather.com`)
- **Purpose**: Live application serving end users
- **Trigger**: Commits to `main` branch (with explicit confirmation)
- **Requirements**:
  - Same technical stack as preview
  - Manual deployment confirmation required
  - Production database connection
  - Cache optimization enabled

## Technical Stack
- **Frontend**: Vite + React 18 + Material-UI
- **Backend**: Vercel Edge Functions (Node.js)
- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Vercel platform

## Deployment Workflow Goals
1. **Simplicity**: Minimal configuration, maximum reliability
2. **Safety**: Production deployments require explicit confirmation
3. **Speed**: Preview deployments should be immediate
4. **Reliability**: No complex automation that can break

## What We Will Remove
- All automated testing in CI/CD pipeline
- GitHub Actions workflows
- Pre-commit hooks that run tests
- Complex deployment scripts
- Build-time validation beyond lint/type-check

## What We Will Keep
- Basic linting and type checking
- Health check generation
- Cache busting for assets
- Simple git branch workflow (preview → main)

## Success Criteria
- [ ] Preview branch deploys automatically to `p.nearestniceweather.com`
- [ ] Production deploys with manual confirmation to main domains
- [ ] API endpoints work in both environments
- [ ] Database connections established
- [ ] No deployment failures due to testing
