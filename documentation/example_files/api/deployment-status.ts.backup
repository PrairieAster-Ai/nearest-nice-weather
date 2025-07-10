import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const fs = require("fs").promises

    // Read deployment feedback logs
    const feedbackLog = await fs.readFile("deployment-feedback.json", "utf8").catch(() => "[]")
    const errorLog = await fs.readFile("deployment-errors.json", "utf8").catch(() => "[]")

    const feedback = JSON.parse(feedbackLog)
    const errors = JSON.parse(errorLog)

    // Generate summary for Claude
    const summary = generateDeploymentSummary(feedback, errors)

    return NextResponse.json({
      summary,
      recentDeployments: feedback.slice(-10), // Last 10 deployments
      recentErrors: errors.slice(-5), // Last 5 errors
      stats: calculateDeploymentStats(feedback),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deployment status" }, { status: 500 })
  }
}

function generateDeploymentSummary(feedback: any[], errors: any[]) {
  const total = feedback.length
  const successful = feedback.filter((f) => f.status === "READY").length
  const failed = feedback.filter((f) => f.status === "ERROR").length
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : 0

  const recentFailures = errors.slice(-3).map((error) => ({
    id: error.deploymentId,
    message: error.errorMessage,
    timestamp: error.failedAt,
  }))

  return {
    totalDeployments: total,
    successfulDeployments: successful,
    failedDeployments: failed,
    successRate: `${successRate}%`,
    recentFailures,
    lastDeployment: feedback[feedback.length - 1],
  }
}

function calculateDeploymentStats(feedback: any[]) {
  const last24Hours = feedback.filter((f) => new Date(f.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000))

  const last7Days = feedback.filter((f) => new Date(f.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

  return {
    deploymentsLast24Hours: last24Hours.length,
    deploymentsLast7Days: last7Days.length,
    averageDeploymentsPerDay: (last7Days.length / 7).toFixed(1),
  }
}
