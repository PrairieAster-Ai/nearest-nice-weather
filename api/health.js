// ========================================================================
// VERCEL SERVERLESS FUNCTION: Health Check API
// ========================================================================
// Simple health check endpoint for production monitoring

export default async function handler(req, res) {
  // CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    res.json({
      success: true,
      message: 'Production API server is running',
      timestamp: new Date().toISOString(),
      environment: 'vercel-serverless',
      region: process.env.VERCEL_REGION || 'unknown',
      debug: {
        has_postgres_url: !!process.env.POSTGRES_URL,
        has_database_url: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
}