export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const dbUrl = process.env.DATABASE_URL
    const pgUrl = process.env.POSTGRES_URL
    
    // Extract database name from URLs (safely)
    const extractDbInfo = (url) => {
      if (!url) return 'NOT_SET'
      try {
        const urlObj = new URL(url)
        return {
          host: urlObj.hostname,
          database: urlObj.pathname.slice(1), // Remove leading slash
          username: urlObj.username
        }
      } catch {
        return 'INVALID_URL'
      }
    }

    return res.status(200).json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        DATABASE_URL_INFO: extractDbInfo(dbUrl),
        POSTGRES_URL_INFO: extractDbInfo(pgUrl),
        urls_match: dbUrl === pgUrl,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Debug env error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}