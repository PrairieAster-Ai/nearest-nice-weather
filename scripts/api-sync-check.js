#!/usr/bin/env node

/**
 * ========================================================================
 * API SYNC CHECKER - Dual API Architecture Maintenance Tool
 * ========================================================================
 *
 * @PURPOSE: Validate API endpoint parity between Express.js and Vercel functions
 * @USAGE: npm run sync-check or node scripts/api-sync-check.js
 * @OUTPUT: Report of missing endpoints and sync status
 *
 * Helps maintain the dual API architecture by:
 * 1. Scanning Express.js endpoints in dev-api-server.js
 * 2. Checking for corresponding Vercel functions in apps/web/api/
 * 3. Reporting missing endpoints and sync recommendations
 * 4. Suggesting shared logic modules for better maintainability
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.cyan}${msg}${colors.reset}`)
}

/**
 * Extract API endpoints from Express.js server file
 */
function extractExpressEndpoints() {
  const expressFile = path.join(projectRoot, 'dev-api-server.js')

  if (!fs.existsSync(expressFile)) {
    log.error('dev-api-server.js not found!')
    return []
  }

  const content = fs.readFileSync(expressFile, 'utf-8')
  const endpoints = []

  // Match Express.js route definitions: app.get('/api/something', ...)
  const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
  let match

  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase()
    const route = match[2]

    if (route.startsWith('/api/')) {
      endpoints.push({
        method,
        route,
        filename: route.replace('/api/', '') + '.js'
      })
    }
  }

  return endpoints
}

/**
 * Find existing Vercel function files
 */
function findVercelFunctions() {
  const apiDir = path.join(projectRoot, 'apps/web/api')

  if (!fs.existsSync(apiDir)) {
    log.error('apps/web/api directory not found!')
    return []
  }

  const files = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'))
  return files
}

/**
 * Check if shared logic modules are being used
 */
function checkSharedLogicUsage() {
  const sharedDir = path.join(projectRoot, 'shared')
  const apiDir = path.join(projectRoot, 'apps/web/api')
  const expressFile = path.join(projectRoot, 'dev-api-server.js')

  const sharedModules = []
  if (fs.existsSync(sharedDir)) {
    const categories = fs.readdirSync(sharedDir)
    categories.forEach(category => {
      const categoryPath = path.join(sharedDir, category)
      if (fs.statSync(categoryPath).isDirectory()) {
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
        files.forEach(file => {
          sharedModules.push(`shared/${category}/${file}`)
        })
      }
    })
  }

  const usage = {
    express: false,
    vercel: [],
    modules: sharedModules
  }

  // Check Express.js usage
  if (fs.existsSync(expressFile)) {
    const content = fs.readFileSync(expressFile, 'utf-8')
    usage.express = sharedModules.some(module => content.includes(module))
  }

  // Check Vercel function usage
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.js'))
    apiFiles.forEach(file => {
      const filePath = path.join(apiDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const usesShared = sharedModules.some(module => content.includes(module))
      if (usesShared) {
        usage.vercel.push(file)
      }
    })
  }

  return usage
}

/**
 * Main sync checking function
 */
function runSyncCheck() {
  log.title('\n🔍 API SYNC CHECKER - Dual Architecture Validation\n')

  // Extract endpoints from Express.js
  log.info('Scanning Express.js endpoints...')
  const expressEndpoints = extractExpressEndpoints()

  if (expressEndpoints.length === 0) {
    log.warning('No Express.js endpoints found')
    return
  }

  log.success(`Found ${expressEndpoints.length} Express.js endpoints`)
  expressEndpoints.forEach(endpoint => {
    console.log(`   ${endpoint.method} ${endpoint.route}`)
  })

  // Find Vercel functions
  log.info('\nScanning Vercel functions...')
  const vercelFunctions = findVercelFunctions()

  log.success(`Found ${vercelFunctions.length} Vercel functions`)
  vercelFunctions.forEach(func => {
    console.log(`   📄 ${func}`)
  })

  // Check for missing endpoints
  log.info('\nChecking endpoint parity...')
  const missingEndpoints = []
  const presentEndpoints = []

  expressEndpoints.forEach(endpoint => {
    const expectedFile = endpoint.filename
    if (vercelFunctions.includes(expectedFile)) {
      presentEndpoints.push(endpoint)
    } else {
      missingEndpoints.push(endpoint)
    }
  })

  if (missingEndpoints.length === 0) {
    log.success('✨ All Express.js endpoints have corresponding Vercel functions!')
  } else {
    log.warning(`Found ${missingEndpoints.length} missing Vercel functions:`)
    missingEndpoints.forEach(endpoint => {
      console.log(`   ❓ Missing: apps/web/api/${endpoint.filename} for ${endpoint.method} ${endpoint.route}`)
    })
  }

  // Check shared logic usage
  log.info('\nChecking shared logic usage...')
  const sharedUsage = checkSharedLogicUsage()

  if (sharedUsage.modules.length === 0) {
    log.warning('No shared logic modules found')
  } else {
    log.success(`Found ${sharedUsage.modules.length} shared modules:`)
    sharedUsage.modules.forEach(module => {
      console.log(`   📦 ${module}`)
    })

    console.log(`\\n   Express.js using shared logic: ${sharedUsage.express ? '✅' : '❌'}`)
    console.log(`   Vercel functions using shared logic: ${sharedUsage.vercel.length}/${vercelFunctions.length}`)

    if (sharedUsage.vercel.length > 0) {
      sharedUsage.vercel.forEach(file => {
        console.log(`     ✅ ${file}`)
      })
    }
  }

  // Summary and recommendations
  log.title('\\n📋 SYNC STATUS SUMMARY')

  const syncScore = ((presentEndpoints.length / expressEndpoints.length) * 100).toFixed(1)
  console.log(`API Endpoint Parity: ${syncScore}% (${presentEndpoints.length}/${expressEndpoints.length})`)

  const sharedScore = sharedUsage.modules.length > 0 ?
    (((sharedUsage.express ? 1 : 0) + sharedUsage.vercel.length) / (1 + vercelFunctions.length) * 100).toFixed(1) : 0
  console.log(`Shared Logic Usage: ${sharedScore}%`)

  if (missingEndpoints.length > 0) {
    log.title('\\n🔧 RECOMMENDED ACTIONS')
    console.log('1. Create missing Vercel functions:')
    missingEndpoints.forEach(endpoint => {
      console.log(`   npx create-vercel-function apps/web/api/${endpoint.filename}`)
    })

    console.log('\\n2. Use shared logic modules to reduce duplication')
    console.log('3. Run sync check after creating functions: npm run sync-check')
  }

  if (syncScore >= 90) {
    log.success('\\n🎉 Excellent API sync status!')
  } else if (syncScore >= 70) {
    log.warning('\\n⚠️  Good sync status, but room for improvement')
  } else {
    log.error('\\n❌ Poor API sync - significant maintenance needed')
  }
}

// Run the check
runSyncCheck()
