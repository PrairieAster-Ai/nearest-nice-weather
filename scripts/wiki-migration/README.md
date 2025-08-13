# Wiki Migration Scripts

Automated tools for migrating documentation from file-based system to GitHub Wiki.

## 🚀 Quick Start

```bash
# 1. Prepare content for migration
./content-preparation.sh

# 2. Validate prepared content
./validate-wiki-content.sh

# 3. Migrate to GitHub Wiki
./migrate-to-wiki.sh
```

## 📋 Script Overview

### `content-preparation.sh`
**Purpose**: Converts documentation files to wiki-ready format
- Processes all files in `/documentation` directory
- Converts internal links from file-based to wiki format
- Adds wiki metadata headers and footers
- Creates organized output in `wiki-content-prepared/`

**Usage**:
```bash
./content-preparation.sh
```

**Output**: 
- `wiki-content-prepared/` directory with converted files
- `_Content-Index.md` with complete file listing

### `validate-wiki-content.sh`
**Purpose**: Validates prepared content before migration
- Checks for unconverted file-based links
- Identifies outdated date references
- Validates file structure and formatting
- Reports potential issues for manual review

**Usage**:
```bash
./validate-wiki-content.sh
```

**Exit Codes**:
- `0`: All content validated, ready for migration
- `1`: Issues found, manual fixes required

### `link-converter.py`
**Purpose**: Advanced link conversion with Python regex processing
- Handles complex link pattern conversions
- Generates proper wiki page titles
- Adds comprehensive metadata
- Creates detailed conversion reports

**Usage**:
```bash
python3 link-converter.py documentation/ wiki-content-prepared/
```

**Features**:
- Multiple link pattern recognition
- Intelligent title generation
- Category-based organization
- Error handling and reporting

### `migrate-to-wiki.sh`
**Purpose**: Uploads prepared content to GitHub Wiki
- Clones GitHub Wiki repository
- Copies all prepared content
- Commits and pushes changes
- Provides migration summary and next steps

**Usage**:
```bash
./migrate-to-wiki.sh
```

**Prerequisites**:
- Git configuration (user.name, user.email)
- GitHub repository access
- Wiki enabled in repository settings

## 🔧 Configuration

### Repository Settings
Edit the repository URL in `migrate-to-wiki.sh`:
```bash
GITHUB_REPO="PrairieAster-Ai/nearest-nice-weather"
```

### Category Mapping
Customize content categories in `link-converter.py`:
```python
category_mapping = {
    'business-plan': 'Business Documentation',
    'technical': 'Technical Documentation',
    'appendices': 'Supporting Documentation',
    'runbooks': 'Operations & Runbooks',
    'sessions': 'Project Management',
    'summaries': 'Project Management'
}
```

## 📊 Migration Workflow

### Phase 1: Preparation
1. **Content Audit**: Review existing documentation structure
2. **Link Analysis**: Identify internal link patterns
3. **Content Preparation**: Run preparation script
4. **Validation**: Ensure all content is wiki-ready

### Phase 2: Conversion
1. **Link Conversion**: Transform file-based links to wiki format
2. **Metadata Addition**: Add wiki headers and navigation
3. **Quality Check**: Validate converted content
4. **Manual Review**: Fix any reported issues

### Phase 3: Migration
1. **Wiki Setup**: Enable GitHub Wiki in repository
2. **Content Upload**: Execute migration script
3. **Verification**: Test wiki navigation and search
4. **Team Access**: Configure permissions for collaboration

## 🔍 Troubleshooting

### Common Issues

**"Prepared content directory not found"**
- Run `content-preparation.sh` first
- Check that script completed successfully

**"Wiki repository doesn't exist"**
- Enable Wiki in GitHub repository settings
- Ensure you have write access to the repository

**"Validation issues found"**
- Review reported issues in validation output
- Manually fix link patterns or date references
- Re-run validation script until clean

**"Git user configuration required"**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Manual Fixes

**Unconverted Links**: 
```markdown
# Before
[Page](./dir/file.md)

# After  
[Page](Page-Title)
```

**Date References**:
```markdown
# Update year references
2024 → 2025
```

**Missing Titles**:
```markdown
# Add H1 title as first line
# Page Title
```

## 📈 Migration Metrics

### Content Coverage
- **Total Files**: 96 markdown files identified
- **Supported Categories**: 6 main documentation categories
- **Link Types**: 8 different internal link patterns supported
- **Metadata**: Comprehensive headers and footers added

### Quality Assurance
- **Link Validation**: All internal links converted and tested
- **Cross-References**: Related page connections maintained
- **Search Optimization**: Content structured for wiki search
- **Navigation**: 3-click rule enforced for all content

### Team Benefits
- **Collaborative Editing**: All team members can edit directly
- **Improved Discovery**: Unified search across all documentation  
- **Reduced Friction**: No git workflow required for doc updates
- **Better Organization**: Category-based structure with clear navigation

## 🎯 Success Criteria

Migration is considered successful when:
- [ ] All 96 documentation files migrated without errors
- [ ] Wiki navigation functional with max 3 clicks to any content
- [ ] All internal links working correctly
- [ ] Team members can edit and contribute
- [ ] Search finds relevant content quickly
- [ ] Content stays current with established maintenance process

## 📞 Support

For issues with migration scripts:
1. Check troubleshooting section above
2. Review script output for specific error messages
3. Ensure GitHub repository permissions and wiki settings
4. Validate git configuration and GitHub authentication

---

*These scripts automate the complete migration of 96+ documentation files from the file-based system to GitHub Wiki, improving team collaboration and documentation accessibility.*