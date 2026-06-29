import { z } from 'zod'

/**
 * Strip the most common XSS vectors from a free-text string: `<script>` blocks,
 * `javascript:` protocols, and inline `on*=` event handlers. Best-effort
 * defense-in-depth — not a substitute for output encoding.
 *
 * @param input - Untrusted user-supplied text.
 * @returns The trimmed, sanitized string.
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

/**
 * HTML-encode a string by round-tripping it through a detached element's
 * `textContent`, so it can be safely interpolated as text.
 *
 * @param input - Raw string to encode.
 * @returns The HTML-escaped string.
 */
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

/**
 * Zod schemas for the app's user-facing inputs (weather filter, feedback,
 * search). Feedback/search free-text is sanitized via {@link sanitizeString}
 * during validation.
 */
export const UserInputSchemas = {
  weatherFilter: z.object({
    // zod v4: enum custom messages use `error` (replaced v3 `errorMap`)
    temperature: z.enum(['warm', 'mild', 'cool'], { error: 'Invalid temperature selection' }),
    precipitation: z.enum(['none', 'light', 'any'], { error: 'Invalid precipitation selection' }),
    wind: z.enum(['calm', 'light', 'windy'], { error: 'Invalid wind selection' }),
  }),

  feedback: z.object({
    rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
    comment: z.string()
      .max(1000, 'Comment must be less than 1000 characters')
      .transform(sanitizeString),
    // zod v4: top-level z.email() (v3 .email() string method is deprecated and
    // also dropped the custom message when wrapped in .or()); z.email keeps it.
    email: z.email('Invalid email format')
      .max(254, 'Email is too long')
      .optional()
      .or(z.literal('')),
    category: z.enum(['bug', 'feature', 'general'], { error: 'Invalid feedback category' }),
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

/**
 * Process-wide in-memory rate limiter. Tracks request timestamps per key and
 * allows up to `limit` requests within a sliding `windowMs`.
 */
export const rateLimiter = new RateLimiter()

/**
 * Content Security Policy directives, expressed as directive → allowed-source
 * lists. Consumed by {@link generateCSP} to build the header value.
 */
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
    import.meta.env.VITE_API_BASE_URL || window.location.origin,
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

/**
 * Serialize {@link CSP_DIRECTIVES} into a `Content-Security-Policy` header value.
 *
 * @returns The semicolon-delimited CSP header string.
 */
export const generateCSP = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Recommended production HTTP security headers, including the generated CSP.
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

/**
 * Assert that all required `VITE_*` environment variables are present.
 *
 * @throws Error if any required variable is missing.
 */
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
  ] as const

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Validate that a string is a parseable URL using the `http`/`https` protocol.
 *
 * @param url - Candidate external link.
 * @returns `true` only for well-formed http(s) URLs.
 */
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
