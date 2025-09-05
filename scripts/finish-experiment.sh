#!/bin/bash

# Finish Experiment Script - Innovation Infrastructure Advantage
# Completes an experiment and merges successful ones to main

set -e

EXPERIMENT_NAME="$1"
RESULT="$2"

if [ -z "$EXPERIMENT_NAME" ] || [ -z "$RESULT" ]; then
    echo "🏁 Finish Experiment"
    echo "Usage: ./scripts/finish-experiment.sh <experiment-name> <result>"
    echo ""
    echo "Results:"
    echo "  success      - Merge to main and deploy"
    echo "  failure      - Archive experiment and return to main"
    echo "  inconclusive - Archive for future reference"
    echo ""
    echo "Examples:"
    echo "  ./scripts/finish-experiment.sh weather-icons success"
    echo "  ./scripts/finish-experiment.sh user-preferences failure"
    exit 1
fi

BRANCH_NAME="experiment/${EXPERIMENT_NAME//[^a-zA-Z0-9]/-}"
EXPERIMENT_FILE=".experiments/${EXPERIMENT_NAME}.md"

echo "🏁 Finishing experiment: $EXPERIMENT_NAME"
echo "📊 Result: $RESULT"

# Verify we're on the experiment branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    echo "⚠️  Not on experiment branch. Switching to $BRANCH_NAME"
    git checkout "$BRANCH_NAME"
fi

# Update experiment documentation
echo ""
echo "📝 Updating experiment documentation..."

# Add result to experiment file
cat >> "$EXPERIMENT_FILE" << EOF

## Final Result: ${RESULT^^}

**Completed:** $(date)
**Duration:** $(git log --format="%cr" -n 1 $(git merge-base main HEAD))

EOF

case $RESULT in
    "success")
        echo "🎉 Experiment successful - preparing for merge to main"

        cat >> "$EXPERIMENT_FILE" << EOF
### Success Summary
- ✅ Hypothesis validated
- ✅ Implementation complete
- ✅ Ready for production

**Merging to main branch for immediate deployment.**
EOF

        # Commit final documentation
        git add "$EXPERIMENT_FILE"
        git commit -m "📊 Complete experiment: $EXPERIMENT_NAME - SUCCESS

Results documented in $EXPERIMENT_FILE
Ready for production deployment.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

        # Push final changes
        git push origin "$BRANCH_NAME"

        # Create and merge PR
        echo "🔄 Creating pull request..."
        gh pr create --title "🎉 Experiment Success: $EXPERIMENT_NAME" \
                     --body-file "$EXPERIMENT_FILE" \
                     --label "experiment" \
                     --label "ready-to-merge" || echo "⚠️ Could not create PR automatically"

        echo ""
        echo "✅ Experiment completed successfully!"
        echo "📋 Next steps:"
        echo "   1. Review and merge the PR when ready"
        echo "   2. Monitor production deployment"
        echo "   3. Validate customer impact"
        ;;

    "failure")
        echo "❌ Experiment failed - archiving and cleaning up"

        cat >> "$EXPERIMENT_FILE" << EOF
### Failure Analysis
- ❌ Hypothesis not validated
- 📚 Lessons learned documented
- 🔄 Consider alternative approaches

**Experiment archived. No changes merged to main.**
EOF

        # Commit final documentation
        git add "$EXPERIMENT_FILE"
        git commit -m "📊 Complete experiment: $EXPERIMENT_NAME - FAILED

Results and lessons learned documented in $EXPERIMENT_FILE
No changes will be merged to main.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

        # Archive the branch
        git push origin "$BRANCH_NAME"
        git tag "experiment-failed-$EXPERIMENT_NAME" HEAD
        git push origin "experiment-failed-$EXPERIMENT_NAME"

        # Return to main
        git checkout main
        git pull origin main

        echo ""
        echo "🗄️ Experiment archived as failed"
        echo "📚 Lessons learned saved in experiment documentation"
        echo "🏷️ Tagged as: experiment-failed-$EXPERIMENT_NAME"
        ;;

    "inconclusive")
        echo "🤔 Experiment inconclusive - archiving for future reference"

        cat >> "$EXPERIMENT_FILE" << EOF
### Inconclusive Results
- ❓ More data needed for validation
- 🔬 Consider longer testing period
- 📊 Additional metrics may be required

**Experiment paused. May be revisited in the future.**
EOF

        # Commit final documentation
        git add "$EXPERIMENT_FILE"
        git commit -m "📊 Complete experiment: $EXPERIMENT_NAME - INCONCLUSIVE

Results documented in $EXPERIMENT_FILE
Experiment paused for future consideration.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

        # Archive the branch
        git push origin "$BRANCH_NAME"
        git tag "experiment-inconclusive-$EXPERIMENT_NAME" HEAD
        git push origin "experiment-inconclusive-$EXPERIMENT_NAME"

        # Return to main
        git checkout main
        git pull origin main

        echo ""
        echo "🗄️ Experiment archived as inconclusive"
        echo "🔮 Available for future investigation"
        echo "🏷️ Tagged as: experiment-inconclusive-$EXPERIMENT_NAME"
        ;;

    *)
        echo "❌ Invalid result: $RESULT"
        echo "Valid options: success, failure, inconclusive"
        exit 1
        ;;
esac

echo ""
echo "🎯 Experiment workflow complete!"
echo "📈 Innovation Infrastructure Advantage: Fast feedback loop achieved"
