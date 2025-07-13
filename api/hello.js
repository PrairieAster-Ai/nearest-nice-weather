// Simple test function for Vercel deployment validation
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.json({
    success: true,
    message: 'Hello from Vercel API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url,
    environment: process.env.NODE_ENV || 'development',
    vercel_region: process.env.VERCEL_REGION || 'unknown'
  });
};