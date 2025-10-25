/**
 * ========================================================================
 * WEATHER FILTERS UNIT TESTS
 * ========================================================================
 *
 * Comprehensive test suite for shared weather filtering logic.
 *
 * TESTS:
 * - Temperature filtering (cold, hot, mild)
 * - Precipitation filtering (none, light, heavy)
 * - Wind filtering (calm, breezy, windy)
 * - Edge cases (empty arrays, invalid inputs, extreme values)
 * - Filter combinations
 * - Helper utilities (calculatePercentileThreshold, validateFilters)
 *
 * TARGET: 100% code coverage for shared/weather/filters.js
 *
 * @module shared/weather/__tests__/filters.test.js
 * @version 1.0.0
 * @created 2025-10-24
 * @updated 2025-10-24 - Migrated from Jest to Vitest
 * @part-of Phase 0: Code Quality Prerequisites (CQ-1, CQ-2)
 * ========================================================================
 */

// Vitest globals enabled in vitest.config.ts (describe, it, expect, vi)
import {
  applyWeatherFilters,
  calculatePercentileThreshold,
  validateFilters
} from '../filters.js'

// ========================================================================
// SAMPLE TEST DATA
// ========================================================================

/**
 * Create sample POI locations with weather data
 * Represents realistic Minnesota outdoor destinations
 */
function createSampleLocations() {
  return [
    // Cold temperature range (40-50F)
    { id: '1', name: 'Lake Superior North Shore', temperature: 42, precipitation: 10, windSpeed: 8 },
    { id: '2', name: 'Boundary Waters', temperature: 45, precipitation: 15, windSpeed: 5 },
    { id: '3', name: 'Gooseberry Falls', temperature: 48, precipitation: 20, windSpeed: 12 },

    // Mild temperature range (55-70F)
    { id: '4', name: 'Minneapolis Chain of Lakes', temperature: 58, precipitation: 5, windSpeed: 6 },
    { id: '5', name: 'Como Park', temperature: 62, precipitation: 0, windSpeed: 4 },
    { id: '6', name: 'Fort Snelling State Park', temperature: 65, precipitation: 2, windSpeed: 7 },
    { id: '7', name: 'Minnehaha Falls', temperature: 68, precipitation: 8, windSpeed: 9 },

    // Hot temperature range (75-85F)
    { id: '8', name: 'Lake Minnetonka', temperature: 75, precipitation: 12, windSpeed: 10 },
    { id: '9', name: 'Afton State Park', temperature: 78, precipitation: 18, windSpeed: 15 },
    { id: '10', name: 'William O\'Brien State Park', temperature: 82, precipitation: 25, windSpeed: 20 }
  ]
}

// ========================================================================
// TEMPERATURE FILTERING TESTS
// ========================================================================

describe('Temperature Filtering', () => {
  it('should filter for cold temperatures (<=40th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { temperature: 'cold' }
    const result = applyWeatherFilters(locations, filters, () => {}) // Silent logger

    // Expect coldest 40% (4 out of 10 locations)
    expect(result.length).toBe(4)
    expect(result.every(loc => loc.temperature <= 58)).toBe(true)
  })

  it('should filter for hot temperatures (>=60th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { temperature: 'hot' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect hottest 40% (4 out of 10 locations)
    expect(result.length).toBe(4)
    expect(result.every(loc => loc.temperature >= 68)).toBe(true)
  })

  it('should filter for mild temperatures (10th-90th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { temperature: 'mild' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect middle 80% (excludes coldest and hottest 10%)
    expect(result.length).toBe(8)
    const temps = result.map(loc => loc.temperature)
    expect(Math.min(...temps)).toBeGreaterThanOrEqual(45)
    expect(Math.max(...temps)).toBeLessThanOrEqual(78)
  })

  it('should return all locations when temperature filter is empty string', () => {
    const locations = createSampleLocations()
    const filters = { temperature: '' }
    const result = applyWeatherFilters(locations, filters, () => {})

    expect(result.length).toBe(10)
  })

  it('should log temperature threshold when filtering', () => {
    const locations = createSampleLocations()
    const filters = { temperature: 'cold' }
    const mockLogger = vi.fn()

    applyWeatherFilters(locations, filters, mockLogger)

    // Should log cold filter threshold
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('Cold filter'))
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('F'))
  })
})

