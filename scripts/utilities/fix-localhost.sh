#!/bin/bash
# Quick Docker restart script for localhost development issues

echo "🔧 Fixing localhost development server issues..."
echo "   This will restart Docker to clear networking conflicts"
echo ""

# Ask for sudo password upfront
sudo -v

if [ $? -eq 0 ]; then
    echo "✅ Restarting Docker service..."
    sudo systemctl restart docker

    if [ $? -eq 0 ]; then
        echo "✅ Docker restarted successfully"
        sleep 2

        # Test localhost
        if timeout 3 bash -c "</dev/tcp/127.0.0.1/22" 2>/dev/null; then
            echo "🎉 Localhost binding restored!"
        else
            echo "⚠️  Localhost still blocked, may need system restart"
        fi

        echo ""
        echo "🚀 Now try starting your development server:"
        echo "   cd apps/web && npm run dev"

    else
        echo "❌ Failed to restart Docker"
    fi
else
    echo "❌ Sudo access required to restart Docker"
fi
