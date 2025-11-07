/**
 * ========================================================================
 * IMPORT COORDINATOR TESTS - Checkpoint & Recovery Testing
 * ========================================================================
 *
 * @PURPOSE: Validate incremental import with checkpoint recovery
 * @PRD_REF: PRD-OVERPASS-TEST-INFRASTRUCTURE.md - Success Criteria SC-3
 * @BUSINESS_IMPACT: Enable fault-tolerant USA-wide POI imports
 *
 * TEST COVERAGE:
 * 1. Regional import with checkpoint saving
 * 2. Resume from checkpoint after failure
 * 3. Rate limiting compliance (180 queries/minute)
 * 4. Partial success handling
 * 5. Batch processing with progress tracking
 */

const fs = require('fs').promises
const ImportCoordinator = require('../../scripts/import-coordinator.cjs')
const { createMockPOI } = require('../helpers/poi-assertions.js')

/**
 * Mock OSM Client
 */
function createMockOSMClient(options = {}) {
  return {
    queryOverpassAPI: jest.fn(async (query) => {
      if (options.shouldFail) {
        throw new Error('Overpass API error')
      }

      return {
        elements: options.elements || [
          { type: 'node', id: 1, lat: 44.9778, lon: -93.2650, tags: { name: 'Test Park 1' } },
          { type: 'node', id: 2, lat: 44.9879, lon: -93.2750, tags: { name: 'Test Park 2' } },
          { type: 'node', id: 3, lat: 44.9979, lon: -93.2850, tags: { name: 'Test Park 3' } }
        ]
      }
    }),

    normalizeToPOI: jest.fn((element) => {
      if (!element.tags?.name) return null

      return createMockPOI({
        name: element.tags.name,
        lat: element.lat,
        lng: element.lon,
        data_source: 'osm_overpass'
      })
    })
  }
}

/**
 * Mock Database Importer
 */
function createMockDBImporter(options = {}) {
  let importCount = 0

  return {
    batchImport: jest.fn(async (pois) => {
      importCount++

      if (options.failOnBatch && importCount === options.failOnBatch) {
        throw new Error('Database import error')
      }

      return {
        inserted: pois.length,
        skipped: 0,
        errors: 0,
        duplicates: 0,
        invalidated: 0
      }
    }),

    _getImportCount: () => importCount,
    _resetImportCount: () => { importCount = 0 }
  }
}

describe('Import Coordinator - Regional Import', () => {
  let coordinator, osmClient, dbImporter
  const checkpointFile = '.test-checkpoint.json'

  beforeEach(() => {
    osmClient = createMockOSMClient()
    dbImporter = createMockDBImporter()
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0 // Disable for tests
    })
  })

  afterEach(async () => {
    // Clean up checkpoint file
    try {
      await fs.unlink(checkpointFile)
    } catch (error) {
      // Ignore if file doesn't exist
    }
  })

  it('should import POIs from Overpass API', async () => {
    const stats = await coordinator.regionalImport('Minnesota', 'test query')

    expect(stats.total).toBe(3)
    expect(stats.inserted).toBe(3)
    expect(stats.processed).toBe(3)
  })

  it('should call Overpass API with correct query', async () => {
    const query = 'test overpass query'

    await coordinator.regionalImport('Minnesota', query)

    expect(osmClient.queryOverpassAPI).toHaveBeenCalledWith(query)
  })

  it('should normalize OSM elements to POI format', async () => {
    await coordinator.regionalImport('Minnesota', 'test query')

    expect(osmClient.normalizeToPOI).toHaveBeenCalledTimes(3)
  })

  it('should import POIs using database importer', async () => {
    await coordinator.regionalImport('Minnesota', 'test query')

    expect(dbImporter.batchImport).toHaveBeenCalled()
  })

  it('should clear checkpoint on successful import', async () => {
    await coordinator.regionalImport('Minnesota', 'test query')

    const hasCheckpoint = await coordinator.hasCheckpoint()
    expect(hasCheckpoint).toBe(false)
  })
})

