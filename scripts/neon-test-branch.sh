#!/bin/bash

# Neon Database Branching for CI Tests
# Creates isolated database branches for testing

set -e

# Configuration
NEON_PROJECT_ID=${NEON_PROJECT_ID:-}
NEON_API_KEY=${NEON_API_KEY:-}
PARENT_BRANCH=${PARENT_BRANCH:-main}
BRANCH_PREFIX=${BRANCH_PREFIX:-ci}

# Generate unique branch name
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RUN_ID=${GITHUB_RUN_ID:-$TIMESTAMP}
BRANCH_NAME="${BRANCH_PREFIX}-${RUN_ID}"

# Function to create database branch
create_branch() {
    echo "🔄 Creating database branch: $BRANCH_NAME"
    
    if [[ -z "$NEON_API_KEY" ]]; then
        echo "⚠️  NEON_API_KEY not set, skipping database branch creation"
        echo "Using existing DATABASE_URL for testing"
        return 0
    fi
    
    # Create branch via Neon API
    response=$(curl -s -X POST \
        "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
        -H "Authorization: Bearer $NEON_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"branch\": {
                \"name\": \"$BRANCH_NAME\",
                \"parent_id\": \"$PARENT_BRANCH\"
            }
        }")
    
    if echo "$response" | grep -q '"id"'; then
        echo "✅ Database branch created successfully"
        
        # Extract connection string
        BRANCH_CONNECTION=$(echo "$response" | jq -r '.connection_uri')
        
        # Export for use in tests
        export TEST_DATABASE_URL="$BRANCH_CONNECTION"
        echo "TEST_DATABASE_URL=$BRANCH_CONNECTION" >> $GITHUB_ENV
        
        # Save branch info for cleanup
        echo "$BRANCH_NAME" > .neon-branch-name
        echo "$NEON_PROJECT_ID" > .neon-project-id
        
        echo "📋 Branch connection available at: $BRANCH_CONNECTION"
    else
        echo "❌ Failed to create database branch"
        echo "Response: $response"
        exit 1
    fi
}

# Function to delete database branch
delete_branch() {
    echo "🧹 Cleaning up database branch: $BRANCH_NAME"
    
    if [[ -z "$NEON_API_KEY" ]]; then
        echo "⚠️  NEON_API_KEY not set, skipping branch cleanup"
        return 0
    fi
    
    # Delete branch via Neon API
    response=$(curl -s -X DELETE \
        "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches/$BRANCH_NAME" \
        -H "Authorization: Bearer $NEON_API_KEY")
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Database branch deleted successfully"
        rm -f .neon-branch-name .neon-project-id
    else
        echo "❌ Failed to delete database branch"
        echo "Response: $response"
    fi
}

# Function to run tests with branch
run_tests_with_branch() {
    echo "🧪 Running tests with database branch: $BRANCH_NAME"
    
    # Wait for branch to be ready
    sleep 5
    
    # Run database tests
    if [[ -n "$TEST_DATABASE_URL" ]]; then
        echo "🔍 Testing database connectivity..."
        DATABASE_URL="$TEST_DATABASE_URL" npm run test:database
    else
        echo "🔍 Running tests with existing database..."
        npm run test:database
    fi
    
    # Run other tests
    echo "🔍 Running environment tests..."
    npm run test:environment
}

# Main script logic
case "${1:-create}" in
    "create")
        create_branch
        ;;
    "delete")
        BRANCH_NAME=$(cat .neon-branch-name 2>/dev/null || echo "$BRANCH_NAME")
        NEON_PROJECT_ID=$(cat .neon-project-id 2>/dev/null || echo "$NEON_PROJECT_ID")
        delete_branch
        ;;
    "test")
        create_branch
        run_tests_with_branch
        ;;
    "cleanup")
        if [[ -f .neon-branch-name ]]; then
            BRANCH_NAME=$(cat .neon-branch-name)
            NEON_PROJECT_ID=$(cat .neon-project-id)
            delete_branch
        fi
        ;;
    *)
        echo "Usage: $0 {create|delete|test|cleanup}"
        echo "  create  - Create a new database branch"
        echo "  delete  - Delete the database branch"
        echo "  test    - Create branch and run tests"
        echo "  cleanup - Clean up any existing branch"
        exit 1
        ;;
esac