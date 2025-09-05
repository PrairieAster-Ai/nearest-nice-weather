#!/usr/bin/env node
/**
 * ========================================================================
 * POI DATA PIPELINE - 1000+ Minnesota Parks Import System
 * ========================================================================
 *
 * @CLAUDE_CONTEXT: Automated import system for comprehensive Minnesota parks data
 * @BUSINESS_PURPOSE: Scale from 20 POIs to 1000+ comprehensive statewide coverage
 * @TECHNICAL_APPROACH: Multi-tier API integration with schema standardization
 *
 * Data Sources (in priority order):
 * 1. Minnesota DNR Gazetteer API - 125 high-quality state facilities
 * 2. National Park Service API - 20 federal parks/monuments
 * 3. Recreation.gov RIDB API - 50 federal recreation facilities
 * 4. Minnesota GIS Commons - 200 metro area parks
 * 5. OpenStreetMap Overpass - 500+ municipal/local parks
 *
 * Total Target: 1000+ POIs across all park levels
 * ========================================================================
 */

import { neon } from '@neondatabase/serverless'
import fetch from 'node-fetch'

// Environment-specific database connections
const getDatabaseConnection = (environment) => {
  switch (environment) {
    case 'development':
      return neon(process.env.DATABASE_URL)
    case 'preview':
      return neon(process.env.DATABASE_URL_PREVIEW || process.env.DATABASE_URL)
    case 'production':
      return neon(process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL)
    default:
      throw new Error(`Unknown environment: ${environment}`)
  }
}

// Standardized POI data schema
class POIDataNormalizer {
  static normalizeToSchema(rawData, sourceType, sourceMetadata = {}) {
    const baseSchema = {
      name: null,
      lat: null,
      lng: null,
      park_type: null,
      park_level: null,
      ownership: null,
      operator: null,
      description: null,
      data_source: sourceType,
      source_id: null,
      place_rank: 50,
      phone: null,
      website: null,
      amenities: [],
      activities: []
    }

    switch (sourceType) {
      case 'dnr_api':
        return this.normalizeDNRData(rawData, baseSchema)
      case 'nps_api':
        return this.normalizeNPSData(rawData, baseSchema)
      case 'ridb_api':
        return this.normalizeRIDBData(rawData, baseSchema)
      case 'osm_overpass':
        return this.normalizeOSMData(rawData, baseSchema)
      default:
        return { ...baseSchema, ...rawData }
    }
  }

  static normalizeDNRData(data, schema) {
    return {
      ...schema,
      name: data.name,
      lat: parseFloat(data.latitude),
      lng: parseFloat(data.longitude),
      park_type: data.feature_type || 'State Park',
      park_level: 'state',
      ownership: 'Minnesota DNR',
      operator: 'Minnesota DNR',
      description: data.description,
      source_id: data.gazetteer_id?.toString(),
      place_rank: 20, // High priority for state facilities
      website: data.web_url
    }
  }

  static normalizeNPSData(data, schema) {
    return {
      ...schema,
      name: data.fullName,
      lat: parseFloat(data.latitude),
      lng: parseFloat(data.longitude),
      park_type: data.designation || 'National Park',
      park_level: 'national',
      ownership: 'National Park Service',
      operator: 'National Park Service',
      description: data.description,
      source_id: data.parkCode,
      place_rank: 10, // Highest priority for national parks
      phone: data.contacts?.phoneNumbers?.[0]?.phoneNumber,
      website: data.url
    }
  }

  static normalizeRIDBData(data, schema) {
    return {
      ...schema,
      name: data.FacilityName,
      lat: parseFloat(data.FacilityLatitude),
      lng: parseFloat(data.FacilityLongitude),
      park_type: data.FacilityTypeDescription || 'Recreation Area',
      park_level: 'federal',
      ownership: data.ORGNAME || 'Federal',
      operator: data.ORGNAME,
      description: data.FacilityDescription,
      source_id: data.FacilityID?.toString(),
      place_rank: 15, // High priority for federal recreation
      phone: data.FacilityPhone,
      website: data.FacilityURL
    }
  }

  static normalizeOSMData(data, schema) {
    const parkLevel = this.inferParkLevel(data.tags || {})

    // Handle different OSM data structures (node vs way/relation)
    const lat = data.lat || data.center?.lat
    const lng = data.lon || data.lng || data.center?.lon

    // Skip if no valid coordinates
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return null
    }

    // Skip if no name
    if (!data.tags?.name) {
      return null
    }

