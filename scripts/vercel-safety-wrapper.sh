#!/bin/bash
# =============================================================================
# VERCEL SAFETY WRAPPER
# =============================================================================
# Purpose: Intercept dangerous vercel commands and redirect to safe alternatives
# Usage: This script should be aliased to 'vercel' in shell profile
# =============================================================================

# Check if this is a production deployment
if [[ "$*" == *"--prod"* ]]; then
    echo "🚨 DANGER: Direct production deployment detected!"
    echo
    echo "❌ Command blocked: vercel --prod"
    echo "✅ Use instead: npm run deploy:production"
    echo
    echo "This provides:"
    echo "  • Safety checks and confirmation"
    echo "  • Automatic validation"
    echo "  • Rollback capability"
    echo "  • Audit trail"
    echo
    exit 1
fi

# For other vercel commands, pass through to real vercel
exec /usr/local/bin/vercel "$@"
