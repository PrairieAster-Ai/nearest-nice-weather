/**
 * Export feedback as CSV for easy viewing
 * GET /api/feedback-export?token=your-secret-token
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Client } from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple token auth - replace 'bob-feedback-123' with your secret
  if (req.query.token !== 'bob-feedback-123') {
    return res.status(401).json({ error: 'Invalid token' })
  }

  let client: Client | null = null

  try {
    const DATABASE_URL = process.env.DATABASE_URL
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not configured')
    }

    client = new Client({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    try {
      })

    await client.connect()

    const result = await client.query(`
      SELECT 
        id,
        created_at,
        email,
        feedback,
        ip_address,
        session_id,
        page_url
      FROM feedback 
      ORDER BY created_at DESC
    `)

    // Convert to CSV
    const headers = ['ID', 'Date', 'Email', 'Feedback', 'IP', 'Session', 'Page']
    const csvRows = [headers.join(',')]

    result.rows.forEach(row => {
      const csvRow = [
        row.id,
        new Date(row.created_at).toLocaleString(),
        row.email || 'No email',
        `"${row.feedback.replace(/"/g, '""')}"`, // Escape quotes
        row.ip_address,
        row.session_id,
        row.page_url || 'N/A'
      ]
      csvRows.push(csvRow.join(','))
    })

    const csvContent = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv');
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }
    res.setHeader('Content-Disposition', 'attachment; filename="feedback-export.csv"')
    res.status(200).send(csvContent)

  } catch (error) {
    console.error('Feedback export error:', error)
    res.status(500).json({ error: 'Export failed' })
  } finally {
    if (client) {
      try {
        await client.end()
    }
  }
};
      } catch (error) {
        console.error('Operation failed:', error);
        // TODO: Add proper error handling
      }