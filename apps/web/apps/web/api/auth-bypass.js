/**
 * Vercel Preview Authentication Bypass for Claude Code
 * 
 * This function provides secure access to preview deployments for Claude Code
 * while maintaining security for other users.
 */

export default function handler(req, res) {
  // Only allow in preview environments
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Auth bypass not available in production',
      environment: 'production'
    });
  }

  // Check for Claude Code access token
  const providedToken = req.headers['x-claude-code-token'] || req.query.token;
  const validToken = process.env.CLAUDE_CODE_ACCESS_TOKEN;

  if (!providedToken || !validToken) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Provide x-claude-code-token header or token query parameter'
    });
  }

  if (providedToken !== validToken) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'Token does not match expected value'
    });
  }

  // Generate access information for Claude Code
  const accessInfo = {
    status: 'authenticated',
    environment: process.env.VERCEL_ENV || 'preview',
    deployment: process.env.VERCEL_URL,
    timestamp: new Date().toISOString(),
    features: [
      'screenshot_access',
      'console_monitoring', 
      'performance_tracking',
      'health_checks'
    ],
    endpoints: {
      health: '/health.json',
      screenshot: '/api/screenshot',
      performance: '/api/performance'
    }
  };

  // Set cookie for browser access (optional)
  if (req.query.setCookie === 'true') {
    res.setHeader('Set-Cookie', [
      `claude-code-authenticated=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`,
      `deployment-env=${process.env.VERCEL_ENV}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`
    ]);
  }

  // Enable CORS for Claude Code requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-claude-code-token');

  return res.status(200).json(accessInfo);
}