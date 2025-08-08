/**
 * ========================================================================
 * REDIS CACHE SERVICE - Environment-Aware Caching Implementation
 * ========================================================================
 * 
 * @PURPOSE: Unified caching service for weather data with environment-specific backends
 * @PRD_REF: PRD-REDIS-CACHING-180.md
 * @ARCHITECTURE: 
 *   - Localhost: In-memory Map cache (development efficiency)
 *   - Vercel: Upstash Redis (serverless-optimized)
 *   - Graceful degradation when cache unavailable
 * 
 * BUSINESS IMPACT:
 *   - Reduces OpenWeather API costs by >60%
 *   - Improves API response times by >40%
 *   - Enhances development velocity with fast localhost caching
 */

// Types for cache operations
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface CacheStats {
  hits: number
  misses: number
  errors: number
  totalRequests: number
  hitRate: number
}

export interface CacheConfiguration {
  environment: 'localhost' | 'vercel' | 'unknown'
  backend: 'memory' | 'redis' | 'disabled'
  defaultTTL: number
  maxMemoryEntries: number
  keyPrefix: string
  redisUrl?: string
}

export class CacheError extends Error {
  constructor(message: string, public code: string, public recoverable: boolean = true) {
    super(message)
    this.name = 'CacheError'
  }
}

/**
 * ENVIRONMENT-AWARE CACHE SERVICE
 * 
 * Provides unified caching interface with automatic backend selection:
 * - Development: Fast in-memory cache for rapid iteration
 * - Production: Persistent Redis cache for cost optimization
 * - Graceful degradation: Continue operation if cache unavailable
 */
