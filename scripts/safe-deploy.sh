#!/bin/bash
# =============================================================================
# SAFE DEPLOYMENT SCRIPT
# =============================================================================
# Purpose: Prevent accidental production deployments with safety checks
# Usage: ./scripts/safe-deploy.sh [preview|production] [--force]
# Exit codes: 0 = success, 1 = safety check failed, 2 = user cancelled
# =============================================================================

set -e

# Configuration
DEPLOYMENT_TYPE=${1:-"preview"}
FORCE_FLAG=${2:-""}
REQUIRED_CONFIRMATION="DEPLOY-TO-PRODUCTION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Safety check function
safety_check() {
    log "🔍 Running pre-deployment safety checks..."
    
    # Check for uncommitted changes
    if ! git diff --quiet; then
        error "Uncommitted changes detected"
        git status --porcelain
        echo
        warning "Commit or stash changes before deployment"
        return 1
    fi
    
    # Check if on experimental branch (only for production)
    local current_branch=$(git branch --show-current)
    if [[ "$DEPLOYMENT_TYPE" == "production" || "$DEPLOYMENT_TYPE" == "prod" ]]; then
        if [[ "$current_branch" == *"experiment"* ]] || [[ "$current_branch" == *"test"* ]]; then
            error "Currently on experimental branch: $current_branch"
            warning "Switch to stable branch before production deployment"
            return 1
        fi
    fi
    
    # Check if tests pass (if test command exists)
    if npm run --silent test:quick &> /dev/null; then
        log "Running quick tests..."
        if ! npm run test:quick; then
            error "Tests failed - deployment cancelled"
            return 1
        fi
    else
        log "No test:quick script found - skipping tests"
    fi
    
    success "Safety checks passed"
    return 0
}

# Production deployment confirmation
production_confirmation() {
    echo
    error "🚨 PRODUCTION DEPLOYMENT REQUESTED 🚨"
    echo
    log "This will deploy to: https://nearestniceweather.com"
    log "Current branch: $(git branch --show-current)"
    log "Last commit: $(git log --oneline -1)"
    echo
    
    if [[ "$FORCE_FLAG" == "--force" ]]; then
        warning "Force flag detected - skipping confirmation"
        return 0
    fi
    
    echo -e "${YELLOW}To proceed, type exactly: ${NC}${RED}$REQUIRED_CONFIRMATION${NC}"
    echo -e "${YELLOW}Or press Ctrl+C to cancel${NC}"
    echo
    
    read -p "Confirmation: " user_input
    
    if [[ "$user_input" == "$REQUIRED_CONFIRMATION" ]]; then
        success "Production deployment confirmed"
        return 0
    else
        error "Confirmation failed - deployment cancelled"
        log "Expected: $REQUIRED_CONFIRMATION"
        log "Received: $user_input"
        return 1
    fi
}

# Preview deployment (safe)
deploy_preview() {
    log "🚀 Deploying to preview environment..."
    
    # Run safety checks
    if ! safety_check; then
        error "Safety checks failed - deployment cancelled"
        exit 1
    fi
    
    # Deploy to preview
    log "Running: vercel"
    vercel
    
    # Get the deployment URL
    local deployment_url=$(vercel ls | head -1)
    
    success "Preview deployment successful!"
    log "Deployment URL: $deployment_url"
    
    # Offer to update alias
    echo
    log "Update preview alias? (y/n)"
    read -p "Update p.nearestniceweather.com: " update_alias
    
    if [[ "$update_alias" == "y" || "$update_alias" == "Y" ]]; then
        log "Updating preview alias..."
        vercel alias set "$deployment_url" p.nearestniceweather.com
        success "Preview alias updated: https://p.nearestniceweather.com"
        
        # Run validation
        log "Running environment validation..."
        if ./scripts/environment-validation.sh preview; then
            success "Preview environment validated successfully"
        else
            warning "Preview environment validation failed - manual check recommended"
        fi
    fi
}

# Production deployment (requires confirmation)
deploy_production() {
    log "🔥 Production deployment requested..."
    
    # Production confirmation
    if ! production_confirmation; then
        error "Production deployment cancelled"
        exit 2
    fi
    
    # Run safety checks
    if ! safety_check; then
        error "Safety checks failed - deployment cancelled"
        exit 1
    fi
    
    # Deploy to production
    log "🚀 Deploying to production..."
    log "Running: vercel --prod"
    vercel --prod
    
    success "Production deployment successful!"
    success "Live at: https://nearestniceweather.com"
    
    # Run validation
    log "Running production validation..."
    if ./scripts/environment-validation.sh production; then
        success "Production environment validated successfully"
    else
        error "Production environment validation failed - immediate attention required"
    fi
}

# Main function
main() {
    log "🛡️  Safe Deployment Script"
    log "Deployment type: $DEPLOYMENT_TYPE"
    echo
    warning "🚀 RECOMMENDED: Use VercelMCP for faster deployments"
    log "Deploy directly from Claude conversations with VercelMCP tools"
    log "• Instant deployment commands via Claude"
    log "• Real-time status monitoring"  
    log "• Automated preview aliasing"
    log "• No context switching required"
    echo
    
    case "$DEPLOYMENT_TYPE" in
        "preview"|"p")
            deploy_preview
            ;;
        "production"|"prod")
            deploy_production
            ;;
        *)
            error "Invalid deployment type: $DEPLOYMENT_TYPE"
            log "Valid options: preview, production"
            exit 1
            ;;
    esac
    
    success "Deployment completed successfully!"
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Safe Deployment Script"
    echo "Usage: $0 [preview|production] [--force]"
    echo
    echo "🚀 RECOMMENDED: Use VercelMCP for optimal deployment experience"
    echo "Deploy directly from Claude conversations with VercelMCP tools"
    echo "• No command-line switching required"
    echo "• Real-time deployment monitoring"  
    echo "• Instant preview URL management"
    echo
    echo "Deployment Types:"
    echo "  preview          Deploy to preview environment (safe)"
    echo "  production       Deploy to production (requires confirmation)"
    echo
    echo "Options:"
    echo "  --force          Skip production confirmation (dangerous!)"
    echo "  -h, --help       Show this help message"
    echo
    echo "Safety Features:"
    echo "  • Checks for uncommitted changes"
    echo "  • Prevents deployment from experimental branches"
    echo "  • Requires explicit confirmation for production"
    echo "  • Runs pre-deployment validation"
    echo "  • Automatically updates preview alias"
    echo
    echo "Examples:"
    echo "  $0 preview                    # Safe preview deployment"
    echo "  $0 production                 # Production with confirmation"
    echo "  $0 production --force         # Production without confirmation"
    echo
    exit 0
fi

# Run main function
main