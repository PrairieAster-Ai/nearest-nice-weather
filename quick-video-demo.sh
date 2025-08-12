#!/bin/bash

# ========================================================================
# QUICK PLAYWRIGHT VIDEO DEMONSTRATION
# ========================================================================
# 
# PURPOSE: Records a focused demonstration of key Playwright best practices
# DURATION: ~5-10 minutes of video content
# FOCUS: Most important test patterns and user workflows
# 
# ========================================================================

set -e

echo "🎬 Quick Playwright Best Practices Video Demo"
echo "⏱️  Estimated duration: 5-10 minutes"

# Create timestamp for output
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="quick-demo-$TIMESTAMP"

echo "📁 Output directory: $OUTPUT_DIR"

# Run a focused subset of our best practice tests with video recording
echo ""
echo "🎯 Recording: Best Practices Showcase (Key Tests Only)"

npx playwright test tests/best-practices-example.spec.js \
    --config=playwright.config.video.js \
    --project=chromium-video \
    --grep="@smoke" \
    --output="$OUTPUT_DIR" \
    --reporter=list \
    --timeout=30000 \
    || echo "⚠️ Demo completed (some test failures are expected)"

# Check what was recorded
echo ""
echo "🎥 Videos recorded:"
find "$OUTPUT_DIR" -name "*.webm" -o -name "*.mp4" | head -10

# Create a simple summary
TOTAL_VIDEOS=$(find "$OUTPUT_DIR" -name "*.webm" -o -name "*.mp4" | wc -l)
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "📊 Quick Demo Results:"
echo "   🎬 Videos recorded: $TOTAL_VIDEOS"
echo "   📁 Output size: $TOTAL_SIZE"
echo "   📍 Location: $OUTPUT_DIR"

echo ""
echo "✅ Quick demo complete! Key Playwright best practices demonstrated on video."