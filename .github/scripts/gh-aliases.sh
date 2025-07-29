#!/bin/bash

# GitHub Management Aliases
# Source this file to add convenient aliases for GitHub operations
# Usage: source .github/scripts/gh-aliases.sh

alias gh-milestones='npm run gh:milestones'
alias gh-issues='npm run gh:issues'
alias gh-sprint3='npm run gh:sprint3'
alias gh-report='npm run gh:report'
alias project-configure='npm run project:configure'
alias project-report='npm run project:report'

# Quick functions
gh-create() {
    if [ $# -lt 2 ]; then
        echo "Usage: gh-create 'Title' 'Body' ['labels']"
        echo "Example: gh-create 'New Epic' 'Description here' 'epic,sprint-1'"
        return 1
    fi
    
    npm run gh:create "$1" "$2" "${3:-}"
}

gh-assign() {
    if [ $# -lt 2 ]; then
        echo "Usage: gh-assign 'issue_numbers' milestone_number"
        echo "Example: gh-assign '10,11,12' 1"
        return 1
    fi
    
    node .github/scripts/github-manager.js assign "$1" "$2"
}

gh-sprint() {
    if [ $# -lt 1 ]; then
        echo "Usage: gh-sprint milestone_number"
        echo "Example: gh-sprint 3"
        return 1
    fi
    
    npm run gh:issues "$1"
}

echo "✅ GitHub aliases loaded!"
echo "Available commands:"
echo "  gh-milestones      - List all milestones"
echo "  gh-issues          - List all issues"
echo "  gh-sprint3         - List Sprint 3 issues"
echo "  gh-sprint N        - List issues for milestone N"
echo "  gh-create 'title' 'body' 'labels' - Create new issue"
echo "  gh-assign '1,2,3' 2 - Assign issues to milestone"
echo "  gh-report          - Generate complete report"
echo "  project-configure  - Configure all issues for GitHub Project"
echo "  project-report     - Generate project configuration report"