export class CacheService {
  private config: CacheConfiguration
  private memoryCache: Map<string, CacheEntry> = new Map()
  private redisClient: any = null
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
    hitRate: 0
  }

  constructor(customConfig?: Partial<CacheConfiguration>) {
    this.config = this.detectEnvironmentConfig(customConfig)
    this.initializeCache()
  }

  /**
   * ENVIRONMENT DETECTION & CONFIGURATION
   * Automatically configure cache backend based on environment
   */
  private detectEnvironmentConfig(customConfig?: Partial<CacheConfiguration>): CacheConfiguration {
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV)
    const isLocalhost = !isVercel && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)
    
    const baseConfig: CacheConfiguration = {
      environment: isVercel ? 'vercel' : (isLocalhost ? 'localhost' : 'unknown'),
      backend: 'memory', // Default fallback
      defaultTTL: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
      maxMemoryEntries: 1000,
      keyPrefix: 'nnw:', // Nearest Nice Weather prefix
      redisUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL
    }

    // Environment-specific backend selection
    if (isVercel && baseConfig.redisUrl) {
      baseConfig.backend = 'redis'
    } else if (isLocalhost) {
      baseConfig.backend = 'memory' // Fast development
    } else {
      baseConfig.backend = 'disabled' // Safe fallback
    }

    // Apply custom overrides
    return { ...baseConfig, ...customConfig }
  }

  /**
   * INITIALIZE CACHE BACKEND
   * Set up Redis client for Vercel or memory cache for localhost
   */
  private async initializeCache(): Promise<void> {
    try {
      if (this.config.backend === 'redis' && this.config.redisUrl) {
        // Import Redis client dynamically for Vercel serverless compatibility
        const { Redis } = await import('@upstash/redis')
        
        this.redisClient = Redis.fromEnv({
          url: this.config.redisUrl,
          token: process.env.UPSTASH_REDIS_REST_TOKEN
        })
        
        console.log(`✅ Redis cache initialized for ${this.config.environment} environment`)
      } else if (this.config.backend === 'memory') {
        console.log(`✅ Memory cache initialized for ${this.config.environment} environment`)
      } else {
        console.log(`⚠️ Cache disabled for ${this.config.environment} environment`)
      }
    } catch (error) {
      console.error('Cache initialization failed:', error)
      // Graceful degradation to memory cache
      this.config.backend = 'memory'
      console.log('🔄 Falling back to memory cache')
    }
  }

  /**
   * CACHE KEY GENERATION
   * Generate consistent cache keys for weather data
   */
  private generateCacheKey(baseKey: string, params?: Record<string, any>): string {
    let key = `${this.config.keyPrefix}${baseKey}`
    
    if (params) {
      // Sort parameters for consistent key generation
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}:${params[k]}`)
        .join('|')
      key += `:${sortedParams}`
    }
    
    return key
  }

  /**
   * GET FROM CACHE
   * Retrieve data with automatic expiration handling
   */
  async get<T>(key: string, params?: Record<string, any>): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key, params)
    this.stats.totalRequests++

    try {
      let entry: CacheEntry<T> | null = null

      if (this.config.backend === 'redis' && this.redisClient) {
        // Redis backend
        const redisData = await this.redisClient.get(cacheKey)
        if (redisData) {
          entry = JSON.parse(redisData) as CacheEntry<T>
        }
      } else if (this.config.backend === 'memory') {
        // Memory backend
        entry = this.memoryCache.get(cacheKey) as CacheEntry<T> || null
      }

      // Check if entry exists and is not expired
      if (entry) {
        const now = Date.now()
        if (now - entry.timestamp < entry.ttl) {
          this.stats.hits++
          this.updateHitRate()
          return entry.data
        } else {
          // Entry expired, remove it
          await this.delete(key, params)
        }
      }

      this.stats.misses++
      this.updateHitRate()
      return null

    } catch (error) {
      this.stats.errors++
      console.error(`Cache GET error for key ${cacheKey}:`, error)
      return null // Graceful degradation
    }
  }

  /**
   * SET TO CACHE
   * Store data with TTL and automatic cleanup
   */
  async set<T>(key: string, data: T, params?: Record<string, any>, ttl?: number): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key, params)
    const cacheTTL = ttl || this.config.defaultTTL

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: cacheTTL,
        key: cacheKey
      }

      if (this.config.backend === 'redis' && this.redisClient) {
        // Redis backend with TTL
        const ttlSeconds = Math.ceil(cacheTTL / 1000)
        await this.redisClient.setex(cacheKey, ttlSeconds, JSON.stringify(entry))
      } else if (this.config.backend === 'memory') {
        // Memory backend with size management
        this.memoryCache.set(cacheKey, entry)
        this.cleanupMemoryCache()
      }

      return true

    } catch (error) {
      this.stats.errors++
      console.error(`Cache SET error for key ${cacheKey}:`, error)
      return false // Graceful degradation
    }
  }

  /**
   * DELETE FROM CACHE
   * Remove specific cache entry
   */
  async delete(key: string, params?: Record<string, any>): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key, params)

    try {
      if (this.config.backend === 'redis' && this.redisClient) {
        await this.redisClient.del(cacheKey)
      } else if (this.config.backend === 'memory') {
        this.memoryCache.delete(cacheKey)
      }

      return true

    } catch (error) {
      console.error(`Cache DELETE error for key ${cacheKey}:`, error)
      return false
    }
  }

  /**
   * MEMORY CACHE CLEANUP
   * Manage memory cache size and remove expired entries
   */
  private cleanupMemoryCache(): void {
    const now = Date.now()
    
    // Remove expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.memoryCache.delete(key)
      }
    }

    // Enforce size limit (LRU eviction)
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      const entriesToRemove = this.memoryCache.size - this.config.maxMemoryEntries
      const keys = Array.from(this.memoryCache.keys())
      
      for (let i = 0; i < entriesToRemove; i++) {
        this.memoryCache.delete(keys[i])
      }
    }
  }

  /**
   * BATCH OPERATIONS
   * Efficient handling of multiple cache operations
   */
  async getBatch<T>(keys: Array<{ key: string; params?: Record<string, any> }>): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    
    // For now, execute serially (can be optimized with Redis pipeline)
    for (const keySpec of keys) {
      const result = await this.get<T>(keySpec.key, keySpec.params)
      const cacheKey = this.generateCacheKey(keySpec.key, keySpec.params)
      results.set(cacheKey, result)
    }
    
    return results
  }

  async setBatch<T>(entries: Array<{ key: string; data: T; params?: Record<string, any>; ttl?: number }>): Promise<boolean[]> {
    const results: boolean[] = []
    
    for (const entry of entries) {
      const result = await this.set(entry.key, entry.data, entry.params, entry.ttl)
      results.push(result)
    }
    
    return results
  }

  /**
   * CACHE HEALTH & MONITORING
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  getConfiguration(): CacheConfiguration {
    return { ...this.config }
  }

  async getHealth(): Promise<{ healthy: boolean; backend: string; stats: CacheStats }> {
    let healthy = true

    try {
      if (this.config.backend === 'redis' && this.redisClient) {
        // Test Redis connectivity
        await this.redisClient.ping()
      }
    } catch (error) {
      healthy = false
      console.error('Cache health check failed:', error)
    }

    return {
      healthy,
      backend: this.config.backend,
      stats: this.getStats()
    }
  }

  /**
   * WEATHER-SPECIFIC CACHE METHODS
   * Specialized methods for weather data caching
   */
  async getWeatherData(lat: number, lng: number, precision: number = 2): Promise<any | null> {
    // Round coordinates to specified precision for cache efficiency
    const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision)
    const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision)
    
    return this.get('weather', { lat: roundedLat, lng: roundedLng })
  }

  async setWeatherData(lat: number, lng: number, weatherData: any, precision: number = 2): Promise<boolean> {
    const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision)
    const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision)
    
    return this.set('weather', weatherData, { lat: roundedLat, lng: roundedLng })
  }

  async getBatchWeatherData(coordinates: Array<{ lat: number; lng: number }>, precision: number = 2): Promise<Map<string, any | null>> {
    const keySpecs = coordinates.map(coord => ({
      key: 'weather',
      params: {
        lat: Math.round(coord.lat * Math.pow(10, precision)) / Math.pow(10, precision),
        lng: Math.round(coord.lng * Math.pow(10, precision)) / Math.pow(10, precision)
      }
    }))

    return this.getBatch(keySpecs)
  }
}

// Singleton instance for application-wide use
let cacheServiceInstance: CacheService | null = null

export function getCacheService(config?: Partial<CacheConfiguration>): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService(config)
  }
  return cacheServiceInstance
}

// Export cache service instance for immediate use
export const cacheService = getCacheService()

// Export types
export type { CacheConfiguration, CacheStats, CacheEntry }