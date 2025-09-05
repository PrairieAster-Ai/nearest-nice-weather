/**
 * Dedicated test setup for localStorage hook tests
 * Provides isolated environment for React hook testing
 */

import { beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Enhanced localStorage mock that avoids React Testing Library conflicts
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {}

  return {
    store,
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: 0,
    key: vi.fn()
  }
}

// Setup isolated environment for each test
export const setupLocalStorageTest = () => {
  beforeEach(() => {
    // Clean up React components
    cleanup()

    // Reset all mocks
    vi.clearAllMocks()
    vi.clearAllTimers()

    // Ensure window and localStorage are available
    if (typeof global.window === 'undefined') {
      Object.defineProperty(global, 'window', {
        value: {
          localStorage: createLocalStorageMock()
        },
        writable: true
      })
    }
  })
}
