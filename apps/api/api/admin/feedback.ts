/**
 * Admin API endpoint to retrieve all feedback
 * GET /api/admin/feedback
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Client } from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Basic authentication check (you can enhance this)
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== 'Bearer your-secret-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let client: Client | null = null

  try {
    // Database connection
    const DATABASE_URL = process.env.DATABASE_URL
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    client = new Client({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    await client.connect()

    // Query all feedback, ordered by most recent first
    const query = `
      SELECT
        id,
        email,
        feedback,
        user_agent,
        ip_address,
        session_id,
        page_url,
        created_at
      FROM feedback
      ORDER BY created_at DESC
      LIMIT 100
    `

    const result = await client.query(query)

    res.status(200).json({
      success: true,
      feedback: result.rows,
      count: result.rows.length
    })

  } catch (error) {
    console.error('Admin feedback fetch error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    })
  } finally {
    if (client) {
      await client.end()
    }
  }
}
