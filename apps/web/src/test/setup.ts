import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Critical: Import React early to ensure proper initialization for React Query
import React from 'react'
import ReactDOM from 'react-dom'

// Ensure React is available globally for React Query hooks
global.React = React
global.ReactDOM = ReactDOM

// Enhanced jsdom setup for React Testing Library compatibility
global.IS_REACT_ACT_ENVIRONMENT = true

// Fix for jsdom Event constructor issues
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor(type: string, options?: EventInit) {
      Object.assign(this, {
        type,
        bubbles: options?.bubbles || false,
        cancelable: options?.cancelable || false,
        composed: options?.composed || false,
        currentTarget: null,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        target: null,
        timeStamp: Date.now(),
        ...options
      })
    }
  }
}

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
  cleanup()
  vi.clearAllTimers()
  vi.clearAllMocks()
})

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Additional DOM globals for jsdom compatibility
global.Range = Range
global.Request = Request
global.Response = Response

// Mock URL.createObjectURL for file handling tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn()
}
