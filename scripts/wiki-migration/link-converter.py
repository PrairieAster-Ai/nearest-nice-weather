#!/usr/bin/env python3
"""
Wiki Link Converter
Converts markdown file links to GitHub Wiki format
"""

import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

def convert_filename_to_wiki_title(filename: str) -> str:
    """Convert a filename to wiki page title format"""
    # Remove .md extension
    name = filename.replace('.md', '')

    # Convert hyphens to spaces, then title case, then back to hyphens
    title = name.replace('-', ' ').title().replace(' ', '-')

    # Handle special cases
    title_mapping = {
        'Api': 'API',
        'Kpi': 'KPI',
        'Prd': 'PRD',
        'Ui': 'UI',
        'Ux': 'UX',
        'Pwa': 'PWA',
        'Sql': 'SQL',
        'Html': 'HTML',
        'Css': 'CSS',
        'Json': 'JSON',
        'Http': 'HTTP',
        'Https': 'HTTPS',
        'Aws': 'AWS',
        'Gcp': 'GCP'
    }

    for old, new in title_mapping.items():
        title = title.replace(old, new)

    return title

def extract_links_from_file(file_path: Path) -> List[Tuple[str, str]]:
    """Extract all markdown links from a file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for markdown links: [text](url)
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    matches = re.findall(pattern, content)

    return matches

def convert_link_patterns(content: str) -> str:
    """Convert various internal link patterns to wiki format"""

    # Pattern 1: Relative file links ./filename.md
    content = re.sub(r'\]\(\./([^)]+)\.md\)', r'](\1)', content)

    # Pattern 2: Parent directory links ../filename.md
    content = re.sub(r'\]\(\.\./([^)]+)\.md\)', r'](\1)', content)

    # Pattern 3: Nested directory links ../dir/filename.md
    content = re.sub(r'\]\(\.\./([^/]+)/([^)]+)\.md\)', lambda m: f']({convert_filename_to_wiki_title(m.group(2))})', content)

    # Pattern 4: Double parent directory ../../filename.md
    content = re.sub(r'\]\(\.\./\.\./([^)]+)\.md\)', r'](\1)', content)

    # Pattern 5: Directory/file patterns ./dir/filename.md
    content = re.sub(r'\]\(\./([^/]+)/([^)]+)\.md\)', lambda m: f']({convert_filename_to_wiki_title(m.group(2))})', content)

    # Pattern 6: Simple filename.md (no path)
    content = re.sub(r'\]\(([^)]+)\.md\)', lambda m: f']({convert_filename_to_wiki_title(m.group(1))})', content)

    return content

def add_wiki_metadata(content: str, title: str, category: str) -> str:
    """Add wiki-appropriate metadata to content"""

    # Extract original title if it exists
    lines = content.split('\n')
    original_title = None

    if lines and lines[0].startswith('# '):
        original_title = lines[0][2:].strip()
        lines = lines[1:]  # Remove original title line

    # Use provided title or original title
    display_title = original_title or title

    # Create metadata header
    header = f"""# {display_title}

**Category**: {category}
**Last Updated**: August 12, 2025
**Status**: Current

---

"""

    # Add footer
    footer = """

---

## Related Documentation

*See the [Home](Home) page for complete documentation navigation.*

---