// ========================================================================
// PRECIPITATION FILTERING TESTS
// ========================================================================

describe('Precipitation Filtering', () => {
  it('should filter for no precipitation (<=60th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { precipitation: 'none' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect driest 60% (6 out of 10 locations)
    expect(result.length).toBe(6)
    expect(result.every(loc => loc.precipitation <= 12)).toBe(true)
  })

  it('should filter for light precipitation (20th-70th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { precipitation: 'light' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect middle precipitation range
    expect(result.length).toBe(5)
    const precips = result.map(loc => loc.precipitation)
    expect(Math.min(...precips)).toBeGreaterThanOrEqual(5)
    expect(Math.max(...precips)).toBeLessThanOrEqual(15)
  })

  it('should filter for heavy precipitation (>=70th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { precipitation: 'heavy' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect wettest 30% (3 out of 10 locations)
    expect(result.length).toBe(3)
    expect(result.every(loc => loc.precipitation >= 18)).toBe(true)
  })

  it('should log precipitation threshold when filtering', () => {
    const locations = createSampleLocations()
    const filters = { precipitation: 'none' }
    const mockLogger = vi.fn()

    applyWeatherFilters(locations, filters, mockLogger)

    // Should log precipitation filter threshold
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('No precip filter'))
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('%'))
  })
})

// ========================================================================
// WIND FILTERING TESTS
// ========================================================================

describe('Wind Filtering', () => {
  it('should filter for calm wind (<=50th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { wind: 'calm' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect calmest 50% (5 out of 10 locations)
    expect(result.length).toBe(5)
    expect(result.every(loc => (loc.windSpeed || 0) <= 8)).toBe(true)
  })

  it('should filter for breezy wind (30th-70th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { wind: 'breezy' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect middle wind range
    expect(result.length).toBe(4)
    const winds = result.map(loc => loc.windSpeed || 0)
    expect(Math.min(...winds)).toBeGreaterThanOrEqual(6)
    expect(Math.max(...winds)).toBeLessThanOrEqual(10)
  })

  it('should filter for windy conditions (>=70th percentile)', () => {
    const locations = createSampleLocations()
    const filters = { wind: 'windy' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Expect windiest 30% (3 out of 10 locations)
    expect(result.length).toBe(3)
    expect(result.every(loc => (loc.windSpeed || 0) >= 12)).toBe(true)
  })

  it('should handle missing windSpeed (treat as 0)', () => {
    const locations = [
      { id: '1', temperature: 60, precipitation: 10 }, // No windSpeed
      { id: '2', temperature: 65, precipitation: 15, windSpeed: 10 },
      { id: '3', temperature: 70, precipitation: 20, windSpeed: 20 }
    ]
    const filters = { wind: 'calm' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Should include location with missing windSpeed (treated as 0)
    expect(result.some(loc => loc.id === '1')).toBe(true)
  })

  it('should log wind threshold when filtering', () => {
    const locations = createSampleLocations()
    const filters = { wind: 'calm' }
    const mockLogger = vi.fn()

    applyWeatherFilters(locations, filters, mockLogger)

    // Should log wind filter threshold
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('Calm filter'))
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('mph'))
  })
})

// ========================================================================
// COMBINED FILTER TESTS
// ========================================================================

