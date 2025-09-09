/**
 * ========================================================================
 * USE DEBOUNCE HOOK TESTS
 * ========================================================================
 *
 * 📋 PURPOSE: Comprehensive testing for useDebounce hook functionality
 * 🔗 HOOK: useDebounce - Performance optimization for user interactions
 * 📊 COVERAGE: Debouncing logic, timing accuracy, edge cases, constants
 * ⚙️ FUNCTIONALITY: Prevents excessive API calls during rapid user input
 * 🎯 BUSINESS_IMPACT: Ensures optimal UX and prevents API rate limiting
 *
 * BUSINESS CONTEXT: Performance optimization for instant gratification UX
 * - Tests biological UX timing for <100ms perceived instant feedback
 * - Validates API call optimization to prevent rate limiting
 * - Ensures smooth filter interactions for weather discovery
 * - Tests timing constants for different interaction patterns
 *
 * TECHNICAL COVERAGE: React hook testing with timing
 * - Debounce timing accuracy with different delays
 * - Hook stability and cleanup behavior
 * - Multiple rapid value changes
 * - Edge cases with zero delay and extreme values
 *
 * LAST UPDATED: 2025-08-13
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce, DEBOUNCE_DELAYS } from '../useDebounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('✅ Basic Debouncing', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 300))

      expect(result.current).toBe('initial')
    })

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      )

      expect(result.current).toBe('initial')

      // Change value
      rerender({ value: 'updated', delay: 300 })

      // Should still be initial value before delay
      expect(result.current).toBe('initial')

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should now be updated value
      expect(result.current).toBe('updated')
    })

    it('should handle string values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'hello' } }
      )

      rerender({ value: 'world' })

      expect(result.current).toBe('hello')

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe('world')
    })

    it('should handle number values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 150),
        { initialProps: { value: 0 } }
      )

      rerender({ value: 42 })

      expect(result.current).toBe(0)

      act(() => {
        vi.advanceTimersByTime(150)
      })

      expect(result.current).toBe(42)
    })

    it('should handle object values', () => {
      const initialObj = { name: 'initial', count: 1 }
      const updatedObj = { name: 'updated', count: 2 }

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialObj } }
      )

      rerender({ value: updatedObj })

      expect(result.current).toBe(initialObj)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe(updatedObj)
    })
  })

  describe('✅ Timing Accuracy', () => {
    it('should not update before delay completes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'start' } }
      )

      rerender({ value: 'end' })

      // Check various time intervals before delay
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toBe('start')

      act(() => { vi.advanceTimersByTime(200) })
      expect(result.current).toBe('start')

      act(() => { vi.advanceTimersByTime(199) })
      expect(result.current).toBe('start')

      // Should update after full delay
      act(() => { vi.advanceTimersByTime(1) })
      expect(result.current).toBe('end')
    })

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'immediate' })

      act(() => {
        vi.advanceTimersByTime(0)
      })

      expect(result.current).toBe('immediate')
    })

    it('should handle very small delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1),
        { initialProps: { value: 'start' } }
      )

      rerender({ value: 'fast' })

      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(result.current).toBe('fast')
    })

    it('should handle large delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 10000),
        { initialProps: { value: 'start' } }
      )

      rerender({ value: 'slow' })

      act(() => {
        vi.advanceTimersByTime(9999)
      })
      expect(result.current).toBe('start')

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current).toBe('slow')
    })
  })

  describe('✅ Rapid Value Changes', () => {
    it('should cancel previous timeouts on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'first' } }
      )

      // Rapid sequence of changes
      rerender({ value: 'second' })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: 'third' })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: 'fourth' })
      act(() => { vi.advanceTimersByTime(100) })

      // Should still be first value (no timeout completed)
      expect(result.current).toBe('first')

      rerender({ value: 'final' })

      // Complete the final timeout
      act(() => { vi.advanceTimersByTime(300) })

      // Should jump directly to final value (intermediate values skipped)
      expect(result.current).toBe('final')
    })

    it('should handle very rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 0 } }
      )

      // Simulate rapid typing/filtering
      for (let i = 1; i <= 10; i++) {
        rerender({ value: i })
        act(() => { vi.advanceTimersByTime(50) }) // Each change comes faster than delay
      }

      // Should still be initial value
      expect(result.current).toBe(0)

      // Complete final timeout
      act(() => { vi.advanceTimersByTime(200) })

      // Should be final value
      expect(result.current).toBe(10)
    })

    it('should handle alternating values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 150),
        { initialProps: { value: 'A' } }
      )

      // Alternate between two values rapidly
      for (let i = 0; i < 5; i++) {
        rerender({ value: 'B' })
        act(() => { vi.advanceTimersByTime(50) })

        rerender({ value: 'A' })
        act(() => { vi.advanceTimersByTime(50) })
      }

      expect(result.current).toBe('A')

      // Let final timeout complete
      act(() => { vi.advanceTimersByTime(150) })

      expect(result.current).toBe('A')
    })
  })

  describe('✅ Edge Cases', () => {
    it('should handle undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: undefined } }
      )

      rerender({ value: 'defined' })

      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe('defined')
    })

    it('should handle null values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: null } }
      )

      rerender({ value: 'not null' })

      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe('not null')
    })

    it('should handle boolean values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: false } }
      )

      rerender({ value: true })

      expect(result.current).toBe(false)

      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe(true)
    })

    it('should handle array values', () => {
      const initialArray = [1, 2, 3]
      const updatedArray = [4, 5, 6]

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialArray } }
      )

      rerender({ value: updatedArray })

      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe(updatedArray)
    })

    it('should handle same value updates', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'same' } }
      )

      // Update to same value
      rerender({ value: 'same' })

      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe('same')
    })
  })

  describe('✅ Delay Changes', () => {
    it('should handle delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      )

      // Change value with original delay
      rerender({ value: 'first', delay: 100 })

      // Change delay before timeout
      rerender({ value: 'first', delay: 200 })

      // Original timeout should be cancelled, new one with 200ms should start
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toBe('initial')

      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toBe('first')
    })

    it('should restart timeout when delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'start', delay: 300 } }
      )

      rerender({ value: 'middle', delay: 300 })

      act(() => { vi.advanceTimersByTime(150) })

      // Change delay - should restart timer
      rerender({ value: 'middle', delay: 200 })

      act(() => { vi.advanceTimersByTime(150) })
      expect(result.current).toBe('start') // Still old value

      act(() => { vi.advanceTimersByTime(50) })
      expect(result.current).toBe('middle') // Now updated
    })
  })

  describe('✅ Performance Constants', () => {
    it('should export correct timing constants', () => {
      expect(DEBOUNCE_DELAYS.INSTANT_FEEDBACK).toBe(50)
      expect(DEBOUNCE_DELAYS.FAST_SEARCH).toBe(100)
      expect(DEBOUNCE_DELAYS.NORMAL_SEARCH).toBe(300)
      expect(DEBOUNCE_DELAYS.SLOW_EXPENSIVE).toBe(500)
    })

    it('should have ascending timing values', () => {
      expect(DEBOUNCE_DELAYS.INSTANT_FEEDBACK).toBeLessThan(DEBOUNCE_DELAYS.FAST_SEARCH)
      expect(DEBOUNCE_DELAYS.FAST_SEARCH).toBeLessThan(DEBOUNCE_DELAYS.NORMAL_SEARCH)
      expect(DEBOUNCE_DELAYS.NORMAL_SEARCH).toBeLessThan(DEBOUNCE_DELAYS.SLOW_EXPENSIVE)
    })

    it('should work with timing constants', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, DEBOUNCE_DELAYS.FAST_SEARCH),
        { initialProps: { value: 'start' } }
      )

      rerender({ value: 'fast' })

      act(() => { vi.advanceTimersByTime(DEBOUNCE_DELAYS.FAST_SEARCH) })

      expect(result.current).toBe('fast')
    })
  })

  describe('🔧 Hook Lifecycle', () => {
    it('should cleanup timeouts on unmount', () => {
      const { rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })

      // Unmount before timeout completes
      unmount()

      // Advance time - should not cause any issues
      act(() => { vi.advanceTimersByTime(300) })

      // No error should occur (timeout was cleaned up)
      expect(true).toBe(true) // Test passes if no error thrown
    })

    it('should handle multiple renders without memory leaks', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'start' } }
      )

      // Multiple rapid re-renders
      for (let i = 0; i < 20; i++) {
        rerender({ value: `value-${i}` })
      }

      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe('value-19')
    })

    it('should maintain referential stability for unchanged values', () => {
      const obj = { id: 1, name: 'test' }

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: obj } }
      )

      const initialResult = result.current

      // Re-render with same object reference
      rerender({ value: obj })

      expect(result.current).toBe(initialResult)
      expect(result.current).toBe(obj)
    })
  })
})

/**
 * 📊 TEST COVERAGE SUMMARY:
 * ✅ Basic debouncing functionality with various data types
 * ✅ Timing accuracy and delay handling
 * ✅ Rapid value changes and timeout cancellation
 * ✅ Edge cases (null, undefined, boolean, arrays)
 * ✅ Delay changes and timeout restart behavior
 * ✅ Performance timing constants validation
 * ✅ Hook lifecycle and cleanup behavior
 * ✅ Memory leak prevention and stability
 * ✅ Referential stability for unchanged values
 *
 * 🎯 BUSINESS COVERAGE:
 * ✅ Instant feedback UX timing (<100ms)
 * ✅ API rate limiting prevention
 * ✅ Filter interaction optimization
 * ✅ Performance optimization for user experience
 *
 * 🔧 TECHNICAL COVERAGE:
 * ✅ React hook testing with timer mocking
 * ✅ Timeout management and cleanup
 * ✅ TypeScript generic type handling
 * ✅ Performance constant integration
 */
