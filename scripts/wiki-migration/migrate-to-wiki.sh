#!/bin/bash
# GitHub Wiki Migration Script
# Migrates prepared content to GitHub Wiki

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WIKI_PREP_DIR="$PROJECT_ROOT/wiki-content-prepared"
WIKI_REPO_DIR="$PROJECT_ROOT/wiki-repo"

# Configuration
GITHUB_REPO="PrairieAster-Ai/nearest-nice-weather"
WIKI_URL="https://github.com/${GITHUB_REPO}.wiki.git"

echo "🚀 GitHub Wiki Migration"
echo "Project: $GITHUB_REPO"
echo "Source: $WIKI_PREP_DIR"
echo "Target: GitHub Wiki"
echo "---"

# Check prerequisites
if [ ! -d "$WIKI_PREP_DIR" ]; then
    echo "❌ Error: Prepared content not found"
    echo "   Run content-preparation.sh first"
    exit 1
fi

# Check if wiki content is validated
if [ ! -f "$WIKI_PREP_DIR/_Content-Index.md" ]; then
    echo "⚠️  Warning: Content index not found"
    echo "   Consider running validate-wiki-content.sh first"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check git configuration
if ! git config user.name > /dev/null || ! git config user.email > /dev/null; then
    echo "❌ Error: Git user configuration required"
    echo "   Run: git config --global user.name 'Your Name'"
    echo "   Run: git config --global user.email 'your.email@example.com'"
    exit 1
fi

# Count files to migrate
FILE_COUNT=$(find "$WIKI_PREP_DIR" -name "*.md" | grep -v "_Content-Index.md" | wc -l)
echo "📁 Found $FILE_COUNT files to migrate"

# Confirm migration
echo ""
echo "⚠️  This will:"
echo "   • Clone the GitHub Wiki repository"
echo "   • Upload $FILE_COUNT documentation pages"
echo "   • Create/update the wiki Home page"
echo "   • Push all changes to GitHub"
echo ""
read -p "Continue with migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Clean up any existing wiki repo
if [ -d "$WIKI_REPO_DIR" ]; then
    echo "🧹 Cleaning up existing wiki repository..."
    rm -rf "$WIKI_REPO_DIR"
fi

# Clone wiki repository
echo "📥 Cloning wiki repository..."
if ! git clone "$WIKI_URL" "$WIKI_REPO_DIR" 2>/dev/null; then
    echo "⚠️  Wiki repository doesn't exist yet - creating..."
    mkdir -p "$WIKI_REPO_DIR"
    cd "$WIKI_REPO_DIR"
    git init
    git remote add origin "$WIKI_URL"
    
    # Create initial commit
    echo "# Nearest Nice Weather Wiki" > README.md
    git add README.md
    git commit -m "Initial wiki setup"
    
    # Create and switch to master branch (GitHub wikis use master)
    git branch -M master
else
    cd "$WIKI_REPO_DIR"
    echo "✅ Wiki repository cloned successfully"
fi

# Copy prepared content
echo "📤 Copying prepared content..."
COPIED_COUNT=0

# Copy Home page first (special handling)
if [ -f "$WIKI_PREP_DIR/../wiki-pages/Home.md" ]; then
    echo "  🏠 Copying Home page..."
    cp "$WIKI_PREP_DIR/../wiki-pages/Home.md" "$WIKI_REPO_DIR/Home.md"
    COPIED_COUNT=$((COPIED_COUNT + 1))
fi

# Copy all other prepared files
find "$WIKI_PREP_DIR" -name "*.md" | while read -r file; do
    filename=$(basename "$file")
    
    # Skip index file
    if [ "$filename" = "_Content-Index.md" ]; then
        continue
    fi
    
    echo "  📄 Copying: $filename"
    cp "$file" "$WIKI_REPO_DIR/$filename"
    COPIED_COUNT=$((COPIED_COUNT + 1))
done

echo "📊 Copied $COPIED_COUNT files to wiki repository"

# Add all files to git
echo "📝 Staging files for commit..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit - wiki is up to date"
    cd "$PROJECT_ROOT"
    rm -rf "$WIKI_REPO_DIR"
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "docs: Complete documentation migration to GitHub Wiki

- Migrated $FILE_COUNT documentation files from /documentation directory
- Converted all internal links to wiki format
- Added metadata headers and navigation
- Organized content by category for better discoverability
- Established comprehensive wiki structure for team collaboration

Generated with Claude Code Wiki Migration Script"

# Push to GitHub
echo "🚀 Pushing to GitHub Wiki..."
if git push origin master; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎯 Your GitHub Wiki is now available at:"
    echo "   https://github.com/${GITHUB_REPO}/wiki"
    echo ""
    echo "📋 Migration Summary:"
    echo "   • Files migrated: $FILE_COUNT"
    echo "   • Home page: ✅ Created"
    echo "   • Navigation: ✅ Organized by category"
    echo "   • Links: ✅ Converted to wiki format"
    echo ""
    echo "🔍 Next Steps:"
    echo "   1. Visit the wiki to verify content and navigation"
    echo "   2. Test search functionality"
    echo "   3. Grant team members wiki edit permissions"
    echo "   4. Update any external references to point to wiki"
    echo ""
else
    echo "❌ Error: Failed to push to GitHub"
    echo "   Check your GitHub permissions and try again"
    exit 1
fi

# Clean up local wiki repository
cd "$PROJECT_ROOT"
rm -rf "$WIKI_REPO_DIR"
echo "🧹 Cleaned up local wiki repository"

echo ""
echo "🎉 Wiki migration complete!"
echo "   Visit: https://github.com/${GITHUB_REPO}/wiki"