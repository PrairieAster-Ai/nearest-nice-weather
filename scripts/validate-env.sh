#!/bin/bash

# Environment Variable Validation Script
# Nearest Nice Weather - Weather Intelligence Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variable is set
check_required_env() {
    local var_name="$1"
    local description="$2"
    local value="${!var_name}"

    if [ -z "$value" ]; then
        print_error "Required environment variable $var_name is not set ($description)"
        return 1
    else
        print_success "$var_name is set"
        return 0
    fi
}

# Check if optional environment variable is set
check_optional_env() {
    local var_name="$1"
    local description="$2"
    local value="${!var_name}"

    if [ -z "$value" ]; then
        print_warning "Optional environment variable $var_name is not set ($description)"
        return 1
    else
        print_success "$var_name is set"
        return 0
    fi
}

# Validate port number
validate_port() {
    local var_name="$1"
    local port_value="${!var_name}"

    if [ -n "$port_value" ]; then
        if [[ "$port_value" =~ ^[0-9]+$ ]] && [ "$port_value" -ge 1 ] && [ "$port_value" -le 65535 ]; then
            print_success "$var_name ($port_value) is a valid port"
            return 0
        else
            print_error "$var_name ($port_value) is not a valid port number (1-65535)"
            return 1
        fi
    else
        print_warning "$var_name is not set"
        return 1
    fi
}

# Validate URL format (allows relative URLs for API paths)
validate_url() {
    local var_name="$1"
    local url_value="${!var_name}"
    local allow_relative="${2:-false}"

    if [ -n "$url_value" ]; then
        if [[ "$url_value" =~ ^https?:// ]] || [[ "$allow_relative" == "true" && "$url_value" =~ ^/ ]]; then
            print_success "$var_name is a valid URL"
            return 0
        else
            if [ "$allow_relative" == "true" ]; then
                print_error "$var_name ($url_value) is not a valid URL (must start with http://, https://, or /)"
            else
                print_error "$var_name ($url_value) is not a valid URL (must start with http:// or https://)"
            fi
            return 1
        fi
    else
        print_warning "$var_name is not set"
        return 1
    fi
}

# Validate boolean value
validate_boolean() {
    local var_name="$1"
    local bool_value="${!var_name}"

    if [ -n "$bool_value" ]; then
        if [[ "$bool_value" =~ ^(true|false)$ ]]; then
            print_success "$var_name ($bool_value) is a valid boolean"
            return 0
        else
            print_error "$var_name ($bool_value) must be 'true' or 'false'"
            return 1
        fi
    else
        print_warning "$var_name is not set"
        return 1
    fi
}

# Main validation function
validate_environment() {
    local errors=0
    local warnings=0

    echo ""
    echo "🌤️  Environment Variable Validation"
    echo "===================================="
    echo ""

    print_status "Validating required environment variables..."
    echo ""

    # Critical Required Variables
    check_required_env "DATABASE_URL" "PostgreSQL connection string" || ((errors++))
    check_required_env "REDIS_URL" "Redis connection string" || ((errors++))
    check_required_env "CORS_ALLOWED_ORIGINS" "CORS allowed origins" || ((errors++))

    echo ""
    print_status "Validating database configuration..."
    echo ""

    # Database Configuration
    check_optional_env "DB_POOL_MAX" "Database connection pool size" || ((warnings++))
    check_optional_env "DB_POOL_IDLE_TIMEOUT" "Database idle timeout" || ((warnings++))
    check_optional_env "DB_POOL_CONNECTION_TIMEOUT" "Database connection timeout" || ((warnings++))

    echo ""
    print_status "Validating port configurations..."
    echo ""

    # Port Validation
    validate_port "VITE_DEV_PORT" || ((warnings++))
    validate_port "FASTAPI_PORT" || ((warnings++))
    validate_port "VERCEL_API_PORT" || ((warnings++))

    echo ""
    print_status "Validating URL configurations..."
    echo ""

    # URL Validation
    validate_url "VITE_API_BASE_URL" "true" || ((warnings++))  # Allow relative URLs
    validate_url "NEXTAUTH_URL" "false" || ((warnings++))     # Require absolute URLs

    echo ""
    print_status "Validating API configuration..."
    echo ""

    # API Configuration
    check_optional_env "VITE_API_TIMEOUT" "API request timeout" || ((warnings++))
    check_optional_env "VITE_MAP_CENTER_LAT" "Map center latitude" || ((warnings++))
    check_optional_env "VITE_MAP_CENTER_LNG" "Map center longitude" || ((warnings++))

    echo ""
    print_status "Validating security configuration..."
    echo ""

    # Security Configuration
    check_optional_env "JWT_SECRET" "JWT secret key" || ((warnings++))
    check_optional_env "NEXTAUTH_SECRET" "NextAuth secret key" || ((warnings++))

    # Environment-specific validation
    if [ "$NODE_ENV" = "production" ]; then
        echo ""
        print_status "Validating production-specific configuration..."
        echo ""

        # Production-specific checks
        if [ "$DEBUG" = "true" ]; then
            print_warning "DEBUG is enabled in production environment"
            ((warnings++))
        fi

        if [ "$LOG_LEVEL" = "debug" ]; then
            print_warning "LOG_LEVEL is set to debug in production environment"
            ((warnings++))
        fi

        # Check for development secrets in production
        if [[ "$JWT_SECRET" == *"dev"* ]] || [[ "$JWT_SECRET" == *"development"* ]]; then
            print_error "Development JWT_SECRET detected in production environment"
            ((errors++))
        fi

        if [[ "$NEXTAUTH_SECRET" == *"dev"* ]] || [[ "$NEXTAUTH_SECRET" == *"development"* ]]; then
            print_error "Development NEXTAUTH_SECRET detected in production environment"
            ((errors++))
        fi
    fi

    echo ""
    print_status "Validation Summary"
    echo "=================="

    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        print_success "✅ All environment variables are properly configured!"
        echo ""
        print_status "Environment is ready for deployment 🚀"
        exit 0
    elif [ $errors -eq 0 ]; then
        print_success "✅ All critical environment variables are set"
        print_warning "⚠️  Found $warnings warning(s) - review optional configurations"
        echo ""
        print_status "Environment is ready for deployment with warnings 🚀"
        exit 0
    else
        print_error "❌ Found $errors critical error(s) and $warnings warning(s)"
        echo ""
        print_error "Environment validation failed - please fix errors before deployment"
        echo ""

        # Provide helpful guidance
        echo "Common fixes:"
        echo "  1. Copy .env.example to .env.local and configure values"
        echo "  2. Set required DATABASE_URL and REDIS_URL"
        echo "  3. Configure CORS_ALLOWED_ORIGINS for your domain"
        echo "  4. Generate secure JWT_SECRET and NEXTAUTH_SECRET for production"
        echo ""

        exit 1
    fi
}

# Load environment variables if .env file exists
if [ -f ".env.local" ]; then
    print_status "Loading environment from .env.local"
    set -a
    source .env.local
    set +a
elif [ -f ".env" ]; then
    print_status "Loading environment from .env"
    set -a
    source .env
    set +a
else
    print_warning "No .env.local or .env file found - using system environment variables only"
fi

# Run validation
validate_environment
