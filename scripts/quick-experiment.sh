#!/bin/bash

# Quick Experiment Script - Innovation Infrastructure Advantage
# Creates a feature branch, sets up development environment, and prepares for rapid iteration

set -e

EXPERIMENT_NAME="$1"
DESCRIPTION="$2"

if [ -z "$EXPERIMENT_NAME" ]; then
    echo "🧪 Quick Experiment Setup"
    echo "Usage: ./scripts/quick-experiment.sh <experiment-name> [description]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/quick-experiment.sh weather-icons 'Add weather condition icons'"
    echo "  ./scripts/quick-experiment.sh user-preferences 'Save user weather preferences'"
    echo "  ./scripts/quick-experiment.sh api-caching 'Implement weather data caching'"
    exit 1
fi

# Sanitize experiment name
BRANCH_NAME="experiment/${EXPERIMENT_NAME//[^a-zA-Z0-9]/-}"

echo "🚀 Setting up experiment: $EXPERIMENT_NAME"
echo "📋 Description: ${DESCRIPTION:-'No description provided'}"
echo "🌿 Branch: $BRANCH_NAME"

# 1. Create and switch to experiment branch
echo ""
echo "🌿 Creating experiment branch..."
git checkout main
git pull origin main
git checkout -b "$BRANCH_NAME"

# 2. Update experiment tracking
echo ""
echo "📝 Recording experiment details..."
mkdir -p .experiments
cat > ".experiments/${EXPERIMENT_NAME}.md" << EOF
# Experiment: $EXPERIMENT_NAME

**Branch:** \`$BRANCH_NAME\`
**Created:** $(date)
**Description:** ${DESCRIPTION:-'No description provided'}

## Hypothesis
<!-- What are you testing? What do you expect to happen? -->

## Success Metrics
<!-- How will you measure if this experiment is successful? -->
- [ ] Feature works as expected
- [ ] Performance impact is acceptable
- [ ] User feedback is positive
- [ ] No regressions introduced

## Implementation Notes
<!-- Track your progress here -->

## Results
<!-- Document what you learned -->

EOF

# 3. Prepare development environment
echo ""
echo "🔧 Preparing development environment..."

# Check if development server is running
if ! curl -s http://localhost:3002 > /dev/null; then
    echo "⚡ Starting development server..."
    cd apps/web
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!
    echo "Development server PID: $DEV_PID"
    cd ../..
    
    # Wait for server to start
    echo "⏳ Waiting for development server..."
    for i in {1..30}; do
        if curl -s http://localhost:3002 > /dev/null; then
            echo "✅ Development server ready at http://localhost:3002"
            break
        fi
        sleep 1
    done
else
    echo "✅ Development server already running at http://localhost:3002"
fi

# 4. Set up experiment tracking in git
git add .experiments/
git commit -m "🧪 Start experiment: $EXPERIMENT_NAME

$DESCRIPTION

This experiment branch enables rapid iteration on:
- Feature development
- User testing  
- Performance validation

Branch: $BRANCH_NAME
Tracking: .experiments/${EXPERIMENT_NAME}.md

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. Push branch for preview deployment
echo ""
echo "📤 Creating preview deployment..."
git push -u origin "$BRANCH_NAME"

echo ""
echo "🎉 Experiment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start coding your experiment"
echo "   2. Test locally at http://localhost:3002"
echo "   3. Push changes to get preview deployments"
echo "   4. Document results in .experiments/${EXPERIMENT_NAME}.md"
echo ""
echo "⚡ Rapid iteration workflow:"
echo "   - Make changes → git commit → git push"
echo "   - Preview URL: https://nearest-nice-weather-git-${BRANCH_NAME//\//-}-roberts-projects-3488152a.vercel.app"
echo "   - Merge when ready: gh pr create --title '$EXPERIMENT_NAME' --body-file .experiments/${EXPERIMENT_NAME}.md"
echo ""
echo "🔄 To finish experiment:"
echo "   ./scripts/finish-experiment.sh $EXPERIMENT_NAME [success|failure|inconclusive]"