#!/bin/bash

# Chrome Extension Reload Script
# Helps reload the BrowserToolsMCP Chrome extension after updates

echo "🔄 BrowserToolsMCP Chrome Extension Reload Guide"
echo "================================================"
echo ""
echo "The Chrome extension has been updated with improved error handling."
echo "To apply the fixes, please follow these steps:"
echo ""
echo "1. 📱 Open Chrome and go to: chrome://extensions/"
echo "2. 🔍 Find the 'BrowserToolsMCP' extension"
echo "3. 🔄 Click the 'Reload' button (circular arrow icon)"
echo "4. 🌐 Refresh the webpage you're debugging"
echo "5. 🛠️ Open Chrome DevTools"
echo "6. 📸 Test the screenshot functionality"
echo ""
echo "If the extension is not installed:"
echo "1. 📁 Go to chrome://extensions/"
echo "2. 🔧 Enable 'Developer mode' (top right)"
echo "3. 📂 Click 'Load unpacked'"
echo "4. 🎯 Select the 'chrome-extension' folder from this project"
echo ""
echo "🔍 Troubleshooting:"
echo "- Check the extension console for errors"
echo "- Verify the server is running: curl http://localhost:3025/health"
echo "- Run diagnostics: ./scripts/browsertools-monitor.sh diagnose"
echo ""
echo "✅ Fixed in this update:"
echo "- Message port timeout issues"
echo "- Better error handling for failed connections"
echo "- Improved response handling in screenshot capture"
echo "- Added 10-second timeout for all operations"
echo ""

# Optional: Try to reload extension automatically (experimental)
if command -v osascript >/dev/null 2>&1; then
    echo "🤖 Attempting to open Chrome extensions page..."
    osascript -e 'tell application "Google Chrome" to open location "chrome://extensions/"' 2>/dev/null || true
fi

echo "📋 After reloading, the extension should work without the message port errors."