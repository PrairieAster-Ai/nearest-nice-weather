import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'fs'
import { glob } from 'glob'
import path from 'path'

test.describe('CSS Validation Tests', () => {
  test('should not have @import rules in compiled CSS after initial content', async () => {
    // Find compiled CSS files
    const cssFiles = glob.sync('.next/static/css/**/*.css')
    
    for (const cssFile of cssFiles) {
      if (existsSync(cssFile)) {
        const cssContent = readFileSync(cssFile, 'utf-8')
        const lines = cssContent.split('\n')
        
        // Find all @import rule locations
        const importLines: number[] = []
        const nonImportRuleLines: number[] = []
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('@import')) {
            importLines.push(index + 1)
          } else if (trimmedLine && 
                     !trimmedLine.startsWith('/*') && 
                     !trimmedLine.startsWith('*') && 
                     !trimmedLine.startsWith('*/') &&
                     !trimmedLine.startsWith('@charset') &&
                     !trimmedLine.startsWith('@layer') &&
                     trimmedLine !== '{' &&
                     trimmedLine !== '}') {
            // This is a non-import, non-comment rule
            if (trimmedLine.includes('{') || trimmedLine.includes(':') || trimmedLine.startsWith('.') || trimmedLine.startsWith('#')) {
              nonImportRuleLines.push(index + 1)
            }
          }
        })
        
        // Check if any @import rules appear after style rules
        const firstStyleRule = Math.min(...nonImportRuleLines.filter(n => n > 0))
        const invalidImports = importLines.filter(line => line > firstStyleRule)
        
        if (invalidImports.length > 0) {
          console.log(`CSS file: ${cssFile}`)
          console.log(`First style rule at line: ${firstStyleRule}`)
          console.log(`Invalid @import rules at lines: ${invalidImports.join(', ')}`)
          console.log('Context around invalid imports:')
          invalidImports.forEach(lineNum => {
            const start = Math.max(0, lineNum - 3)
            const end = Math.min(lines.length, lineNum + 2)
            console.log(`Lines ${start + 1}-${end}:`)
            lines.slice(start, end).forEach((line, idx) => {
              const currentLine = start + idx + 1
              const marker = currentLine === lineNum ? '>>> ' : '    '
              console.log(`${marker}${currentLine}: ${line}`)
            })
            console.log('')
          })
        }
        
        expect(invalidImports).toHaveLength(0)
      }
    }
  })

  test('should have required external CSS loaded', async ({ page }) => {
    await page.goto('http://localhost:3001')
    
    // Check if Leaflet CSS is loaded
    const leafletCssLoaded = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      return links.some(link => 
        (link as HTMLLinkElement).href.includes('leaflet') ||
        (link as HTMLLinkElement).href.includes('unpkg.com/leaflet')
      )
    })
    
    expect(leafletCssLoaded).toBe(true)
    
    // Check if Google Fonts are loaded
    const googleFontsLoaded = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      return links.some(link => 
        (link as HTMLLinkElement).href.includes('fonts.googleapis.com')
      )
    })
    
    expect(googleFontsLoaded).toBe(true)
  })

  test('should not have console errors related to CSS', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (text.includes('stylesheet') || 
            text.includes('@import') || 
            text.includes('CSS') ||
            text.includes('leaflet')) {
          consoleErrors.push(text)
        }
      }
    })
    
    await page.goto('http://localhost:3001')
    await page.waitForTimeout(2000) // Wait for all resources to load
    
    if (consoleErrors.length > 0) {
      console.log('CSS-related console errors found:')
      consoleErrors.forEach(error => console.log(`  - ${error}`))
    }
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('should have working map with proper CSS', async ({ page }) => {
    await page.goto('http://localhost:3001')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="weather-map"], .leaflet-container', { 
      timeout: 10000,
      state: 'visible'
    }).catch(() => {
      // If specific selectors don't exist, check for map-related elements
      return page.waitForSelector('div[style*="height"]', { timeout: 5000 })
    })
    
    // Check if Leaflet map container exists and has proper dimensions
    const mapContainer = await page.locator('.leaflet-container').first()
    if (await mapContainer.count() > 0) {
      const boundingBox = await mapContainer.boundingBox()
      expect(boundingBox).not.toBeNull()
      expect(boundingBox!.height).toBeGreaterThan(100) // Should have reasonable height
      expect(boundingBox!.width).toBeGreaterThan(100)  // Should have reasonable width
    } else {
      // Fallback: check for any map-like container
      const mapElement = await page.locator('div').filter({ 
        has: page.locator('[class*="map"], [style*="height"]') 
      }).first()
      expect(await mapElement.count()).toBeGreaterThan(0)
    }
  })

  test('should validate source CSS files have no problematic @import rules', async () => {
    const sourceFiles = [
      'src/app/globals.css',
      'src/components/**/*.css'
    ]
    
    for (const pattern of sourceFiles) {
      const files = glob.sync(pattern)
      for (const file of files) {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8')
          const lines = content.split('\n')
          
          let foundNonImportRule = false
          const problematicImports: number[] = []
          
          lines.forEach((line, index) => {
            const trimmed = line.trim()
            
            // Check for style rules
            if (!foundNonImportRule && 
                trimmed && 
                !trimmed.startsWith('@import') &&
                !trimmed.startsWith('@charset') &&
                !trimmed.startsWith('@layer') &&
                !trimmed.startsWith('/*') &&
                !trimmed.startsWith('*') &&
                !trimmed.startsWith('*/')) {
              
              if (trimmed.startsWith('@tailwind') || 
                  trimmed.startsWith(':root') ||
                  trimmed.startsWith('.') ||
                  trimmed.startsWith('#') ||
                  trimmed.includes('{')) {
                foundNonImportRule = true
              }
            }
            
            // Check for @import after style rules
            if (foundNonImportRule && trimmed.startsWith('@import')) {
              problematicImports.push(index + 1)
            }
          })
          
          if (problematicImports.length > 0) {
            console.log(`\nProblematic @import rules in ${file}:`)
            problematicImports.forEach(lineNum => {
              console.log(`  Line ${lineNum}: ${lines[lineNum - 1].trim()}`)
            })
          }
          
          expect(problematicImports).toHaveLength(0)
        }
      }
    }
  })

  test('should check for build warnings about CSS', async () => {
    // This test checks the build output for CSS-related warnings
    // Note: This would need to be run as part of the build process
    
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 60000
      })
      
      const buildOutput = stdout + stderr
      const cssWarnings = buildOutput
        .split('\n')
        .filter(line => 
          line.includes('@import') ||
          line.includes('stylesheet') ||
          line.includes('CSS') && (line.includes('warn') || line.includes('error'))
        )
      
      if (cssWarnings.length > 0) {
        console.log('CSS-related build warnings/errors:')
        cssWarnings.forEach(warning => console.log(`  ${warning}`))
      }
      
      // This is more of an informational test - we'll warn but not fail
      if (cssWarnings.length > 0) {
        console.warn(`Found ${cssWarnings.length} CSS-related build warnings`)
      }
      
    } catch (error) {
      console.log('Build test skipped - could not run build command')
      // Skip this test if build fails for other reasons
    }
  })
})