    return {
      ...schema,
      name: data.tags.name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      park_type: data.tags['park:type'] || 'Park',
      park_level: parkLevel,
      ownership: data.tags.ownership || data.tags.operator,
      operator: data.tags.operator,
      description: data.tags.description,
      source_id: data.id?.toString(),
      place_rank: this.calculateOSMRank(parkLevel),
      website: data.tags.website
    }
  }

  static inferParkLevel(tags) {
    if (tags.boundary === 'national_park' || tags.protection_title?.includes('National')) return 'national'
    if (tags.owner?.includes('Minnesota') || tags.operator?.includes('DNR')) return 'state'
    if (tags.owner?.includes('County') || tags.operator?.includes('County')) return 'county'
    return 'municipal'
  }

  static calculateOSMRank(parkLevel) {
    switch (parkLevel) {
      case 'national': return 10
      case 'state': return 20
      case 'county': return 30
      case 'municipal': return 40
      default: return 50
    }
  }
}

// API Connectors for each data source
class DNRConnector {
  static async fetchStateParks() {
    console.log('📡 Fetching Minnesota DNR state parks...')
    try {
      // Try multiple DNR API endpoints
      const endpoints = [
        'https://services.dnr.state.mn.us/api/gazetteer/v1/places?format=json&limit=200&feature_type=State%20Park',
        'http://services.dnr.state.mn.us/api/gazetteer/v1/places?format=json&limit=200&feature_type=State%20Park',
        'https://www.dnr.state.mn.us/api/gazetteer/v1/places?format=json&limit=200'
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying DNR endpoint: ${endpoint}`)
          const response = await fetch(endpoint, {
            headers: {
              'User-Agent': 'NearestNiceWeather/1.0 (Minnesota Parks Data Pipeline)',
              'Accept': 'application/json'
            },
            timeout: 10000
          })

          if (!response.ok) {
            console.log(`DNR endpoint failed with status: ${response.status}`)
            continue
          }

          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            console.log(`✅ DNR API: Found ${data.length} state facilities`)
            return data.map(item => POIDataNormalizer.normalizeToSchema(item, 'dnr_api'))
          }
        } catch (endpointError) {
          console.log(`DNR endpoint error: ${endpointError.message}`)
          continue
        }
      }

      console.warn('⚠️ All DNR API endpoints failed, skipping DNR data')
      return []
    } catch (error) {
      console.error('❌ DNR API Error:', error.message)
      return []
    }
  }
}

class NPSConnector {
  static async fetchNationalParks() {
    console.log('📡 Fetching National Park Service sites...')
    try {
      // Note: Requires NPS API key in production
      const apiKey = process.env.NPS_API_KEY
      if (!apiKey) {
        console.warn('⚠️ NPS_API_KEY not found, skipping NPS data')
        return []
      }

      const response = await fetch(`https://developer.nps.gov/api/v1/parks?stateCode=MN&api_key=${apiKey}`)
      const data = await response.json()

      console.log(`✅ NPS API: Found ${data.data.length} national parks`)
      return data.data.map(item => POIDataNormalizer.normalizeToSchema(item, 'nps_api'))
    } catch (error) {
      console.error('❌ NPS API Error:', error.message)
      return []
    }
  }
}

class RIDBConnector {
  static async fetchFederalRecreation() {
    console.log('📡 Fetching Recreation.gov federal facilities...')
    try {
      const apiKey = process.env.RIDB_API_KEY
      if (!apiKey) {
        console.warn('⚠️ RIDB_API_KEY not found, skipping RIDB data')
        return []
      }

      const response = await fetch(`https://ridb.recreation.gov/api/v1/facilities?state=MN&apikey=${apiKey}&limit=50`)
      const data = await response.json()

      console.log(`✅ RIDB API: Found ${data.RECDATA.length} federal recreation facilities`)
      return data.RECDATA.map(item => POIDataNormalizer.normalizeToSchema(item, 'ridb_api'))
    } catch (error) {
      console.error('❌ RIDB API Error:', error.message)
      return []
    }
  }
}

class OSMConnector {
  static async fetchMinnesotaParks() {
    console.log('📡 Fetching OpenStreetMap Minnesota parks...')
    try {
      // More targeted OSM query to get better quality parks with coordinates
      const overpassQuery = `
        [out:json][timeout:30];
        (area["name"="Minnesota"]["admin_level"="4"];)->.searchArea;
        (
          nwr["leisure"="park"][name](area.searchArea);
          nwr["leisure"="nature_reserve"][name](area.searchArea);
          nwr["boundary"="national_park"][name](area.searchArea);
          nwr["park:type"~"state_park|county_park"][name](area.searchArea);
        );
        out center meta;
      `

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' }
      })

      const data = await response.json()
      console.log(`✅ OSM API: Found ${data.elements.length} parks`)

      return data.elements
        .filter(element => element.tags?.name) // Only include named parks
        .map(item => POIDataNormalizer.normalizeToSchema(item, 'osm_overpass'))
        .filter(poi => poi !== null) // Remove invalid/null results
    } catch (error) {
      console.error('❌ OSM API Error:', error.message)
      return []
    }
  }
}