describe('Combined Filters', () => {
  it('should apply multiple filters sequentially', () => {
    const locations = createSampleLocations()
    const filters = {
      temperature: 'mild',
      precipitation: 'none',
      wind: 'calm'
    }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Filters should be applied sequentially (AND logic)
    expect(result.length).toBeLessThan(locations.length)

    // All results should satisfy all filter criteria
    result.forEach(loc => {
      expect(loc.temperature).toBeGreaterThanOrEqual(45)
      expect(loc.temperature).toBeLessThanOrEqual(78)
      expect(loc.precipitation).toBeLessThanOrEqual(12)
      expect(loc.windSpeed || 0).toBeLessThanOrEqual(8)
    })
  })

  it('should log all filter steps and final result', () => {
    const locations = createSampleLocations()
    const filters = {
      temperature: 'mild',
      precipitation: 'none',
      wind: 'calm'
    }
    const mockLogger = vi.fn()

    applyWeatherFilters(locations, filters, mockLogger)

    // Should log temperature filter
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('Mild filter'))
    // Should log precipitation filter
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('No precip filter'))
    // Should log wind filter
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('Calm filter'))
    // Should log final result
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('🎯 Weather filtering'))
  })

  it('should skip filters that are empty or undefined', () => {
    const locations = createSampleLocations()
    const filters = {
      temperature: 'mild',
      precipitation: '',
      wind: undefined
    }
    const mockLogger = vi.fn()

    const result = applyWeatherFilters(locations, filters, mockLogger)

    // Only temperature filter should be applied
    expect(mockLogger).toHaveBeenCalledWith(expect.stringContaining('Mild filter'))
    expect(mockLogger).not.toHaveBeenCalledWith(expect.stringContaining('precip'))
    expect(mockLogger).not.toHaveBeenCalledWith(expect.stringContaining('wind'))

    // Result should only have temperature filtering applied
    expect(result.length).toBe(8) // Mild temperature filter only
  })
})

// ========================================================================
// EDGE CASE TESTS
// ========================================================================

