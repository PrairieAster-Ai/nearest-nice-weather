#!/bin/bash
# Wiki Content Preparation Script
# Prepares documentation files for GitHub Wiki migration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WIKI_PREP_DIR="$PROJECT_ROOT/wiki-content-prepared"
DOC_DIR="$PROJECT_ROOT/documentation"

echo "🚀 Starting Wiki Content Preparation"
echo "Project Root: $PROJECT_ROOT"
echo "Documentation: $DOC_DIR"
echo "Output: $WIKI_PREP_DIR"
echo "---"

# Create output directory
mkdir -p "$WIKI_PREP_DIR"

# Counter for processed files
PROCESSED_COUNT=0

# Function to convert internal links to wiki format
convert_links() {
    local input_file="$1"
    local output_file="$2"
    
    # Convert various internal link patterns to wiki format
    sed 's|](\.\/\([^)]*\)\.md)|](\1)|g' "$input_file" | \
    sed 's|](\.\./\([^)]*\)\.md)|](\1)|g' | \
    sed 's|](\.\./\.\./\([^)]*\)\.md)|](\1)|g' | \
    sed 's|](\./\([^/]*\)/\([^)]*\)\.md)|](\2)|g' | \
    sed 's|](\.\./\([^/]*\)/\([^)]*\)\.md)|](\2)|g' | \
    sed 's|](\.\./\.\./\([^/]*\)/\([^)]*\)\.md)|](\2)|g' | \
    sed 's|](\([^)]*\)\.md)|](\1)|g' > "$output_file"
}

# Function to add wiki metadata header
add_wiki_header() {
    local file="$1"
    local title="$2"
    local category="$3"
    
    # Create temporary file with header
    temp_file="${file}.tmp"
    
    cat > "$temp_file" << EOF
# $title

**Category**: $category  
**Last Updated**: $(date '+%B %d, %Y')  
**Status**: Migrated from file-based documentation  

---

EOF
    
    # Append original content
    cat "$file" >> "$temp_file"
    
    # Add footer
    cat >> "$temp_file" << EOF

---

*This page was migrated from the file-based documentation system. Please keep it current as the project evolves.*
EOF
    
    # Replace original with enhanced version
    mv "$temp_file" "$file"
}

# Function to process file category
process_category() {
    local source_dir="$1"
    local category_name="$2"
    
    if [ ! -d "$source_dir" ]; then
        echo "⚠️  Directory not found: $source_dir"
        return
    fi
    
    echo "📁 Processing $category_name documents..."
    
    find "$source_dir" -name "*.md" -type f | while read -r file; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .md)
            wiki_name=$(echo "$basename" | sed 's/-/ /g' | sed 's/\b\w/\U&/g' | sed 's/ /-/g')
            output_file="$WIKI_PREP_DIR/${wiki_name}.md"
            
            echo "  📄 Converting: $(basename "$file") → ${wiki_name}.md"
            
            # Convert links and save
            convert_links "$file" "$output_file"
            
            # Add wiki metadata
            add_wiki_header "$output_file" "$wiki_name" "$category_name"
            
            PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
        fi
    done
}

# Process main documentation categories
echo "🔄 Processing documentation categories..."

# Business Documentation
process_category "$DOC_DIR/business-plan" "Business Documentation"

# Technical Documentation  
process_category "$DOC_DIR/technical" "Technical Documentation"

# Appendices
process_category "$DOC_DIR/appendices" "Supporting Documentation"

# Runbooks
process_category "$DOC_DIR/runbooks" "Operations & Runbooks"

# Sessions (convert to project status)
process_category "$DOC_DIR/sessions" "Project Management"

# Summaries (convert to project status)
process_category "$DOC_DIR/summaries" "Project Management"

# Process root-level documentation files
echo "📁 Processing root documentation files..."
for file in "$PROJECT_ROOT"/*.md; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .md)
        
        # Skip certain files
        case "$basename" in
            "README"|"CLAUDE"|"CLAUDE.local")
                echo "  ⏭️  Skipping: $basename (excluded)"
                continue
                ;;
        esac
        
        wiki_name=$(echo "$basename" | sed 's/-/ /g' | sed 's/\b\w/\U&/g' | sed 's/ /-/g')
        output_file="$WIKI_PREP_DIR/${wiki_name}.md"
        
        echo "  📄 Converting: $(basename "$file") → ${wiki_name}.md"
        
        # Convert links and save
        convert_links "$file" "$output_file"
        
        # Add wiki metadata
        add_wiki_header "$output_file" "$wiki_name" "Project Documentation"
        
        PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
    fi
done

# Create content index
echo "📋 Creating content index..."
cat > "$WIKI_PREP_DIR/_Content-Index.md" << EOF
# Wiki Content Index

**Total Files Processed**: $PROCESSED_COUNT  
**Generated**: $(date '+%B %d, %Y at %I:%M %p')

## Files Ready for Wiki Migration

EOF

# List all prepared files
ls -1 "$WIKI_PREP_DIR"/*.md | grep -v "_Content-Index.md" | while read -r file; do
    filename=$(basename "$file" .md)
    echo "- [$filename]($filename)" >> "$WIKI_PREP_DIR/_Content-Index.md"
done

echo ""
echo "✅ Content preparation complete!"
echo "📊 Statistics:"
echo "   • Files processed: $PROCESSED_COUNT"
echo "   • Output directory: $WIKI_PREP_DIR"
echo "   • Content index: $WIKI_PREP_DIR/_Content-Index.md"
echo ""
echo "🔍 Next steps:"
echo "   1. Review prepared content in $WIKI_PREP_DIR"
echo "   2. Run validation script: ./validate-wiki-content.sh"
echo "   3. Execute migration to GitHub Wiki"
echo ""