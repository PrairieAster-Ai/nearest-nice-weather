// Monitoring and Analytics Service
// This will be extended with Sentry integration in production

export interface ErrorContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  additionalContext?: Record<string, any>
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  context?: Record<string, any>
}

class MonitoringService {
  private isProduction = import.meta.env.NODE_ENV === 'production'
  private apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

  // Error tracking
  captureError(error: Error, context?: ErrorContext) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error('🚨 Error captured:', errorData)
    }

    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoring('error', errorData)
    }
  }

  // Performance tracking
  capturePerformance(metric: PerformanceMetric) {
    const performanceData = {
      ...metric,
      timestamp: metric.timestamp.toISOString(),
      url: window.location.href,
    }

    if (!this.isProduction) {
      console.log('📊 Performance metric:', performanceData)
    }

    if (this.isProduction) {
      this.sendToMonitoring('performance', performanceData)
    }
  }

  // User action tracking
  captureUserAction(action: string, context?: Record<string, any>) {
    const actionData = {
      action,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    }

    if (!this.isProduction) {
      console.log('👤 User action:', actionData)
    }

    if (this.isProduction) {
      this.sendToMonitoring('user_action', actionData)
    }
  }

  // Core Web Vitals tracking
  captureWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.capturePerformance({
        name: 'LCP',
        value: lastEntry.startTime,
        unit: 'ms',
        timestamp: new Date(),
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.capturePerformance({
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          unit: 'ms',
          timestamp: new Date(),
        })
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.capturePerformance({
        name: 'CLS',
        value: clsValue,
        unit: 'score',
        timestamp: new Date(),
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }

  private async sendToMonitoring(type: string, data: any) {
    try {
      await fetch(`${this.apiBaseUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: type,
          event_data: data,
          session_id: this.getSessionId(),
          page_url: window.location.href,
        }),
      })
    } catch (error) {
      // Fail silently to not affect user experience
      console.warn('Failed to send monitoring data:', error)
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('monitoring_session_id', sessionId)
    }
    return sessionId
  }
}

export const monitoring = new MonitoringService()

// Global error handler
window.addEventListener('error', (event) => {
  monitoring.captureError(new Error(event.message), {
    url: event.filename,
    additionalContext: {
      line: event.lineno,
      column: event.colno,
    },
  })
})

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  monitoring.captureError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  )
})

export default monitoring