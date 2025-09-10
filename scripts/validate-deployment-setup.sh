#!/bin/bash

# Deployment Setup Validation Script
# Tests all components needed for CI/CD deployment

set -e

echo "🔍 Validating Deployment Setup..."
echo "================================"

# Check Node.js version
echo "📋 Node.js Version:"
node --version
echo ""

# Check npm version
echo "📋 NPM Version:"
npm --version
echo ""

# Check Vercel CLI
echo "📋 Vercel CLI:"
if command -v vercel &> /dev/null; then
    vercel --version
    echo "✅ Vercel CLI available"
else
    echo "❌ Vercel CLI not found - installing..."
    npm install -g vercel@latest
fi
echo ""

# Check Vercel authentication
echo "📋 Vercel Authentication:"
if vercel whoami &> /dev/null; then
    echo "✅ Vercel authenticated as: $(vercel whoami)"
else
    echo "⚠️  Not authenticated to Vercel (expected in CI environment)"
fi
echo ""

# Validate project structure
echo "📋 Project Structure:"
if [ -f "apps/web/package.json" ]; then
    echo "✅ apps/web/package.json found"
else
    echo "❌ apps/web/package.json missing"
fi

if [ -f "apps/web/vite.config.ts" ]; then
    echo "✅ Vite config found"
else
    echo "❌ Vite config missing"
fi
echo ""

# Test local build
echo "📋 Local Build Test:"
cd apps/web
if npm run build; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed"
    exit 1
fi
cd ../..
echo ""

# Check GitHub workflow
echo "📋 GitHub Workflow:"
if [ -f ".github/workflows/ci.yml" ]; then
    echo "✅ CI workflow found"
    echo "📊 Workflow Summary:"
    grep -E "^  [a-z-]+:" .github/workflows/ci.yml | sed 's/://g' | sed 's/^/    - /'
else
    echo "❌ CI workflow missing"
fi
echo ""

# Validate required secrets (simulated check)
echo "📋 Required GitHub Secrets:"
echo "    - VERCEL_ORG_ID (roberts-projects-3488152a)"
echo "    - VERCEL_PROJECT_ID (prj_iHRBOnMIbbGpyVY8zILn1t0zx2Vk)"
echo "    - VERCEL_TOKEN (from Vercel dashboard)"
echo "⚠️  Add these secrets at: https://github.com/PrairieAster-Ai/nearest-nice-weather/settings/secrets/actions"
echo ""

# Test deployment readiness
echo "📋 Deployment Readiness:"
if [ -d "apps/web/dist" ]; then
    echo "✅ Build artifacts ready"
    echo "📊 Build size: $(du -sh apps/web/dist | cut -f1)"
else
    echo "⚠️  No build artifacts (run npm run build first)"
fi
echo ""

echo "🎯 Next Steps:"
echo "1. Add the 3 required GitHub secrets"
echo "2. Push any changes to trigger CI"
echo "3. Monitor deployment at: https://github.com/PrairieAster-Ai/nearest-nice-weather/actions"
echo "4. Check production deployment at: https://nearest-nice-weather-roberts-projects-3488152a.vercel.app"
echo ""

echo "✅ Deployment validation complete!"