*This page is part of the Nearest Nice Weather project documentation. Please keep it current as the project evolves.*"""

    # Remove empty lines at start of content
    content_lines = [line for line in lines if line.strip()]
    if content_lines:
        while content_lines and not content_lines[0].strip():
            content_lines.pop(0)

    return header + '\n'.join(content_lines) + footer

def process_file(input_path: Path, output_path: Path, category: str = "Documentation") -> Dict[str, any]:
    """Process a single file for wiki conversion"""

    try:
        # Read original content
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Convert links
        converted_content = convert_link_patterns(content)

        # Generate wiki title
        wiki_title = convert_filename_to_wiki_title(input_path.stem)

        # Add metadata
        final_content = add_wiki_metadata(converted_content, wiki_title, category)

        # Write converted content
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(final_content)

        # Extract metrics
        original_links = len(re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content))
        converted_links = len(re.findall(r'\[([^\]]+)\]\(([^)]+)\)', final_content))

        return {
            'success': True,
            'original_file': str(input_path),
            'wiki_file': str(output_path),
            'wiki_title': wiki_title,
            'original_links': original_links,
            'converted_links': converted_links,
            'content_length': len(final_content)
        }

    except Exception as e:
        return {
            'success': False,
            'original_file': str(input_path),
            'error': str(e)
        }

def main():
    """Main conversion process"""

    if len(sys.argv) != 3:
        print("Usage: python3 link-converter.py <input_dir> <output_dir>")
        print("Example: python3 link-converter.py documentation/ wiki-content-prepared/")
        sys.exit(1)

    input_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])

    print("🔗 Wiki Link Converter")
    print(f"Input: {input_dir}")
    print(f"Output: {output_dir}")
    print("---")

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Category mapping
    category_mapping = {
        'business-plan': 'Business Documentation',
        'technical': 'Technical Documentation',
        'appendices': 'Supporting Documentation',
        'runbooks': 'Operations & Runbooks',
        'sessions': 'Project Management',
        'summaries': 'Project Management',
        'guides': 'Development Guides'
    }

    # Process all markdown files
    processed_files = []
    failed_files = []

    def process_directory(dir_path: Path, category: str):
        """Process all markdown files in a directory"""

        if not dir_path.exists():
            print(f"⚠️  Directory not found: {dir_path}")
            return

        print(f"📁 Processing {category}...")

        for md_file in dir_path.glob("*.md"):
            wiki_filename = convert_filename_to_wiki_title(md_file.stem) + ".md"
            output_path = output_dir / wiki_filename

            print(f"  📄 {md_file.name} → {wiki_filename}")

            result = process_file(md_file, output_path, category)

            if result['success']:
                processed_files.append(result)
            else:
                failed_files.append(result)
                print(f"    ❌ Error: {result['error']}")

    # Process main documentation directories
    for subdir, category in category_mapping.items():
        dir_path = input_dir / subdir
        process_directory(dir_path, category)

    # Process root-level documentation files
    print("📁 Processing root documentation files...")
    root_files = [f for f in input_dir.glob("*.md") if f.name not in ['README.md', 'CLAUDE.md', 'CLAUDE.local.md']]

    for md_file in root_files:
        wiki_filename = convert_filename_to_wiki_title(md_file.stem) + ".md"
        output_path = output_dir / wiki_filename

        print(f"  📄 {md_file.name} → {wiki_filename}")

        result = process_file(md_file, output_path, "Project Documentation")

        if result['success']:
            processed_files.append(result)
        else:
            failed_files.append(result)
            print(f"    ❌ Error: {result['error']}")

    # Generate summary report
    print("\n📊 Conversion Summary:")
    print(f"   • Files processed successfully: {len(processed_files)}")
    print(f"   • Files failed: {len(failed_files)}")

    if processed_files:
        total_links = sum(f['converted_links'] for f in processed_files)
        print(f"   • Total links converted: {total_links}")

    # Create index file
    index_content = "# Wiki Content Index\n\n"
    index_content += f"**Generated**: August 12, 2025  \n"
    index_content += f"**Total Files**: {len(processed_files)}  \n\n"

    # Group by category
    by_category = {}
    for file_info in processed_files:
        category = "Unknown"
        # Extract category from content if possible
        try:
            with open(file_info['wiki_file'], 'r') as f:
                content = f.read()
                match = re.search(r'\*\*Category\*\*:\s*([^\n]+)', content)
                if match:
                    category = match.group(1).strip()
        except:
            pass

        if category not in by_category:
            by_category[category] = []
        by_category[category].append(file_info)

    for category, files in by_category.items():
        index_content += f"## {category}\n\n"
        for file_info in sorted(files, key=lambda x: x['wiki_title']):
            title = file_info['wiki_title']
            index_content += f"- [{title}]({title})\n"
        index_content += "\n"

    # Write index
    index_path = output_dir / "_Content-Index.md"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)

    print(f"\n✅ Conversion complete!")
    print(f"📋 Content index created: {index_path}")

    if failed_files:
        print(f"\n⚠️  {len(failed_files)} files had errors:")
        for fail in failed_files:
            print(f"   • {fail['original_file']}: {fail['error']}")

if __name__ == "__main__":
    main()