describe('Edge Cases', () => {
  it('should return empty array when input is null', () => {
    const result = applyWeatherFilters(null, { temperature: 'cold' }, () => {})
    expect(result).toEqual([])
  })

  it('should return empty array when input is undefined', () => {
    const result = applyWeatherFilters(undefined, { temperature: 'cold' }, () => {})
    expect(result).toEqual([])
  })

  it('should return empty array when input is empty array', () => {
    const result = applyWeatherFilters([], { temperature: 'cold' }, () => {})
    expect(result).toEqual([])
  })

  it('should handle single location', () => {
    const locations = [{ id: '1', temperature: 60, precipitation: 10, windSpeed: 5 }]
    const filters = { temperature: 'cold' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // With only 1 location, it should be included (40th percentile = that location)
    expect(result.length).toBe(1)
  })

  it('should handle two locations', () => {
    const locations = [
      { id: '1', temperature: 50, precipitation: 10, windSpeed: 5 },
      { id: '2', temperature: 80, precipitation: 20, windSpeed: 15 }
    ]
    const filters = { temperature: 'cold' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Should include colder location
    expect(result.length).toBe(1)
    expect(result[0].temperature).toBe(50)
  })

  it('should handle extreme temperature values', () => {
    const locations = [
      { id: '1', temperature: -20, precipitation: 0, windSpeed: 0 },
      { id: '2', temperature: 120, precipitation: 100, windSpeed: 100 }
    ]
    const filters = { temperature: 'cold' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // Should handle extreme values without errors
    expect(result.length).toBe(1)
    expect(result[0].temperature).toBe(-20)
  })

  it('should preserve original locations array', () => {
    const locations = createSampleLocations()
    const originalLength = locations.length
    const originalFirst = { ...locations[0] }

    applyWeatherFilters(locations, { temperature: 'cold' }, () => {})

    // Original array should not be modified
    expect(locations.length).toBe(originalLength)
    expect(locations[0]).toEqual(originalFirst)
  })

  it('should use console.log as default logger', () => {
    const locations = createSampleLocations()
    const filters = { temperature: 'cold' }

    // Should not throw error when no logger provided
    expect(() => {
      applyWeatherFilters(locations, filters)
    }).not.toThrow()
  })
})

// ========================================================================
// HELPER UTILITY TESTS
// ========================================================================

describe('calculatePercentileThreshold', () => {
  it('should calculate correct percentile for sorted values', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    expect(calculatePercentileThreshold(values, 0.5)).toBe(60) // 50th percentile
    expect(calculatePercentileThreshold(values, 0.4)).toBe(50) // 40th percentile
    expect(calculatePercentileThreshold(values, 0.9)).toBe(100) // 90th percentile
  })

  it('should return 0 for empty array', () => {
    expect(calculatePercentileThreshold([], 0.5)).toBe(0)
  })

  it('should return 0 for null input', () => {
    expect(calculatePercentileThreshold(null, 0.5)).toBe(0)
  })

  it('should return 0 for undefined input', () => {
    expect(calculatePercentileThreshold(undefined, 0.5)).toBe(0)
  })

  it('should handle single value', () => {
    expect(calculatePercentileThreshold([42], 0.5)).toBe(42)
  })

  it('should not exceed array bounds', () => {
    const values = [10, 20, 30]

    // 100th percentile should be clamped to last element
    expect(calculatePercentileThreshold(values, 1.0)).toBe(30)
  })
})

describe('validateFilters', () => {
  it('should validate correct temperature values', () => {
    expect(validateFilters({ temperature: '' })).toBe(true)
    expect(validateFilters({ temperature: 'cold' })).toBe(true)
    expect(validateFilters({ temperature: 'hot' })).toBe(true)
    expect(validateFilters({ temperature: 'mild' })).toBe(true)
  })

  it('should reject invalid temperature values', () => {
    expect(validateFilters({ temperature: 'warm' })).toBe(false)
    expect(validateFilters({ temperature: 'freezing' })).toBe(false)
    expect(validateFilters({ temperature: 'invalid' })).toBe(false)
  })

  it('should validate correct precipitation values', () => {
    expect(validateFilters({ precipitation: '' })).toBe(true)
    expect(validateFilters({ precipitation: 'none' })).toBe(true)
    expect(validateFilters({ precipitation: 'light' })).toBe(true)
    expect(validateFilters({ precipitation: 'heavy' })).toBe(true)
  })

  it('should reject invalid precipitation values', () => {
    expect(validateFilters({ precipitation: 'drizzle' })).toBe(false)
    expect(validateFilters({ precipitation: 'moderate' })).toBe(false)
    expect(validateFilters({ precipitation: 'invalid' })).toBe(false)
  })

  it('should validate correct wind values', () => {
    expect(validateFilters({ wind: '' })).toBe(true)
    expect(validateFilters({ wind: 'calm' })).toBe(true)
    expect(validateFilters({ wind: 'breezy' })).toBe(true)
    expect(validateFilters({ wind: 'windy' })).toBe(true)
  })

  it('should reject invalid wind values', () => {
    expect(validateFilters({ wind: 'gusty' })).toBe(false)
    expect(validateFilters({ wind: 'still' })).toBe(false)
    expect(validateFilters({ wind: 'invalid' })).toBe(false)
  })

  it('should validate multiple filters', () => {
    expect(validateFilters({
      temperature: 'mild',
      precipitation: 'none',
      wind: 'calm'
    })).toBe(true)
  })

  it('should reject if any filter is invalid', () => {
    expect(validateFilters({
      temperature: 'mild',
      precipitation: 'invalid',
      wind: 'calm'
    })).toBe(false)
  })

  it('should allow empty filters object', () => {
    expect(validateFilters({})).toBe(true)
  })

  it('should allow undefined filter properties', () => {
    expect(validateFilters({
      temperature: 'mild',
      precipitation: undefined,
      wind: undefined
    })).toBe(true)
  })
})

// ========================================================================
// PERCENTILE CALCULATION ACCURACY TESTS
// ========================================================================

describe('Percentile Calculation Accuracy', () => {
  it('should match expected filter behavior for cold temperatures', () => {
    const locations = createSampleLocations()
    const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
    const threshold = temps[Math.floor(temps.length * 0.4)]

    const filters = { temperature: 'cold' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // All results should have temperature <= threshold
    expect(result.every(loc => loc.temperature <= threshold)).toBe(true)
  })

  it('should correctly exclude extremes for mild temperatures', () => {
    const locations = createSampleLocations()
    const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
    const minThreshold = temps[Math.floor(temps.length * 0.1)]
    const maxThreshold = temps[Math.floor(temps.length * 0.9)]

    const filters = { temperature: 'mild' }
    const result = applyWeatherFilters(locations, filters, () => {})

    // All results should be within thresholds
    expect(result.every(loc =>
      loc.temperature >= minThreshold && loc.temperature <= maxThreshold
    )).toBe(true)
  })
})
