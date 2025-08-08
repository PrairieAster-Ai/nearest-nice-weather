/**
 * ========================================================================
 * PERFORMANCE REQUIREMENTS - CENTRALIZED TESTING CONFIGURATION
 * ========================================================================
 * 
 * 📋 PURPOSE: Single source of truth for all performance requirements
 * 🔗 CONNECTS TO: PlaywrightMCP, automated tests, monitoring tools
 * 📊 DATA FLOW: Requirements → Test assertions → Performance monitoring
 * ⚙️ CONFIGURATION: Target/max thresholds for automated testing
 * 🎯 USER IMPACT: Ensures consistent performance across all features
 * 
 * BUSINESS CONTEXT: Performance directly impacts user engagement
 * - Sub-100ms interactions create "instant gratification" feeling
 * - 3-second load time prevents user abandonment
 * - Consistent performance builds trust for outdoor planning
 * 
 * @CLAUDE_CONTEXT: Central performance config for all testing tools
 * @BUSINESS_RULE: MUST maintain <100ms filter feedback for engagement
 * @PERFORMANCE_CRITICAL: All thresholds are testable via automation
 * @TESTING_INTEGRATION: Designed for PlaywrightMCP consumption
 * 
 * LAST UPDATED: 2025-08-08
 */

// 🔗 INTEGRATION: Import JSON config for runtime access
import performanceConfig from './PERFORMANCE-REQUIREMENTS.json';

export interface PerformanceMetric {
  target: number;
  max: number;
  unit: 'ms' | 's';
  description: string;
  businessRule?: string;
  scalingNote?: string;
}

export interface ComponentPerformance {
  [metricName: string]: PerformanceMetric;
}

export interface PerformanceRequirements {
  version: string;
  lastUpdated: string;
  description: string;
  globalRequirements: ComponentPerformance;
  componentRequirements: {
    [componentName: string]: ComponentPerformance;
  };
  apiEndpoints: {
    [endpoint: string]: ComponentPerformance;
  };
  businessRules: {
    priority: {
      P0_CRITICAL: string[];
      P1_HIGH: string[];
      P2_MEDIUM: string[];
    };
  };
  testingGuidance: {
    playwright: {
      waitStrategies: Record<string, string>;
      assertions: Record<string, string>;
    };
  };
  monitoring: {
    metrics: string[];
    alertThresholds: Record<string, string>;
  };
}

// Type-safe access to performance requirements
export const PERFORMANCE_REQUIREMENTS: PerformanceRequirements = performanceConfig;

// 🎯 QUICK ACCESS: Commonly used performance thresholds
export const PERF_THRESHOLDS = {
  // UI Responsiveness
  INSTANT_FEEDBACK: PERFORMANCE_REQUIREMENTS.componentRequirements.FabFilterSystem.uiFeedbackTime.max,
  FILTER_DEBOUNCE: PERFORMANCE_REQUIREMENTS.componentRequirements.FilterManager.debounceDelay.target,
  
  // Page Performance  
  PAGE_LOAD: PERFORMANCE_REQUIREMENTS.globalRequirements.pageLoadTime.max,
  TIME_TO_INTERACTIVE: PERFORMANCE_REQUIREMENTS.globalRequirements.timeToInteractive.max,
  
  // API Performance
  API_TIMEOUT: PERFORMANCE_REQUIREMENTS.globalRequirements.apiResponseTime.max,
  POI_API_TIMEOUT: PERFORMANCE_REQUIREMENTS.apiEndpoints['/api/poi-locations-with-weather'].responseTime.max,
  
  // Map Performance
  MARKER_RENDER: PERFORMANCE_REQUIREMENTS.componentRequirements.MapComponent.markerRenderTime.max,
  MAP_ANIMATION: PERFORMANCE_REQUIREMENTS.componentRequirements.MapComponent.panAnimationDuration.max,
} as const;

// 🔗 PLAYWRIGHT INTEGRATION: Helper functions for test assertions
export const performanceHelpers = {
  /**
   * Get wait time for a specific component action
   * @example await page.waitForTimeout(performanceHelpers.getWaitTime('FabFilterSystem', 'uiFeedbackTime'))
   */
  getWaitTime(component: string, metric: string): number {
    const componentReqs = PERFORMANCE_REQUIREMENTS.componentRequirements[component];
    if (!componentReqs || !componentReqs[metric]) {
      console.warn(`Performance metric not found: ${component}.${metric}`);
      return 1000; // Default fallback
    }
    return componentReqs[metric].max;
  },

  /**
   * Assert performance is within acceptable range
   * @example performanceHelpers.assertPerformance(measuredTime, 'FabFilterSystem', 'uiFeedbackTime')
   */
  assertPerformance(measured: number, component: string, metric: string): boolean {
    const requirement = PERFORMANCE_REQUIREMENTS.componentRequirements[component]?.[metric];
    if (!requirement) return true; // Pass if no requirement defined
    
    return measured <= requirement.max;
  },

  /**
   * Get human-readable performance report
   */
  getPerformanceReport(measured: number, component: string, metric: string): string {
    const req = PERFORMANCE_REQUIREMENTS.componentRequirements[component]?.[metric];
    if (!req) return 'No requirement defined';
    
    const status = measured <= req.target ? '✅ EXCELLENT' :
                   measured <= req.max ? '⚠️ ACCEPTABLE' :
                   '❌ FAILED';
    
    return `${status}: ${measured}ms (target: ${req.target}ms, max: ${req.max}ms)`;
  }
};

// 🔗 BUSINESS RULE PRIORITIES: For automated test prioritization
export const getBusinessRulePriority = (rule: string): 'P0' | 'P1' | 'P2' | null => {
  const rules = PERFORMANCE_REQUIREMENTS.businessRules.priority;
  if (rules.P0_CRITICAL.some(r => rule.includes(r))) return 'P0';
  if (rules.P1_HIGH.some(r => rule.includes(r))) return 'P1';
  if (rules.P2_MEDIUM.some(r => rule.includes(r))) return 'P2';
  return null;
};