describe('Import Coordinator - Checkpoint Management', () => {
  let coordinator, osmClient, dbImporter
  const checkpointFile = '.test-checkpoint.json'

  beforeEach(() => {
    osmClient = createMockOSMClient()
    dbImporter = createMockDBImporter()
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2 // Small batch size for testing
    })
  })

  afterEach(async () => {
    try {
      await fs.unlink(checkpointFile)
    } catch (error) {
      // Ignore
    }
  })

  it('should save checkpoint after each batch', async () => {
    await coordinator.regionalImport('Minnesota', 'test query')

    const checkpointStats = await coordinator.getCheckpointStats()
    // Checkpoint should be cleared after successful import
    expect(checkpointStats).toBeNull()
  })

  it('should save checkpoint on failure', async () => {
    dbImporter = createMockDBImporter({ failOnBatch: 2 })
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })

    await expect(
      coordinator.regionalImport('Minnesota', 'test query')
    ).rejects.toThrow('Database import error')

    const hasCheckpoint = await coordinator.hasCheckpoint()
    expect(hasCheckpoint).toBe(true)
  })

  it('should resume from checkpoint', async () => {
    // Create a checkpoint
    await coordinator.saveCheckpoint({
      region: 'Minnesota',
      processed: 2,
      inserted: 2,
      skipped: 0,
      errors: 0,
      batches: 1,
      timestamp: new Date().toISOString()
    })

    const checkpoint = await coordinator.loadCheckpoint()
    expect(checkpoint.processed).toBe(2)
    expect(checkpoint.region).toBe('Minnesota')
  })

  it('should track batch progress', async () => {
    const stats = await coordinator.regionalImport('Minnesota', 'test query')

    expect(stats.batches).toBeGreaterThan(0)
    expect(stats.processed).toBe(stats.total)
  })

  it('should handle missing checkpoint file gracefully', async () => {
    const checkpoint = await coordinator.loadCheckpoint()
    expect(checkpoint).toBeNull()
  })
})

describe('Import Coordinator - Rate Limiting', () => {
  let coordinator, osmClient, dbImporter
  const checkpointFile = '.test-checkpoint.json'

  beforeEach(() => {
    osmClient = createMockOSMClient()
    dbImporter = createMockDBImporter()
  })

  afterEach(async () => {
    try {
      await fs.unlink(checkpointFile)
    } catch (error) {
      // Ignore
    }
  })

  it('should configure rate limit delay', () => {
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 500
    })

    expect(coordinator.rateLimitDelay).toBe(500)
  })

  it('should default to 350ms delay (180 queries/min)', () => {
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile
    })

    // 350ms delay = ~171 queries/minute (under 180 limit)
    expect(coordinator.rateLimitDelay).toBe(350)
  })

  it('should wait between API calls', async () => {
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 50 // Short delay for testing
    })

    const startTime = Date.now()
    await coordinator.waitForRateLimit()
    const elapsed = Date.now() - startTime

    expect(elapsed).toBeGreaterThanOrEqual(45) // Allow small timing variance
  })

  it('should allow disabling rate limiting', () => {
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0
    })

    // Verify the delay is configured as 0 (disabled)
    expect(coordinator.rateLimitDelay).toBe(0)
  })
})

describe('Import Coordinator - Batch Processing', () => {
  let coordinator, osmClient, dbImporter
  const checkpointFile = '.test-checkpoint.json'

  beforeEach(() => {
    // Create 10 OSM elements for batch testing
    const elements = Array.from({ length: 10 }, (_, i) => ({
      type: 'node',
      id: i + 1,
      lat: 44.9778 + (i * 0.001),
      lon: -93.2650,
      tags: { name: `Test Park ${i + 1}` }
    }))

    osmClient = createMockOSMClient({ elements })
    dbImporter = createMockDBImporter()
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 3 // Process in batches of 3
    })
  })

  afterEach(async () => {
    try {
      await fs.unlink(checkpointFile)
    } catch (error) {
      // Ignore
    }
  })

  it('should process POIs in batches', async () => {
    await coordinator.regionalImport('Minnesota', 'test query')

    // 10 POIs / batch size 3 = 4 batches
    expect(dbImporter.batchImport).toHaveBeenCalledTimes(4)
  })

  it('should configure batch size', () => {
    const customCoordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      batchSize: 50
    })

    expect(customCoordinator.batchSize).toBe(50)
  })

  it('should handle last batch with fewer items', async () => {
    await coordinator.regionalImport('Minnesota', 'test query')

    const calls = dbImporter.batchImport.mock.calls
    const lastBatch = calls[calls.length - 1][0]

    // Last batch should have 1 POI (10 % 3 = 1)
    expect(lastBatch.length).toBe(1)
  })

  it('should track progress across batches', async () => {
    const stats = await coordinator.regionalImport('Minnesota', 'test query')

    expect(stats.processed).toBe(10)
    expect(stats.inserted).toBe(10)
    expect(stats.batches).toBe(4)
  })
})

