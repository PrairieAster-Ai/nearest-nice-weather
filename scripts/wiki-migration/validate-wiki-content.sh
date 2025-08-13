#!/bin/bash
# Wiki Content Validation Script
# Validates prepared content before migration to GitHub Wiki

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WIKI_PREP_DIR="$PROJECT_ROOT/wiki-content-prepared"

echo "🔍 Wiki Content Validation"
echo "Checking: $WIKI_PREP_DIR"
echo "---"

# Check if prepared content exists
if [ ! -d "$WIKI_PREP_DIR" ]; then
    echo "❌ Error: Prepared content directory not found"
    echo "   Run content-preparation.sh first"
    exit 1
fi

# Count files
FILE_COUNT=$(find "$WIKI_PREP_DIR" -name "*.md" | wc -l)
echo "📁 Found $FILE_COUNT prepared markdown files"

# Validation counters
ISSUES_FOUND=0
FILES_WITH_ISSUES=0

# Function to report issue
report_issue() {
    local file="$1"
    local issue="$2"
    
    if [ $ISSUES_FOUND -eq 0 ]; then
        echo ""
        echo "⚠️  Issues Found:"
    fi
    
    echo "   📄 $(basename "$file"): $issue"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

echo ""
echo "🔍 Validating content..."

for file in "$WIKI_PREP_DIR"/*.md; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    FILE_BASENAME=$(basename "$file")
    FILE_HAS_ISSUES=false
    
    # Check 1: File-based internal links (should be converted)
    if grep -q "](\./" "$file" || grep -q "](\.\." "$file"; then
        report_issue "$file" "Contains unconverted file-based links"
        FILE_HAS_ISSUES=true
    fi
    
    # Check 2: Markdown extension in links (should be removed)
    if grep -q "\.md)" "$file"; then
        report_issue "$file" "Contains .md extensions in links"
        FILE_HAS_ISSUES=true
    fi
    
    # Check 3: Outdated year references (likely need updating)
    if grep -q "2024" "$file"; then
        report_issue "$file" "Contains 2024 references (may need updating)"
        FILE_HAS_ISSUES=true
    fi
    
    # Check 4: Missing title (first line should be # Title)
    if ! head -n 1 "$file" | grep -q "^# "; then
        report_issue "$file" "Missing H1 title on first line"
        FILE_HAS_ISSUES=true
    fi
    
    # Check 5: Very short files (may be incomplete)
    LINE_COUNT=$(wc -l < "$file")
    if [ "$LINE_COUNT" -lt 5 ]; then
        report_issue "$file" "Very short file ($LINE_COUNT lines) - may be incomplete"
        FILE_HAS_ISSUES=true
    fi
    
    # Check 6: Broken external links (basic check)
    if grep -o "https://[^)]*" "$file" | grep -q "localhost"; then
        report_issue "$file" "Contains localhost links (will be broken in wiki)"
        FILE_HAS_ISSUES=true
    fi
    
    if [ "$FILE_HAS_ISSUES" = true ]; then
        FILES_WITH_ISSUES=$((FILES_WITH_ISSUES + 1))
    fi
done

echo ""
echo "📊 Validation Summary:"
echo "   • Total files: $FILE_COUNT"
echo "   • Files with issues: $FILES_WITH_ISSUES"
echo "   • Total issues found: $ISSUES_FOUND"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo ""
    echo "✅ All content validated successfully!"
    echo "🚀 Ready for wiki migration"
else
    echo ""
    echo "⚠️  Found $ISSUES_FOUND issues in $FILES_WITH_ISSUES files"
    echo "📝 Review and fix issues before migration"
    echo ""
    echo "🔧 Common fixes:"
    echo "   • Update file-based links to wiki format"
    echo "   • Remove .md extensions from internal links"
    echo "   • Update year references to 2025"
    echo "   • Add proper H1 titles to short files"
    echo "   • Replace localhost URLs with production URLs"
fi

echo ""
echo "🔍 Additional checks:"

# Check for potential duplicate content
echo "📄 Checking for potential duplicate titles..."
TITLES=$(grep "^# " "$WIKI_PREP_DIR"/*.md | cut -d: -f2 | sort)
DUPLICATES=$(echo "$TITLES" | uniq -d)

if [ -n "$DUPLICATES" ]; then
    echo "⚠️  Potential duplicate titles found:"
    echo "$DUPLICATES" | sed 's/^/   • /'
else
    echo "✅ No duplicate titles found"
fi

# Check content distribution
echo ""
echo "📊 Content category distribution:"
grep "**Category**:" "$WIKI_PREP_DIR"/*.md | cut -d: -f3 | sort | uniq -c | sed 's/^/   • /'

# Check for missing cross-references
echo ""
echo "🔗 Cross-reference analysis:"
TOTAL_INTERNAL_LINKS=$(grep -o "]\([^)]*\)" "$WIKI_PREP_DIR"/*.md | grep -v "http" | wc -l)
echo "   • Total internal links: $TOTAL_INTERNAL_LINKS"

# Summary and next steps
echo ""
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "🎯 Next Steps:"
    echo "   1. ✅ Content validated - ready for migration"
    echo "   2. 🔧 Set up GitHub Wiki (enable in repository settings)"
    echo "   3. 📤 Upload content using migration script"
    echo "   4. 🔗 Test navigation and links in wiki"
    echo ""
    exit 0
else
    echo "🔧 Fix Required:"
    echo "   1. ⚠️  Address validation issues listed above"
    echo "   2. 🔄 Re-run validation script"
    echo "   3. 📤 Proceed with migration once all issues resolved"
    echo ""
    exit 1
fi