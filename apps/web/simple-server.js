import { createServer } from 'http';
import { readFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3008;
const STATIC_DIR = join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveFile(filePath, res) {
  try {
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

const server = createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(STATIC_DIR, filePath);
  
  try {
    const stats = statSync(filePath);
    if (stats.isFile()) {
      serveFile(filePath, res);
    } else {
      // For SPA routing, serve index.html for non-file requests
      serveFile(join(STATIC_DIR, 'index.html'), res);
    }
  } catch (error) {
    // File doesn't exist, serve index.html for SPA routing
    serveFile(join(STATIC_DIR, 'index.html'), res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running at:`);
  console.log(`   Local:   http://localhost:${PORT}/`);
  console.log(`   Network: http://0.0.0.0:${PORT}/`);
  console.log(`   Static:  ${STATIC_DIR}`);
  console.log(`\n💡 To stop server: Ctrl+C`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
});