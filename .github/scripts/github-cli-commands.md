# GitHub CLI Commands for Issue Management

## Prerequisites

### Install GitHub CLI
```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli

# Verify installation
gh --version
```

### Authenticate with GitHub
```bash
# Login to GitHub
gh auth login

# Verify authentication
gh auth status

# Set default repository (run from project root)
gh repo set-default
```

## Sprint 3 Issue Creation

### Option 1: Run the Automated Script
```bash
# Make script executable (if not already)
chmod +x .github/scripts/create-sprint3-issues.sh

# Run the script to create all Sprint 3 issues
./.github/scripts/create-sprint3-issues.sh
```

### Option 2: Manual Issue Creation Commands

#### Create Feature Issue
```bash
gh issue create \
    --title "Feature: Live Weather Data Integration - Sprint 3 Critical Path" \
    --body-file .github/issues/sprint-3-feature.md \
    --label "epic,sprint-3,in-progress,revenue-critical" \
    --assignee @me \
    --project "NearestNiceWeather.com App Development"
```

#### Create Database Epic
```bash
gh issue create \
    --title "Epic: Database Schema Production Deployment" \
    --body-file .github/issues/database-schema-epic.md \
    --label "epic,database,sprint-3,production" \
    --assignee @me \
    --project "NearestNiceWeather.com App Development"
```

#### Create Weather API Epic
```bash
gh issue create \
    --title "Epic: Weather API Integration - Real-Time Data Pipeline" \
    --body-file .github/issues/weather-api-epic.md \
    --label "epic,weather-api,sprint-3,openweather" \
    --assignee @me \
    --project "NearestNiceWeather.com App Development"
```

## Issue Management Commands

### View Issues
```bash
# List all issues
gh issue list

# List Sprint 3 issues
gh issue list --label sprint-3

# View specific issue
gh issue view 123

# View issue in browser
gh issue view 123 --web
```

### Update Issues
```bash
# Edit issue title and body
gh issue edit 123 --title "New Title" --body "New body content"

# Add labels
gh issue edit 123 --add-label "bug,priority-high"

# Remove labels  
gh issue edit 123 --remove-label "sprint-2"

# Add assignee
gh issue edit 123 --add-assignee username

# Close issue
gh issue close 123
```

### Project Management
```bash
# Add issue to project
gh project item-add PROJECT_NUMBER --url ISSUE_URL

# For your project:
gh project item-add "https://github.com/orgs/PrairieAster-Ai/projects/2" --url "https://github.com/OWNER/REPO/issues/123"

# List project items
gh project list --owner PrairieAster-Ai
```

## Useful Issue Queries

### Sprint Tracking
```bash
# All Sprint 3 issues
gh issue list --label sprint-3

# In progress issues
gh issue list --label in-progress

# Epic issues only
gh issue list --label epic

# Assigned to you
gh issue list --assignee @me
```

### Issue Creation from Templates
```bash
# Create issue using template (interactive)
gh issue create --template epic-feature.md

# Create with specific template
gh issue create \
    --title "Story: New User Story" \
    --body-file .github/ISSUE_TEMPLATE/user-story.md \
    --label story,sprint-3
```

## Project Field Updates

### Set Custom Fields (if supported by CLI)
```bash
# Note: Custom field setting via CLI is limited
# You may need to use the web interface for:
# - Story Points
# - Sprint Status  
# - WBS Owner
# - Business Value
# - File Reference

# Alternative: Use issue comments to track field values
gh issue comment 123 --body "Story Points: 5
Sprint Status: 🔄 IN PROGRESS
WBS Owner: Claude
File Reference: apps/web/api/weather-locations.js"
```

## Automation and Bulk Operations

### Bulk Label Updates
```bash
# Add sprint-3 label to multiple issues
gh issue list --state open --json number --jq '.[].number' | xargs -I {} gh issue edit {} --add-label sprint-3
```

### Issue Templates Usage
```bash
# List available templates
ls .github/ISSUE_TEMPLATE/

# Create issue from specific template
gh issue create --template epic-feature
gh issue create --template user-story  
gh issue create --template sprint-planning
```

## Troubleshooting

### Common Issues
```bash
# Repository not recognized
gh repo set-default

# Authentication problems
gh auth logout
gh auth login

# Project not found
gh project list --owner PrairieAster-Ai

# Permission errors
gh auth refresh -s project
```

### Verify Setup
```bash
# Check CLI status
gh status

# Verify repository
gh repo view

# Test issue creation
gh issue create --title "Test Issue" --body "Testing CLI setup"
gh issue close $(gh issue list --limit 1 --json number --jq '.[0].number')
```

## Integration with Development Workflow

### Commit Message Integration
```bash
# Reference issue in commit
git commit -m "feat: Add weather API integration

Implements Epic: Weather API Integration (#123)
- Add OpenWeather API connection
- Implement caching strategy  
- Handle rate limiting

Closes #124, #125"
```

### Branch Management
```bash
# Create branch for issue
gh issue develop 123 --checkout

# Create PR from issue
gh pr create --title "Fix: Issue #123" --body "Closes #123"
```

This comprehensive CLI setup gives you complete control over GitHub issue management directly from the command line!