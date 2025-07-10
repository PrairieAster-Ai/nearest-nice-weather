#!/bin/bash
# Quick Node.js Development Server Permission Check & Fix

echo "🔍 Quick Permission Diagnostic for Node.js Development Servers"
echo "=============================================================="
echo ""

# Basic checks
echo "📋 Basic System Info:"
echo "   User: $(whoami)"
echo "   Groups: $(groups)"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo ""

# Check critical permissions
echo "🔍 Critical Permission Checks:"

# 1. Check if we can create files in project directory
if touch test-permission.tmp 2>/dev/null; then
    echo "   ✅ Can create files in project directory"
    rm -f test-permission.tmp
else
    echo "   ❌ Cannot create files in project directory"
fi

# 2. Check node_modules permissions
if [[ -d "node_modules" ]]; then
    if [[ -x "node_modules/.bin/vite" ]]; then
        echo "   ✅ Vite executable has proper permissions"
    else
        echo "   ⚠️  Vite executable may need permission fix"
    fi
else
    echo "   ⚠️  node_modules not found"
fi

# 3. Check npm cache
NPM_CACHE=$(npm config get cache)
if [[ -w "$NPM_CACHE" ]]; then
    echo "   ✅ npm cache is writable"
else
    echo "   ⚠️  npm cache permission issue: $NPM_CACHE"
fi

# 4. Test simple server creation
echo ""
echo "🧪 Testing Simple Server Creation:"
node -e "
const http = require('http');
const server = http.createServer((req, res) => res.end('OK'));
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  console.log('   ✅ Can create HTTP server on port', port);
  server.close();
});
server.on('error', (err) => {
  console.log('   ❌ Server creation failed:', err.message);
});
" 2>/dev/null

echo ""
echo "🔧 Quick Permission Fixes:"
echo "   1. Fix node_modules permissions"
echo "   2. Fix npm cache permissions"
echo "   3. Test Vite with explicit host binding"
echo ""

read -p "Apply quick fixes? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Applying fixes..."
    
    # Fix node_modules permissions
    if [[ -d "node_modules" ]]; then
        echo "   Fixing node_modules permissions..."
        chmod -R u+rwX node_modules/ 2>/dev/null || echo "   ⚠️  Some node_modules fixes failed"
        
        if [[ -d "node_modules/.bin" ]]; then
            chmod +x node_modules/.bin/* 2>/dev/null || echo "   ⚠️  Some .bin fixes failed"
        fi
    fi
    
    # Clear npm cache
    echo "   Clearing npm cache..."
    npm cache clean --force 2>/dev/null || echo "   ⚠️  npm cache clean failed"
    
    echo "   ✅ Quick fixes applied"
    echo ""
    echo "🚀 Test Development Server:"
    echo "   Try: npm run dev"
    echo "   Or: cd apps/web && vite --host 127.0.0.1 --port 3001"
else
    echo "   Fixes skipped"
fi

echo ""
echo "💡 Additional Solutions:"
echo "   1. Restart Docker: sudo systemctl restart docker"
echo "   2. Use different port: DEV_PORT=3005 npm run dev"
echo "   3. Try explicit host: vite --host 0.0.0.0"
echo "   4. Check firewall: sudo ufw status"
echo ""