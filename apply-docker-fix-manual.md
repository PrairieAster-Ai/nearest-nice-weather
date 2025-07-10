# Manual Docker Fix Application

## Apply Docker networking fix permanently

Since the automated script requires sudo access, please run these commands manually:

```bash
# Copy the Docker daemon configuration
sudo cp docker-daemon-config.json /etc/docker/daemon.json

# Restart Docker to apply changes
sudo systemctl restart docker

# Verify Docker is running
systemctl is-active docker

# Test localhost binding
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
```

## Verification

After applying the fix, run:
```bash
./scripts/localhost-health-check.sh
```

This ensures the Docker networking configuration is properly applied and localhost development works correctly.