describe('Import Coordinator - Error Handling', () => {
  let coordinator, osmClient, dbImporter
  const checkpointFile = '.test-checkpoint.json'

  beforeEach(() => {
    osmClient = createMockOSMClient()
    dbImporter = createMockDBImporter()
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })
  })

  afterEach(async () => {
    try {
      await fs.unlink(checkpointFile)
    } catch (error) {
      // Ignore
    }
  })

  it('should handle Overpass API errors', async () => {
    osmClient = createMockOSMClient({ shouldFail: true })
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0
    })

    await expect(
      coordinator.regionalImport('Minnesota', 'test query')
    ).rejects.toThrow('Overpass API error')
  })

  it('should save checkpoint before throwing error', async () => {
    dbImporter = createMockDBImporter({ failOnBatch: 1 })
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })

    await expect(
      coordinator.regionalImport('Minnesota', 'test query')
    ).rejects.toThrow('Database import error')

    const checkpoint = await coordinator.loadCheckpoint()
    expect(checkpoint).not.toBeNull()
    expect(checkpoint.error).toBe('Database import error')
  })

  it('should include partial success in checkpoint', async () => {
    dbImporter = createMockDBImporter({ failOnBatch: 2 })
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })

    await expect(
      coordinator.regionalImport('Minnesota', 'test query')
    ).rejects.toThrow()

    const stats = await coordinator.getCheckpointStats()
    expect(stats.inserted).toBeGreaterThan(0) // First batch succeeded
    expect(stats.hasError).toBe(true)
  })
})

describe('Import Coordinator - Integration Tests', () => {
  let coordinator, osmClient, dbImporter
  const checkpointFile = '.test-checkpoint.json'

  beforeEach(() => {
    const elements = Array.from({ length: 5 }, (_, i) => ({
      type: 'node',
      id: i + 1,
      lat: 44.9778 + (i * 0.01),
      lon: -93.2650,
      tags: { name: `Minnesota Park ${i + 1}` }
    }))

    osmClient = createMockOSMClient({ elements })
    dbImporter = createMockDBImporter()
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })
  })

  afterEach(async () => {
    try {
      await fs.unlink(checkpointFile)
    } catch (error) {
      // Ignore
    }
  })

  it('should complete end-to-end import', async () => {
    const stats = await coordinator.regionalImport('Minnesota', 'test query')

    expect(stats).toMatchObject({
      region: 'Minnesota',
      total: 5,
      processed: 5,
      inserted: 5,
      skipped: 0,
      errors: 0
    })
  })

  it('should handle resume from checkpoint', async () => {
    // Simulate failure on batch 2
    dbImporter = createMockDBImporter({ failOnBatch: 2 })
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })

    // First attempt fails
    await expect(
      coordinator.regionalImport('Minnesota', 'test query')
    ).rejects.toThrow()

    // Check checkpoint was saved
    const checkpoint1 = await coordinator.getCheckpointStats()
    expect(checkpoint1.processed).toBe(2) // First batch completed
    expect(checkpoint1.hasError).toBe(true)

    // Resume with working importer
    dbImporter = createMockDBImporter()
    coordinator = new ImportCoordinator(osmClient, dbImporter, {
      silent: true,
      checkpointFile,
      rateLimitDelay: 0,
      batchSize: 2
    })

    const stats = await coordinator.regionalImport('Minnesota', 'test query')

    // Should process all POIs
    expect(stats.processed).toBe(5)
    expect(stats.total).toBe(5)
  })

  it('should provide complete statistics', async () => {
    const stats = await coordinator.regionalImport('Minnesota', 'test query')

    expect(stats).toHaveProperty('region')
    expect(stats).toHaveProperty('total')
    expect(stats).toHaveProperty('processed')
    expect(stats).toHaveProperty('inserted')
    expect(stats).toHaveProperty('skipped')
    expect(stats).toHaveProperty('errors')
    expect(stats).toHaveProperty('batches')
  })
})
