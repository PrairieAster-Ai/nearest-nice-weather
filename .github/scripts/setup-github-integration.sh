#!/bin/bash

# GitHub Integration Setup for NearestNiceWeather.com MVP
# Sets up GitHub CLI and authentication for Claude Code integration

echo "🚀 Setting up GitHub Integration for MVP Development..."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt &> /dev/null; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
        # RedHat/CentOS/Fedora
        elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
            sudo dnf install 'dnf-command(config-manager)'
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            sudo dnf install gh
        else
            echo "❌ Please install GitHub CLI manually: https://github.com/cli/cli#installation"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gh
        else
            echo "❌ Please install Homebrew first or install GitHub CLI manually"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install GitHub CLI manually: https://github.com/cli/cli#installation"
        exit 1
    fi
    
    echo "✅ GitHub CLI installed successfully"
else
    echo "✅ GitHub CLI already installed: $(gh --version | head -n1)"
fi

echo ""

# Check authentication status
echo "🔐 Checking GitHub authentication..."
if gh auth status &> /dev/null; then
    echo "✅ Already authenticated with GitHub"
    gh auth status
else
    echo "🔑 Setting up GitHub authentication..."
    echo ""
    echo "You'll need to authenticate with GitHub to enable Claude Code integration."
    echo "This will allow Claude to create and manage GitHub issues directly."
    echo ""
    echo "Required permissions:"
    echo "- repo (for issue management)"
    echo "- project (for project board integration)"
    echo ""
    
    # Authenticate with required scopes
    gh auth login --scopes "repo,project,read:org"
    
    if gh auth status &> /dev/null; then
        echo "✅ GitHub authentication successful!"
    else
        echo "❌ Authentication failed. Please try again."
        exit 1
    fi
fi

echo ""

# Set default repository
echo "📂 Configuring repository settings..."
cd "$(dirname "$0")/../.." # Go to project root

if gh repo view &> /dev/null; then
    echo "✅ Repository already configured: $(gh repo view --json nameWithOwner --jq .nameWithOwner)"
else
    echo "🔧 Setting up repository configuration..."
    # Try to set the default repo based on git remote
    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        echo "📍 Detected git remote: $REMOTE_URL"
        gh repo set-default
    else
        echo "⚠️  No git remote found. You may need to set the default repo manually:"
        echo "   gh repo set-default PrairieAster-Ai/nearest-nice-weather"
    fi
fi

echo ""

# Test GitHub CLI functionality
echo "🧪 Testing GitHub CLI functionality..."

# Test basic repo access
if gh repo view --json name,owner &> /dev/null; then
    REPO_INFO=$(gh repo view --json name,owner --jq '.owner.login + "/" + .name')
    echo "✅ Repository access working: $REPO_INFO"
else
    echo "❌ Repository access failed. Check repository permissions."
    exit 1
fi

# Test issue listing
if gh issue list --limit 1 &> /dev/null; then
    echo "✅ Issue access working"
else
    echo "⚠️  Issue access limited. Check repository permissions."
fi

# Test project access
if gh project list --owner PrairieAster-Ai &> /dev/null; then
    PROJECT_COUNT=$(gh project list --owner PrairieAster-Ai --json number | jq length)
    echo "✅ Project access working: $PROJECT_COUNT projects found"
else
    echo "⚠️  Project access limited. May need additional permissions."
fi

echo ""
echo "🎉 GitHub Integration Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Claude Code can now create GitHub issues directly"
echo "2. Run: ./.github/scripts/create-sprint3-issues.sh"
echo "3. Issues will be automatically added to your project"
echo ""
echo "🔧 Available Commands:"
echo "- gh issue list                    # List all issues"
echo "- gh issue create                  # Create new issue"
echo "- gh project list                  # List projects"
echo "- ./.github/scripts/create-sprint3-issues.sh  # Create Sprint 3 issues"
echo ""
echo "✅ Claude Code is now ready for direct GitHub integration!"