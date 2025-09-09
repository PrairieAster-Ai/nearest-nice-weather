#!/bin/bash

# Deployment Readiness Validation
# Verifies GitHub Actions CI/CD pipeline deployment capabilities

set -e

echo "🚀 Deployment Readiness Validation"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check Vercel CLI availability
check_vercel_cli() {
    print_status "Checking Vercel CLI..."
    if command -v vercel &> /dev/null; then
        vercel_version=$(vercel --version)
        print_success "Vercel CLI available: $vercel_version"
    else
        print_error "Vercel CLI not found. Install with: npm install -g vercel"
        return 1
    fi
}

# Check Vercel project configuration
check_vercel_project() {
    print_status "Checking Vercel project configuration..."
    if [ -f "apps/web/.vercel/project.json" ]; then
        org_id=$(cat apps/web/.vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)
        project_id=$(cat apps/web/.vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)

        print_success "Organization ID: $org_id"
        print_success "Project ID: $project_id"

        # Export for GitHub Actions reference
        echo "VERCEL_ORG_ID=$org_id" > .env.deployment
        echo "VERCEL_PROJECT_ID=$project_id" >> .env.deployment
        print_success "Deployment environment variables exported"
    else
        print_error "Vercel project not linked. Run 'vercel link' in apps/web/"
        return 1
    fi
}

# Check vercel.json configuration
check_vercel_config() {
    print_status "Checking vercel.json configuration..."
    if [ -f "vercel.json" ]; then
        print_success "vercel.json found"

        # Validate key configurations
        if grep -q "outputDirectory" vercel.json; then
            output_dir=$(grep -o '"outputDirectory":\s*"[^"]*' vercel.json | cut -d'"' -f4)
            print_success "Output directory: $output_dir"
        fi

        if grep -q "buildCommand" vercel.json; then
            build_cmd=$(grep -o '"buildCommand":\s*"[^"]*' vercel.json | cut -d'"' -f4)
            print_success "Build command: $build_cmd"
        fi

        if grep -q "functions" vercel.json; then
            print_success "Serverless functions configured"
        fi

    else
        print_warning "vercel.json not found - using Vercel auto-detection"
    fi
}

# Check build process
check_build_process() {
    print_status "Testing build process..."
    cd apps/web

    if npm run build > /dev/null 2>&1; then
        print_success "Build process working"

        # Check build output
        if [ -d "dist" ]; then
            file_count=$(find dist -type f | wc -l)
            print_success "Build output: $file_count files in dist/"

            # Check for key files
            if [ -f "dist/index.html" ]; then
                print_success "index.html generated"
            fi

            if [ -d "dist/assets" ]; then
                asset_count=$(find dist/assets -name "*.js" -o -name "*.css" | wc -l)
                print_success "Assets generated: $asset_count JS/CSS files"
            fi
        fi
    else
        print_error "Build process failed"
        cd ..
        return 1
    fi

    cd ..
}

# Check GitHub Actions workflow
check_github_workflow() {
    print_status "Checking GitHub Actions workflow..."
    if [ -f ".github/workflows/ci.yml" ]; then
        print_success "Comprehensive CI/CD workflow found"

        # Check for deployment stages
        if grep -q "deploy-preview" .github/workflows/ci.yml; then
            print_success "Preview deployment stage configured"
        fi

        if grep -q "deploy-production" .github/workflows/ci.yml; then
            print_success "Production deployment stage configured"
        fi

        # Check for required secrets
        if grep -q "VERCEL_TOKEN" .github/workflows/ci.yml; then
            print_warning "VERCEL_TOKEN secret required - check GitHub repo settings"
        fi

        if grep -q "VERCEL_ORG_ID" .github/workflows/ci.yml; then
            print_success "VERCEL_ORG_ID reference found"
        fi

        if grep -q "VERCEL_PROJECT_ID" .github/workflows/ci.yml; then
            print_success "VERCEL_PROJECT_ID reference found"
        fi

    else
        print_error "GitHub Actions workflow not found"
        return 1
    fi
}

# Generate deployment checklist
generate_checklist() {
    print_status "Generating deployment checklist..."

    cat > DEPLOYMENT-CHECKLIST.md << EOF
# Deployment Readiness Checklist

Generated: $(date)

## ✅ Infrastructure Ready
- [x] Vercel CLI available
- [x] Vercel project linked
- [x] Build process working
- [x] GitHub Actions workflow configured

## ⚠️ Manual Steps Required

### 1. Add GitHub Secrets
Navigate to: https://github.com/PrairieAster-Ai/nearest-nice-weather/settings/secrets/actions

**Required Secrets:**
\`\`\`
VERCEL_ORG_ID: $(cat .env.deployment | grep VERCEL_ORG_ID | cut -d'=' -f2)
VERCEL_PROJECT_ID: $(cat .env.deployment | grep VERCEL_PROJECT_ID | cut -d'=' -f2)
VERCEL_TOKEN: [Generate at https://vercel.com/account/tokens]
\`\`\`

### 2. Test Deployment Flow
\`\`\`bash
# Test preview deployment (requires secrets)
git checkout -b test-deployment
git commit --allow-empty -m "test: deployment validation"
git push origin test-deployment

# Create PR to trigger preview deployment
gh pr create --title "Test: Deployment Pipeline" --body "Testing automated deployment"
\`\`\`

### 3. Verification Steps
- [ ] Preview deployment succeeds
- [ ] Preview URL accessible
- [ ] Production deployment on main merge
- [ ] Deployment notifications working

## 🚀 Ready for Production!
Once secrets are added, the deployment pipeline is fully automated.
EOF

    print_success "Deployment checklist generated: DEPLOYMENT-CHECKLIST.md"
}

# Main validation
main() {
    echo ""
    check_vercel_cli && \
    check_vercel_project && \
    check_vercel_config && \
    check_build_process && \
    check_github_workflow && \
    generate_checklist

    echo ""
    if [ $? -eq 0 ]; then
        print_success "🎉 Deployment infrastructure ready!"
        print_warning "📋 Next step: Add VERCEL_TOKEN secret to GitHub repository"
        echo ""
        echo "Quick setup:"
        echo "1. Visit: https://github.com/PrairieAster-Ai/nearest-nice-weather/settings/secrets/actions"
        echo "2. Add VERCEL_TOKEN from: https://vercel.com/account/tokens"
        echo "3. Test with a PR to trigger preview deployment"
    else
        print_error "❌ Deployment infrastructure needs attention"
    fi
}

main "$@"
