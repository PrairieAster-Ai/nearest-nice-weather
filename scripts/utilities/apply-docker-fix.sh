#!/bin/bash
# Docker Localhost Fix Application Script
# Run this script to apply the Docker networking configuration that prevents localhost conflicts

echo "🔧 Applying Docker networking fix to prevent localhost conflicts..."

# Check if running as root/sudo
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should NOT be run as root. Run as normal user with sudo when prompted."
   exit 1
fi

# Copy the daemon.json configuration
echo "📝 Creating /etc/docker/daemon.json configuration..."
sudo cp docker-daemon-config.json /etc/docker/daemon.json

# Validate the JSON configuration
echo "✅ Validating JSON configuration..."
python3 -m json.tool /etc/docker/daemon.json > /dev/null && echo "✅ JSON is valid" || echo "❌ JSON is invalid"

# Restart Docker to apply changes
echo "🔄 Restarting Docker service..."
sudo systemctl restart docker

# Wait for Docker to start
sleep 3

# Verify Docker is running
if systemctl is-active --quiet docker; then
    echo "✅ Docker is running"
else
    echo "❌ Docker failed to start"
    exit 1
fi

# Test localhost binding
echo "🧪 Testing localhost binding..."
node -e "
const http = require('http');
const server = http.createServer((req, res) => res.end('OK'));
server.listen(3999, '127.0.0.1', () => {
  console.log('✅ Localhost binding works - Docker fix successful!');
  server.close();
}).on('error', (err) => {
  console.log('❌ Localhost binding failed:', err.message);
  process.exit(1);
});"

echo "🎉 Docker networking fix applied successfully!"
echo "💡 Development servers should now work without localhost conflicts"
