/**
 * ========================================================================
 * MONITORING SERVICE TESTS
 * ========================================================================
 *
 * Exercises the client-side monitoring singleton: error / performance / user
 * action capture, Core Web Vitals observers, the production fetch transport,
 * and the global error / unhandledrejection handlers registered on import.
 *
 * The production transport path is verified by re-importing the module with
 * NODE_ENV stubbed to 'production' and a directly-stubbed `fetch` (bypassing
 * MSW, per the project's data-integrity testing convention).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { monitoring } from '../monitoring'

describe('MonitoringService', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('captureError (development behaviour)', () => {
    it('logs structured error data to the console with message, name and stack', () => {
      const error = new Error('boom')
      monitoring.captureError(error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const [label, payload] = consoleErrorSpy.mock.calls[0]
      expect(label).toContain('Error captured')
      expect(payload).toMatchObject({
        message: 'boom',
        name: 'Error',
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
      expect(typeof (payload as any).timestamp).toBe('string')
    })

    it('merges caller-supplied context onto the error payload', () => {
      monitoring.captureError(new Error('with-context'), {
        userId: 'user-42',
        context: 'poi-load',
        additionalContext: { retry: 2 },
      })

      const payload = consoleErrorSpy.mock.calls[0][1] as Record<string, any>
      expect(payload.userId).toBe('user-42')
      expect(payload.context).toBe('poi-load')
      expect(payload.additionalContext).toEqual({ retry: 2 })
    })
  })

  describe('capturePerformance / captureUserAction (development behaviour)', () => {
    it('logs a performance metric with an ISO timestamp', () => {
      monitoring.capturePerformance({
        name: 'LCP',
        value: 1500,
        unit: 'ms',
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
      })

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      const [label, payload] = consoleDebugSpy.mock.calls[0]
      expect(label).toContain('Performance metric')
      expect(payload).toMatchObject({
        name: 'LCP',
        value: 1500,
        unit: 'ms',
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    })

    it('logs a user action with the action name and context', () => {
      monitoring.captureUserAction('weather_search', { temperature: 'warm' })

      const [label, payload] = consoleDebugSpy.mock.calls[0]
      expect(label).toContain('User action')
      expect(payload).toMatchObject({
        action: 'weather_search',
        temperature: 'warm',
      })
    })
  })

  describe('captureWebVitals', () => {
    it('registers observers and reports LCP, FID and CLS metrics', () => {
      const instances: Array<{ cb: (list: any) => void; entryTypes: string[] }> = []

      class FakePerformanceObserver {
        cb: (list: any) => void
        entryTypes: string[] = []
        constructor(cb: (list: any) => void) {
          this.cb = cb
          instances.push(this as any)
        }
        observe(opts: { entryTypes: string[] }) {
          this.entryTypes = opts.entryTypes
        }
        disconnect() {}
      }

      const original = global.PerformanceObserver
      // @ts-expect-error test double
      global.PerformanceObserver = FakePerformanceObserver

      try {
        monitoring.captureWebVitals()
        expect(instances).toHaveLength(3)

        // LCP — uses the last entry's startTime
        instances[0].cb({ getEntries: () => [{ startTime: 10 }, { startTime: 2222 }] })
        // FID — processingStart minus startTime
        instances[1].cb({ getEntries: () => [{ processingStart: 80, startTime: 30 }] })
        // CLS — sums values that did not follow recent input
        instances[2].cb({
          getEntries: () => [
            { hadRecentInput: false, value: 0.05 },
            { hadRecentInput: true, value: 9 },
            { hadRecentInput: false, value: 0.07 },
          ],
        })

        const metrics = consoleDebugSpy.mock.calls.map((c) => c[1] as any)
        const lcp = metrics.find((m) => m.name === 'LCP')
        const fid = metrics.find((m) => m.name === 'FID')
        const cls = metrics.find((m) => m.name === 'CLS')

        expect(lcp.value).toBe(2222)
        expect(fid.value).toBe(50)
        expect(cls.value).toBeCloseTo(0.12)
        expect(cls.unit).toBe('score')
        expect(instances[0].entryTypes).toEqual(['largest-contentful-paint'])
      } finally {
        global.PerformanceObserver = original
      }
    })
  })

  describe('global error handlers (registered on import)', () => {
    it('captures uncaught window error events', () => {
      const event = new ErrorEvent('error', {
        message: 'global-failure',
        filename: 'app.js',
        lineno: 12,
        colno: 5,
      })
      window.dispatchEvent(event)

      const payload = consoleErrorSpy.mock.calls.at(-1)?.[1] as Record<string, any>
      expect(payload.message).toBe('global-failure')
      expect(payload.url).toBe('app.js')
      expect(payload.additionalContext).toEqual({ line: 12, column: 5 })
    })

    it('captures unhandled promise rejections carrying an Error reason', () => {
      const event: any = new Event('unhandledrejection')
      event.reason = new Error('rejected-promise')
      window.dispatchEvent(event)

      const payload = consoleErrorSpy.mock.calls.at(-1)?.[1] as Record<string, any>
      expect(payload.message).toBe('rejected-promise')
    })

    it('coerces a non-Error rejection reason into an Error', () => {
      const event: any = new Event('unhandledrejection')
      event.reason = 'plain string reason'
      window.dispatchEvent(event)

      const payload = consoleErrorSpy.mock.calls.at(-1)?.[1] as Record<string, any>
      expect(payload.message).toBe('plain string reason')
    })
  })

  describe('production transport', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })

    it('POSTs captured events to /api/analytics with a persisted session id', async () => {
      vi.resetModules()
      vi.stubEnv('NODE_ENV', 'production')
      sessionStorage.clear()

      const fetchMock = vi.fn().mockResolvedValue({ ok: true })
      const originalFetch = global.fetch
      global.fetch = fetchMock as any

      try {
        const mod = await import('../monitoring')
        mod.monitoring.captureUserAction('cta_click', { id: 'subscribe' })
        // allow the fire-and-forget fetch microtask to settle
        await Promise.resolve()
        await Promise.resolve()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/analytics')
        expect(options.method).toBe('POST')
        expect(options.headers['Content-Type']).toBe('application/json')

        const body = JSON.parse(options.body)
        expect(body.event_type).toBe('user_action')
        expect(body.event_data.action).toBe('cta_click')
        expect(typeof body.session_id).toBe('string')
        expect(body.session_id).toMatch(/^session_/)

        // session id is reused across subsequent sends
        const stored = sessionStorage.getItem('monitoring_session_id')
        expect(stored).toBe(body.session_id)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('swallows transport failures so monitoring never breaks the UX', async () => {
      vi.resetModules()
      vi.stubEnv('NODE_ENV', 'production')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
      const originalFetch = global.fetch
      global.fetch = fetchMock as any

      try {
        const mod = await import('../monitoring')
        expect(() =>
          mod.monitoring.captureError(new Error('prod-error')),
        ).not.toThrow()
        await Promise.resolve()
        await Promise.resolve()

        expect(fetchMock).toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalledWith(
          'Failed to send monitoring data:',
          expect.any(Error),
        )
      } finally {
        global.fetch = originalFetch
        warnSpy.mockRestore()
      }
    })
  })
})
