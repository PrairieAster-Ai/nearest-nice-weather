export interface DeploymentFeedback {
  id: string
  timestamp: string
  status: "success" | "failure" | "in_progress"
  environment: "production" | "staging" | "preview"
  deploymentUrl?: string
  duration?: number

  // Build information
  buildLogs?: string
  testResults?: {
    passed: number
    failed: number
    skipped: number
    details: string
  }

  // Error information (if failed)
  errorType?: "build_error" | "test_failure" | "deployment_error" | "runtime_error"
  errorMessage?: string
  errorStack?: string
  failedStep?: string

  // Performance metrics
  buildTime?: number
  bundleSize?: number
  performanceScore?: number

  // Context
  commitSha?: string
  commitMessage?: string
  author?: string
  branch?: string
  pullRequestId?: string
}

export function formatFeedbackForClaude(feedback: DeploymentFeedback[]): string {
  const summary = generateSummary(feedback)
  const recentFailures = feedback
    .filter((f) => f.status === "failure")
    .slice(-5)  // Negative index - works in both Node.js versions
    .map(formatFailureDetails)
    .join("\n\n")

  return `
# Deployment Feedback Summary

## Overall Statistics
- Total deployments: ${feedback.length}
- Success rate: ${summary.successRate}%
- Average build time: ${summary.avgBuildTime}s
- Recent trend: ${summary.trend}

## Recent Failures
${recentFailures || "No recent failures"}

## Performance Trends
- Bundle size trend: ${summary.bundleSizeTrend}
- Build time trend: ${summary.buildTimeTrend}

## Common Issues
${summary.commonIssues.map((issue) => `- ${issue}`).join("\n")}

## Recommendations
${generateRecommendations(feedback)
  .map((rec) => `- ${rec}`)
  .join("\n")}
  `.trim()
}

function formatFailureDetails(failure: DeploymentFeedback): string {
  return `
### Failure: ${failure.id}
- **Time**: ${failure.timestamp}
- **Type**: ${failure.errorType}
- **Step**: ${failure.failedStep}
- **Message**: ${failure.errorMessage}
- **Author**: ${failure.author}
- **Commit**: ${failure.commitMessage}
  `.trim()
}

function generateSummary(feedback: DeploymentFeedback[]) {
  const successful = feedback.filter((f) => f.status === "success").length
  const total = feedback.length
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

  const buildTimes = feedback.filter((f) => f.buildTime).map((f) => f.buildTime!)
  const avgBuildTime = buildTimes.length > 0 ? Math.round(buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length) : 0

  // Analyze trends (last 10 vs previous 10)
  const recent = feedback.slice(-10)  // Negative index - works in both Node.js versions
  const previous = feedback.slice(-20, -10)

  const recentSuccessRate = recent.filter((f) => f.status === "success").length / recent.length
  const previousSuccessRate =
    previous.length > 0 ? previous.filter((f) => f.status === "success").length / previous.length : recentSuccessRate

  const trend =
    recentSuccessRate > previousSuccessRate
      ? "improving"
      : recentSuccessRate < previousSuccessRate
        ? "declining"
        : "stable"

  return {
    successRate,
    avgBuildTime,
    trend,
    bundleSizeTrend: analyzeBundleSizeTrend(feedback),
    buildTimeTrend: analyzeBuildTimeTrend(feedback),
    commonIssues: identifyCommonIssues(feedback),
  }
}

function analyzeBundleSizeTrend(feedback: DeploymentFeedback[]): string {
  const sizes = feedback
    .filter((f) => f.bundleSize)
    .slice(-10)  // Negative index - works in both Node.js versions
    .map((f) => f.bundleSize!)

  if (sizes.length < 2) return "insufficient data"

  const recent = sizes.slice(-3)  // Negative index - works in both Node.js versions.reduce((a, b) => a + b, 0) / 3
  const older = sizes.slice(0, 3).reduce((a, b) => a + b, 0) / 3

  const change = ((recent - older) / older) * 100

  if (Math.abs(change) < 5) return "stable"
  return change > 0 ? `increasing (+${change.toFixed(1)}%)` : `decreasing (${change.toFixed(1)}%)`
}

function analyzeBuildTimeTrend(feedback: DeploymentFeedback[]): string {
  const times = feedback
    .filter((f) => f.buildTime)
    .slice(-10)  // Negative index - works in both Node.js versions
    .map((f) => f.buildTime!)

  if (times.length < 2) return "insufficient data"

  const recent = times.slice(-3)  // Negative index - works in both Node.js versions.reduce((a, b) => a + b, 0) / 3
  const older = times.slice(0, 3).reduce((a, b) => a + b, 0) / 3

  const change = ((recent - older) / older) * 100

  if (Math.abs(change) < 10) return "stable"
  return change > 0 ? `increasing (+${change.toFixed(1)}%)` : `decreasing (${change.toFixed(1)}%)`
}

function identifyCommonIssues(feedback: DeploymentFeedback[]): string[] {
  const failures = feedback.filter((f) => f.status === "failure")
  const errorTypes = failures.reduce(
    (acc, f) => {
      const type = f.errorType || "unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(errorTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type, count]) => `${type} (${count} occurrences)`)
}

function generateRecommendations(feedback: DeploymentFeedback[]): string[] {
  const recommendations: string[] = []
  const failures = feedback.filter((f) => f.status === "failure")

  // Check for frequent build failures
  const buildErrors = failures.filter((f) => f.errorType === "build_error").length
  if (buildErrors > 2) {
    recommendations.push("Consider reviewing build configuration and dependencies")
  }

  // Check for test failures
  const testFailures = failures.filter((f) => f.errorType === "test_failure").length
  if (testFailures > 1) {
    recommendations.push("Review test suite stability and flaky tests")
  }

  // Check build time trends
  const recentBuildTimes = feedback
    .filter((f) => f.buildTime && f.buildTime > 300) // > 5 minutes
    .slice(-5)  // Negative index - works in both Node.js versions

  if (recentBuildTimes.length > 2) {
    recommendations.push("Consider optimizing build process - recent builds are taking longer")
  }

  // Check bundle size
  const largeBundles = feedback
    .filter((f) => f.bundleSize && f.bundleSize > 1000000) // > 1MB
    .slice(-3)  // Negative index - works in both Node.js versions

  if (largeBundles.length > 1) {
    recommendations.push("Bundle size is increasing - consider code splitting or dependency optimization")
  }

  return recommendations
}
