#!/bin/bash
# GitHub Actions Validation Commands
# Run these to validate our improvements

echo "🧪 GitHub Actions Validation Script"
echo "=================================="

echo "1. Check current workflow status:"
gh run list --limit 10 --json status,conclusion,workflowName,createdAt

echo -e "\n2. Check for recent failures:"
gh run list --status failure --limit 5

echo -e "\n3. Monitor specific test run:"
gh run view --log $(gh run list --limit 1 --json databaseId | jq -r '.[0].databaseId')

echo -e "\n4. Check workflow files syntax:"
find .github/workflows -name "*.yml" -exec echo "Checking {}" \; -exec python3 -c "import yaml; yaml.safe_load(open('{}'))" \;

echo -e "\n5. Verify performance monitoring is disabled:"
grep -n "on:" .github/workflows/performance.yml

echo -e "\n6. Check project automation event handling:"
grep -A 5 "context.payload.issue.*context.payload.pull_request" .github/workflows/project-automation.yml

echo -e "\n✅ Validation complete!"
