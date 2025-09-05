# Adding Team Scaling Capability to GitHub Project

## Method 1: Via GitHub Web Interface (Recommended)

### Step 1: Access GitHub Project
1. Go to: https://github.com/orgs/PrairieAster-Ai/projects/2
2. Click "New Item" or "+" button

### Step 2: Create Capability Item
**Title**: `Team Scaling Infrastructure (10-15 Technical Professionals)`

**Description**:
```
Enable rapid onboarding and productivity for 10-15 technical professionals
with automated systems providing easy access to all project information.

Key Outcomes:
- Onboarding time: 2-4 hours (vs 2-3 days)
- Zero production breaks from new team members
- Automated quality gates and documentation
- Self-service development environment

Epic Size: 8 weeks
Story Points: 34
Priority: High (Critical for team growth)
```

### Step 3: Set Project Fields
- **Status**: 📋 Backlog
- **Priority**: 🔴 High
- **Type**: Capability
- **Sprint**: Sprint 4 (or next available)
- **Epic**: Team Infrastructure
- **Estimate**: 34 story points

### Step 4: Link Documentation
- Add link to: `/TEAM-SCALING-CAPABILITY.md`
- Reference commit: Latest commit hash
- Link to workflow files: `.github/workflows/*.disabled`

## Method 2: Via GitHub CLI (Alternative)

```bash
# Create the capability item
gh project item-create 2 \
  --title "Team Scaling Infrastructure (10-15 Technical Professionals)" \
  --body-file TEAM-SCALING-CAPABILITY.md

# Set fields (replace ITEM_ID with actual ID from above)
gh project item-edit --id ITEM_ID \
  --field-id "Status" --single-select-option-id "Backlog" \
  --field-id "Priority" --single-select-option-id "High"
```

## Method 3: Create GitHub Issue (Most Integrated)

```bash
gh issue create \
  --title "Epic: Team Scaling Infrastructure (10-15 Technical Professionals)" \
  --body-file TEAM-SCALING-CAPABILITY.md \
  --label "epic,team-infrastructure,high-priority" \
  --assignee @me \
  --project "PrairieAster-Ai/2"
```

This will automatically appear in your GitHub project board.
EOF < /dev/null
