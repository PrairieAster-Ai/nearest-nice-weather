import { z } from 'zod'

// Input sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// Validation schemas for different inputs
export const UserInputSchemas = {
  weatherFilter: z.object({
    temperature: z.enum(['warm', 'mild', 'cool'], {
      errorMap: () => ({ message: 'Invalid temperature selection' })
    }),
    precipitation: z.enum(['none', 'light', 'any'], {
      errorMap: () => ({ message: 'Invalid precipitation selection' })
    }),
    wind: z.enum(['calm', 'light', 'windy'], {
      errorMap: () => ({ message: 'Invalid wind selection' })
    }),
  }),

  feedback: z.object({
    rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
    comment: z.string()
      .max(1000, 'Comment must be less than 1000 characters')
      .transform(sanitizeString),
    email: z.string()
      .email('Invalid email format')
      .max(254, 'Email is too long')
      .optional()
      .or(z.literal('')),
    category: z.enum(['bug', 'feature', 'general'], {
      errorMap: () => ({ message: 'Invalid feedback category' })
    }),
  }),

  search: z.object({
    query: z.string()
      .min(1, 'Search query cannot be empty')
      .max(100, 'Search query is too long')
      .transform(sanitizeString),
  }),
}

// Rate limiting utilities
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= limit) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }

  reset(key: string) {
    this.requests.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // For inline scripts (minimize in production)
    'https://cdn.jsdelivr.net', // Swagger UI
    'https://cdnjs.cloudflare.com', // Leaflet
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // For Material-UI styles
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com',
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://*.tile.openstreetmap.org', // Map tiles
    'https://cdnjs.cloudflare.com', // Leaflet icons
  ],
  'connect-src': [
    "'self'",
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

// Generate CSP header value
export const generateCSP = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

// Security headers for production
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

// Validate environment variables
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
  ] as const

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// URL validation for external links
export const isValidExternalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export default {
  sanitizeString,
  sanitizeHtml,
  UserInputSchemas,
  rateLimiter,
  validateEnvironment,
  isValidExternalUrl,
  SECURITY_HEADERS,
}