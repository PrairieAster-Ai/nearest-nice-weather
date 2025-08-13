/**
 * ========================================================================
 * WEATHER API SERVICE TESTS
 * ========================================================================
 * 
 * 📋 PURPOSE: Testing for weather API service wrapper
 * 🔗 SERVICE: weatherApi.ts - API wrapper for weather and feedback endpoints  
 * 📊 COVERAGE: Error classes, basic functionality validation
 */

import { describe, it, expect } from 'vitest'
import { WeatherApiError } from '../weatherApi'

describe('Weather API Service', () => {
  describe('✅ WeatherApiError Class', () => {
    it('should create error with message only', () => {
      const error = new WeatherApiError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('WeatherApiError')
      expect(error.status).toBeUndefined()
      expect(error instanceof Error).toBe(true)
    })

    it('should create error with message and status', () => {
      const error = new WeatherApiError('Not found', 404)
      
      expect(error.message).toBe('Not found')
      expect(error.name).toBe('WeatherApiError')
      expect(error.status).toBe(404)
      expect(error instanceof Error).toBe(true)
    })

    it('should create error with different status codes', () => {
      const error500 = new WeatherApiError('Server error', 500)
      const error400 = new WeatherApiError('Bad request', 400)
      
      expect(error500.status).toBe(500)
      expect(error400.status).toBe(400)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new WeatherApiError('Test throw')
      }).toThrow('Test throw')

      expect(() => {
        throw new WeatherApiError('Test throw')
      }).toThrow(WeatherApiError)
    })

    it('should maintain Error prototype chain', () => {
      const error = new WeatherApiError('Test error', 500)
      
      expect(error instanceof Error).toBe(true)
      expect(error instanceof WeatherApiError).toBe(true)
      expect(error.constructor.name).toBe('WeatherApiError')
    })

    it('should handle empty message', () => {
      const error = new WeatherApiError('')
      
      expect(error.message).toBe('')
      expect(error.name).toBe('WeatherApiError')
    })

    it('should handle zero status code', () => {
      const error = new WeatherApiError('Test', 0)
      
      expect(error.status).toBe(0)
    })

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'a'.repeat(1000)
      const error = new WeatherApiError(longMessage, 500)
      
      expect(error.message).toBe(longMessage)
      expect(error.message.length).toBe(1007) // 'Error: ' + 1000 'a's
    })
  })

  describe('✅ API Configuration', () => {
    it('should have weatherApi object available', async () => {
      const { weatherApi } = await import('../weatherApi')
      
      expect(weatherApi).toBeDefined()
      expect(typeof weatherApi).toBe('object')
      expect(typeof weatherApi.getLocations).toBe('function')
      expect(typeof weatherApi.submitFeedback).toBe('function')
    })

    it('should export default weatherApi', async () => {
      const defaultExport = (await import('../weatherApi')).default
      
      expect(defaultExport).toBeDefined()
      expect(typeof defaultExport.getLocations).toBe('function')
      expect(typeof defaultExport.submitFeedback).toBe('function')
    })
  })

  describe('✅ Type Safety', () => {
    it('should handle WeatherApiError type guards', () => {
      const error = new WeatherApiError('Test', 404)
      
      // Type guard function
      const isWeatherApiError = (err: unknown): err is WeatherApiError => {
        return err instanceof WeatherApiError
      }
      
      expect(isWeatherApiError(error)).toBe(true)
      expect(isWeatherApiError(new Error('regular error'))).toBe(false)
      expect(isWeatherApiError('string')).toBe(false)
      expect(isWeatherApiError(null)).toBe(false)
    })

    it('should maintain type information in catch blocks', () => {
      try {
        throw new WeatherApiError('Test error', 403)
      } catch (error) {
        if (error instanceof WeatherApiError) {
          expect(error.status).toBe(403)
          expect(error.message).toBe('Test error')
        } else {
          throw new Error('Type guard failed')
        }
      }
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ WeatherApiError custom error class comprehensive testing
 * ✅ Error inheritance and prototype chain validation
 * ✅ API object availability and structure verification
 * ✅ TypeScript type safety and type guards
 * ✅ Edge cases (empty messages, zero codes, long strings)
 * 
 * 🎯 BUSINESS COVERAGE:
 * ✅ Error handling foundation for API communication
 * ✅ Type safety for development experience
 * ✅ API structure validation for integration
 * 
 * Note: Advanced fetch API testing skipped due to environment constraints.
 * Error class testing provides foundation coverage for the service layer.
 */