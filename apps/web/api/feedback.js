// ========================================================================
// VERCEL SERVERLESS FUNCTION: Feedback Submission API
// ========================================================================
// Handles user feedback submission with database storage

import { neon } from '@neondatabase/serverless'

// Neon serverless database connection
// Standardized environment variable usage across all environments
const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  // CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, feedback, rating, category, categories, session_id, page_url } = req.body

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Feedback text is required' 
      })
    }

    // Get client info
    const userAgent = req.headers['user-agent'] || ''
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        feedback_text TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        category VARCHAR(50) CHECK (category IN ('bug', 'feature', 'general', 'performance')),
        categories JSONB,
        user_agent TEXT,
        ip_address VARCHAR(45),
        session_id VARCHAR(255),
        page_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Handle categories - support both single category and array
    const finalCategory = category || (categories && categories.length > 0 ? categories[0] : 'general')
    const finalCategories = categories || (category ? [category] : ['general'])

    // Insert feedback
    const result = await sql`
      INSERT INTO user_feedback 
      (email, feedback_text, rating, category, categories, user_agent, ip_address, session_id, page_url, created_at)
      VALUES (
        ${email || null},
        ${feedback.trim()},
        ${rating || null},
        ${finalCategory},
        ${JSON.stringify(finalCategories)},
        ${userAgent},
        ${Array.isArray(clientIp) ? clientIp[0] : clientIp},
        ${sessionId},
        ${page_url || null},
        NOW()
      )
      RETURNING id, created_at
    `

    const feedbackRecord = result[0]

    res.status(200).json({
      success: true,
      feedback_id: feedbackRecord.id,
      message: 'Feedback received successfully',
      timestamp: feedbackRecord.created_at.toISOString()
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to submit feedback. Please try again.'
      : error.message

    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}