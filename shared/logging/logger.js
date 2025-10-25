/**
 * ========================================================================
 * STRUCTURED LOGGING MODULE
 * ========================================================================
 *
 * Production-grade logging with environment-specific behavior.
 *
 * PURPOSE:
 * - Replace console.log throughout the codebase
 * - Structured JSON logs for production (log aggregation)
 * - Human-readable logs for development
 * - Contextual information (request ID, user, timestamps)
 *
 * USAGE:
 * ```javascript
 * import { createLogger } from '../../shared/logging/logger.js'
 *
 * const logger = createLogger('api/health')
 *
 * logger.info('Health check requested', { userId: 123 })
 * logger.error('Database connection failed', { error: err.message })
 * logger.debug('Query executed', { query, duration: 45 })
 * ```
 *
 * @module shared/logging/logger
 * @version 1.0.0
 * @created 2025-10-24
 * @part-of Phase 0: Code Quality Prerequisites (CQ-3)
 * ========================================================================
 */

/**
 * Log levels (in order of severity)
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}

/**
 * Log level priority (for filtering)
 */
const LogLevelPriority = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

/**
 * Determine log level from environment
 * Production: INFO and above
 * Development: DEBUG and above
 */
function getMinLogLevel() {
  const env = process.env.NODE_ENV || 'development'
  const vercelEnv = process.env.VERCEL_ENV

  if (env === 'production' || vercelEnv === 'production') {
    return LogLevel.INFO
  }

  if (env === 'test') {
    return LogLevel.ERROR // Suppress logs during testing
  }

  return LogLevel.DEBUG // Development default
}

/**
 * Check if a log level should be logged based on min level
 */
function shouldLog(level, minLevel) {
  return LogLevelPriority[level] >= LogLevelPriority[minLevel]
}

/**
 * Determine if we're in production environment
 */
function isProduction() {
  const env = process.env.NODE_ENV || 'development'
  const vercelEnv = process.env.VERCEL_ENV
  return env === 'production' || vercelEnv === 'production'
}

/**
 * Format timestamp in ISO 8601 format
 */
function formatTimestamp() {
  return new Date().toISOString()
}

/**
 * Create a structured log entry
 */
function createLogEntry(level, module, message, context = {}) {
  return {
    timestamp: formatTimestamp(),
    level,
    module,
    message,
    ...context,
    environment: process.env.NODE_ENV || 'development',
    vercel_env: process.env.VERCEL_ENV || null,
    vercel_region: process.env.VERCEL_REGION || null
  }
}

/**
 * Format log for console output (development mode)
 */
function formatForConsole(level, module, message, context) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1) // Time only
  const levelSymbol = {
    debug: '🔍',
    info: 'ℹ️ ',
    warn: '⚠️ ',
    error: '❌'
  }[level]

  const contextStr = Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : ''

  return `${timestamp} ${levelSymbol} [${module}] ${message}${contextStr}`
}

/**
 * Write log to output
 */
function writeLog(level, module, message, context) {
  const minLevel = getMinLogLevel()

  if (!shouldLog(level, minLevel)) {
    return // Skip logging if below minimum level
  }

  if (isProduction()) {
    // Production: Structured JSON for log aggregation
    const logEntry = createLogEntry(level, module, message, context)
    console.log(JSON.stringify(logEntry))
  } else {
    // Development: Human-readable format
    const formatted = formatForConsole(level, module, message, context)

    // Use appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
      default:
        console.log(formatted)
    }
  }
}

/**
 * Create a logger instance for a specific module
 *
 * @param {string} module - Module name (e.g., 'api/health', 'weather/service')
 * @returns {Object} Logger instance with debug, info, warn, error methods
 *
 * @example
 * const logger = createLogger('api/health')
 * logger.info('Health check requested')
 * logger.error('Database error', { error: err.message, query })
 */
export function createLogger(module) {
  return {
    /**
     * Log debug message (development only)
     * Use for detailed diagnostic information
     */
    debug: (message, context = {}) => {
      writeLog(LogLevel.DEBUG, module, message, context)
    },

    /**
     * Log informational message
     * Use for normal operations and important events
     */
    info: (message, context = {}) => {
      writeLog(LogLevel.INFO, module, message, context)
    },

    /**
     * Log warning message
     * Use for recoverable errors or unexpected conditions
     */
    warn: (message, context = {}) => {
      writeLog(LogLevel.WARN, module, message, context)
    },

    /**
     * Log error message
     * Use for errors that need attention
     */
    error: (message, context = {}) => {
      writeLog(LogLevel.ERROR, module, message, context)
    },

    /**
     * Create a child logger with additional context
     * Useful for adding request-specific context
     *
     * @example
     * const requestLogger = logger.child({ requestId: '123' })
     * requestLogger.info('Processing request') // Includes requestId
     */
    child: (additionalContext = {}) => {
      return {
        debug: (message, context = {}) => {
          writeLog(LogLevel.DEBUG, module, message, { ...additionalContext, ...context })
        },
        info: (message, context = {}) => {
          writeLog(LogLevel.INFO, module, message, { ...additionalContext, ...context })
        },
        warn: (message, context = {}) => {
          writeLog(LogLevel.WARN, module, message, { ...additionalContext, ...context })
        },
        error: (message, context = {}) => {
          writeLog(LogLevel.ERROR, module, message, { ...additionalContext, ...context })
        }
      }
    }
  }
}

/**
 * Create request context for API logging
 * Extracts useful information from Vercel request objects
 */
export function createRequestContext(req) {
  return {
    method: req.method,
    url: req.url,
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    requestId: req.headers['x-request-id'] || crypto.randomUUID?.() || Date.now().toString()
  }
}

/**
 * Create error context for error logging
 * Safely extracts error information
 */
export function createErrorContext(error) {
  return {
    error: error.message,
    errorType: error.name,
    stack: error.stack?.split('\n').slice(0, 5).join('\n') || undefined // First 5 lines only
  }
}

// Default export for convenience
export default {
  createLogger,
  createRequestContext,
  createErrorContext,
  LogLevel
}