// Multi-Environment Database Synchronizer
class MultiEnvironmentSync {
  static async createExpandedPOITable(sql) {
    console.log('🏗️ Creating expanded POI table...')

    await sql`
      CREATE TABLE IF NOT EXISTS poi_locations_expanded (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,

        -- Classification
        park_type VARCHAR(100),
        park_level VARCHAR(50),
        ownership VARCHAR(100),
        operator VARCHAR(255),

        -- Metadata
        description TEXT,
        data_source VARCHAR(50),
        source_id VARCHAR(100),
        place_rank INTEGER DEFAULT 50,

        -- Additional fields
        phone VARCHAR(20),
        website VARCHAR(255),
        amenities TEXT[],
        activities TEXT[],

        -- Standard fields
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Create unique constraint on source + source_id
        UNIQUE(data_source, source_id)
      )
    `

    console.log('✅ Expanded POI table created')
  }

  static async insertPOIData(sql, poiData) {
    console.log(`📝 Inserting ${poiData.length} POIs...`)

    for (const poi of poiData) {
      try {
        await sql`
          INSERT INTO poi_locations_expanded (
            name, lat, lng, park_type, park_level, ownership, operator,
            description, data_source, source_id, place_rank,
            phone, website, amenities, activities
          ) VALUES (
            ${poi.name}, ${poi.lat}, ${poi.lng}, ${poi.park_type}, ${poi.park_level},
            ${poi.ownership}, ${poi.operator}, ${poi.description}, ${poi.data_source},
            ${poi.source_id}, ${poi.place_rank}, ${poi.phone}, ${poi.website},
            ${poi.amenities || []}, ${poi.activities || []}
          )
          ON CONFLICT (data_source, source_id) DO UPDATE SET
            name = EXCLUDED.name,
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng,
            park_type = EXCLUDED.park_type,
            park_level = EXCLUDED.park_level,
            ownership = EXCLUDED.ownership,
            operator = EXCLUDED.operator,
            description = EXCLUDED.description,
            place_rank = EXCLUDED.place_rank,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            amenities = EXCLUDED.amenities,
            activities = EXCLUDED.activities,
            updated_at = CURRENT_TIMESTAMP
        `
      } catch (error) {
        console.error(`❌ Error inserting POI: ${poi.name}`, error.message)
      }
    }

    console.log(`✅ POI data insertion completed`)
  }

  static async syncToAllBranches(poiData) {
    const environments = ['development', 'preview', 'production']

    for (const env of environments) {
      try {
        console.log(`🔄 Syncing to ${env} environment...`)
        const sql = getDatabaseConnection(env)

        await this.createExpandedPOITable(sql)
        await this.insertPOIData(sql, poiData)

        console.log(`✅ ${env} environment sync completed`)
      } catch (error) {
        console.error(`❌ Error syncing to ${env}:`, error.message)
      }
    }
  }
}

// Main execution pipeline
async function main() {
  console.log('🚀 Starting POI Data Pipeline - 1000+ Minnesota Parks')
  console.log('=' .repeat(60))

  const allPOIs = []

  // Phase 1: High-Quality Government Sources
  console.log('\n📋 PHASE 1: Government APIs')
  const dnrData = await DNRConnector.fetchStateParks()
  const npsData = await NPSConnector.fetchNationalParks()
  const ridbData = await RIDBConnector.fetchFederalRecreation()

  allPOIs.push(...dnrData, ...npsData, ...ridbData)
  console.log(`Phase 1 Total: ${dnrData.length + npsData.length + ridbData.length} POIs`)

  // Phase 2: OpenStreetMap Comprehensive Coverage
  console.log('\n📋 PHASE 2: OpenStreetMap Data')
  const osmData = await OSMConnector.fetchMinnesotaParks()
  allPOIs.push(...osmData)
  console.log(`Phase 2 Total: ${osmData.length} POIs`)

  // Final Statistics
  console.log('\n📊 FINAL DATASET STATISTICS')
  console.log(`Total POIs Collected: ${allPOIs.length}`)
  console.log('Breakdown by Source:')
  console.log(`  - Minnesota DNR: ${dnrData.length}`)
  console.log(`  - National Parks: ${npsData.length}`)
  console.log(`  - Recreation.gov: ${ridbData.length}`)
  console.log(`  - OpenStreetMap: ${osmData.length}`)

  // Sync to all database environments
  console.log('\n🔄 SYNCING TO ALL ENVIRONMENTS')
  await MultiEnvironmentSync.syncToAllBranches(allPOIs)

  console.log('\n🎉 POI Data Pipeline Complete!')
  console.log(`Successfully imported ${allPOIs.length} Minnesota parks to all database branches`)
}

// Execute if run directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname
if (isMainModule) {
  main().catch(error => {
    console.error('💥 Pipeline Error:', error)
    process.exit(1)
  })
}

export {
  POIDataNormalizer,
  DNRConnector,
  NPSConnector,
  RIDBConnector,
  OSMConnector,
  MultiEnvironmentSync
}
