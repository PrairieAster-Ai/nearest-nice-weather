import { type NextRequest, NextResponse } from "next/server"

interface VercelWebhookPayload {
  id: string
  url: string
  name: string
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED"
  type: "LAMBDAS"
  creator: {
    uid: string
    email: string
    username: string
  }
  target: "production" | "staging"
  createdAt: number
  deploymentUrl: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: VercelWebhookPayload = await request.json()

    // Store deployment feedback
    const deploymentFeedback = {
      id: payload.id,
      status: payload.state,
      url: payload.deploymentUrl,
      target: payload.target,
      timestamp: new Date(payload.createdAt),
      creator: payload.creator.email,
      projectName: payload.name,
    }

    // Save to database or file system
    await saveDeploymentFeedback(deploymentFeedback)

    // If deployment failed, collect additional error info
    if (payload.state === "ERROR") {
      await collectErrorDetails(payload.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

async function saveDeploymentFeedback(feedback: any) {
  // Save to your preferred storage (database, file, etc.)
  console.log("Deployment feedback:", feedback)

  // Example: Save to JSON file for Claude to read
  const fs = require("fs").promises
  const feedbackLog = await fs.readFile("deployment-feedback.json", "utf8").catch(() => "[]")
  const logs = JSON.parse(feedbackLog)
  logs.push(feedback)
  await fs.writeFile("deployment-feedback.json", JSON.stringify(logs, null, 2))
}

async function collectErrorDetails(deploymentId: string) {
  // Fetch detailed error information from Vercel API
  const response = await fetch(`https://api.vercel.com/v6/deployments/${deploymentId}`, {
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    },
  })

  const deployment = await response.json()

  // Extract build logs and error details
  const errorDetails = {
    deploymentId,
    buildLogs: deployment.buildLogs,
    errorMessage: deployment.errorMessage,
    failedAt: deployment.failedAt,
  }

  await saveErrorDetails(errorDetails)
}

async function saveErrorDetails(errorDetails: any) {
  const fs = require("fs").promises
  const errorLog = await fs.readFile("deployment-errors.json", "utf8").catch(() => "[]")
  const errors = JSON.parse(errorLog)
  errors.push(errorDetails)
  await fs.writeFile("deployment-errors.json", JSON.stringify(errors, null, 2))
}
