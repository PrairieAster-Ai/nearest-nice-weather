/**
 * PERFORMANCE OPTIMIZATION HOOK - DEBOUNCED VALUES
 *
 * PURPOSE: Prevents excessive API calls during rapid user interactions
 * - Delays execution of expensive operations (like API calls) until user stops interacting
 * - Critical for <100ms dopamine hit user experience with weather filters
 * - Prevents API rate limiting and reduces server load
 *
 * USAGE: Weather filter changes debounced to 150ms for optimal balance:
 * - Fast enough for instant gratification feeling
 * - Slow enough to prevent API spam during rapid filter changes
 * - Allows "instant" UI feedback while debouncing actual data fetching
 *
 * BUSINESS CONTEXT: Core to "biological UX optimization" mentioned in business plan
 * - Users get instant visual feedback from UI state changes
 * - Backend calls optimized to prevent performance degradation
 * - Supports both desktop and mobile touch interactions
 */

import { useState, useEffect } from 'react';

// 🔗 INTEGRATION: Critical for FilterManager.tsx debounced state management
// 🔗 INTEGRATION: Used throughout App.tsx for performance-optimized user interactions
// 🔗 SEE ALSO: DEBOUNCE_DELAYS exported constants used by multiple components

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of no
 * further changes — the trailing-edge timer resets on every change, so rapid
 * updates collapse into one. Use it to throttle expensive work (API calls) while
 * the UI keeps reacting to the live value.
 *
 * @typeParam T - Type of the value being debounced.
 * @param value - The fast-changing source value.
 * @param delay - Quiet period in milliseconds before the debounced value updates.
 * @returns The latest value, delayed until input settles.
 * @example
 * ```ts
 * const debouncedFilters = useDebounce(instantFilters, DEBOUNCE_DELAYS.FAST_SEARCH);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * PERFORMANCE TIMING CONSTANTS
 * Optimized for biological UX response times mentioned in business plan
 */
export const DEBOUNCE_DELAYS = {
  INSTANT_FEEDBACK: 50,    // UI state changes - perceived as instant
  FAST_SEARCH: 100,        // Filter changes - optimized for instant gratification
  NORMAL_SEARCH: 300,      // Text input - standard debouncing
  SLOW_EXPENSIVE: 500,     // Heavy operations like map re-centering
} as const;
