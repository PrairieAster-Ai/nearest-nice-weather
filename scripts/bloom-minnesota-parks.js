#!/usr/bin/env node

/**
 * 🌸 BLOOM MINNESOTA PARKS - ETL Pipeline for POI Data Expansion
 * =============================================================
 * 
 * Like a prairie aster spreading its seeds, this script helps our
 * POI database bloom from 17 locations to 200+ Minnesota parks!
 * 
 * Data Sources (Our Garden Variety):
 * - OpenStreetMap: The deep roots of geographic data
 * - National Park Service: Federal petals in our bouquet  
 * - Minnesota DNR: Local wildflowers unique to our state
 * 
 * @BUSINESS_PURPOSE: Expand POI coverage for comprehensive outdoor recreation
 * @TECHNICAL_APPROACH: Multi-source ETL with deduplication and quality control
 */

import fetch from 'node-fetch'
import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

// Database connection - the soil for our data garden
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Minnesota bounding box - our garden's fence
const MINNESOTA_BOUNDS = {
  north: 49.384472,
  south: 43.499356,
  east: -89.491739,
  west: -97.239209
}

/**
 * 🌱 SEED DATA SOURCES - Where our parks will sprout from
 */
const DATA_SOURCES = {
  OSM: 'osm',
  NPS: 'nps',
  MN_DNR: 'mn_dnr',
  MANUAL: 'manual'
}

/**
 * 🌺 PARK TYPE CLASSIFICATIONS - Different flowers in our garden
 */
const PARK_TYPES = {
  NATIONAL_PARK: 'National Park',
  STATE_PARK: 'State Park',
  REGIONAL_PARK: 'Regional Park',
  COUNTY_PARK: 'County Park',
  CITY_PARK: 'City Park',
  NATURE_PRESERVE: 'Nature Preserve',
  WILDLIFE_REFUGE: 'Wildlife Refuge',
  STATE_FOREST: 'State Forest',
  RECREATION_AREA: 'Recreation Area',
  TRAIL: 'Trail System'
}

/**
 * 🌿 FETCH OPENSTREETMAP DATA - The roots of our data garden
 * Uses Overpass API to query Minnesota parks and recreation areas
 */
async function fetchOSMParks() {
  console.log('🌱 Planting OSM seeds... (fetching OpenStreetMap data)')
  
  const overpassQuery = `
    [out:json][timeout:25];
    (
      // National and State Parks
      way["leisure"="park"]["name"]["park_type"~"national|state"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      relation["leisure"="park"]["name"]["park_type"~"national|state"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      
      // State Parks specifically tagged
      way["boundary"="protected_area"]["protect_class"="2"]["name"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      relation["boundary"="protected_area"]["protect_class"="2"]["name"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      
      // Nature Reserves and Wildlife Areas
      way["leisure"="nature_reserve"]["name"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      relation["leisure"="nature_reserve"]["name"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      
      // Regional Parks
      way["leisure"="park"]["name"]["operator"~"county|regional"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
      
      // State Forests
      way["landuse"="forest"]["operator"~"state|minnesota"]["name"](${MINNESOTA_BOUNDS.south},${MINNESOTA_BOUNDS.west},${MINNESOTA_BOUNDS.north},${MINNESOTA_BOUNDS.east});
    );
    out center;
  `
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    const data = await response.json()
    console.log(`🌿 Sprouted ${data.elements.length} potential parks from OSM`)
    
    return data.elements.map(element => ({
      name: element.tags.name,
      lat: element.center?.lat || element.lat,
      lng: element.center?.lon || element.lon,
      osm_id: element.id,
      osm_type: element.type,
      park_type: determineParkType(element.tags),
      description: element.tags.description || generateDescription(element.tags),
      data_source: DATA_SOURCES.OSM,
      external_id: `osm_${element.type}_${element.id}`
    })).filter(park => park.name && park.lat && park.lng)
    
  } catch (error) {
    console.error('🥀 OSM fetch wilted:', error.message)
    return []
  }
}

/**
 * 🏵️ FETCH NATIONAL PARK SERVICE DATA - Federal flowers in our bouquet
 */
async function fetchNPSParks() {
  console.log('🌻 Growing NPS flowers... (fetching National Park Service data)')
  
  // Note: You'll need to register for a free API key at https://www.nps.gov/subjects/developer/index.htm
  const NPS_API_KEY = process.env.NPS_API_KEY || 'DEMO_KEY'
  
  try {
    const response = await fetch(
      `https://developer.nps.gov/api/v1/parks?stateCode=MN&api_key=${NPS_API_KEY}`,
      { headers: { 'Accept': 'application/json' } }
    )
    
    const data = await response.json()
    console.log(`🌼 Bloomed ${data.data.length} parks from NPS`)
    
    return data.data.map(park => ({
      name: park.fullName,
      lat: parseFloat(park.latitude),
      lng: parseFloat(park.longitude),
      park_type: PARK_TYPES.NATIONAL_PARK,
      description: park.description,
      data_source: DATA_SOURCES.NPS,
      external_id: `nps_${park.parkCode}`,
      osm_id: null,
      osm_type: null
    }))
    
  } catch (error) {
    console.error('🥀 NPS fetch failed to bloom:', error.message)
    return []
  }
}

/**
 * 🌷 FETCH MINNESOTA DNR DATA - Local wildflowers
 * Note: This is a simplified example - real implementation would need proper DNR API access
 */
async function fetchMNDNRParks() {
  console.log('🌹 Cultivating Minnesota DNR wildflowers...')
  
  // Minnesota State Parks from our existing knowledge
  // In production, this would fetch from DNR API or dataset
  const mnStateParks = [
    { name: "Itasca State Park", lat: 47.2419, lng: -95.2061 },
    { name: "Gooseberry Falls State Park", lat: 47.1389, lng: -91.4706 },
    { name: "Split Rock Lighthouse State Park", lat: 47.2003, lng: -91.3672 },
    { name: "Minneopa State Park", lat: 44.1433, lng: -94.0922 },
    { name: "Fort Snelling State Park", lat: 44.8928, lng: -93.1811 },
    { name: "Whitewater State Park", lat: 44.0597, lng: -92.0386 },
    { name: "Blue Mounds State Park", lat: 43.7067, lng: -96.1892 },
    { name: "Frontenac State Park", lat: 44.5167, lng: -92.3500 },
    { name: "Interstate State Park", lat: 45.3908, lng: -92.6522 },
    { name: "Lake Bemidji State Park", lat: 47.5333, lng: -94.8333 },
    { name: "Mille Lacs Kathio State Park", lat: 46.1308, lng: -93.7447 },
    { name: "Sibley State Park", lat: 45.0014, lng: -95.0142 },
    { name: "William O'Brien State Park", lat: 45.2219, lng: -92.7619 },
    { name: "Wild River State Park", lat: 45.5342, lng: -92.7506 },
    { name: "Banning State Park", lat: 46.1706, lng: -92.8533 },
    { name: "Cascade River State Park", lat: 47.7089, lng: -90.5000 },
    { name: "George H. Crosby Manitou State Park", lat: 47.4833, lng: -91.1167 },
    { name: "Grand Portage State Park", lat: 48.0000, lng: -89.5833 },
    { name: "Jay Cooke State Park", lat: 46.6533, lng: -92.3728 },
    { name: "Judge C.R. Magney State Park", lat: 47.8167, lng: -90.0500 },
    { name: "Temperance River State Park", lat: 47.5522, lng: -90.8825 },
    { name: "Tettegouche State Park", lat: 47.3425, lng: -91.1978 }
  ]
  
  console.log(`🌺 Gathered ${mnStateParks.length} Minnesota state park wildflowers`)
  
  return mnStateParks.map(park => ({
    ...park,
    park_type: PARK_TYPES.STATE_PARK,
    description: `${park.name} - A Minnesota State Park offering outdoor recreation and natural beauty`,
    data_source: DATA_SOURCES.MN_DNR,
    external_id: `mn_dnr_${park.name.toLowerCase().replace(/\s+/g, '_')}`,
    osm_id: null,
    osm_type: null
  }))
}

/**
 * 🌾 DETERMINE PARK TYPE - Classify our flowers
 */
function determineParkType(tags) {
  if (tags.protect_class === '2' || tags.designation?.includes('state_park')) {
    return PARK_TYPES.STATE_PARK
  }
  if (tags.designation?.includes('national')) {
    return PARK_TYPES.NATIONAL_PARK
  }
  if (tags.operator?.match(/county|regional/i)) {
    return PARK_TYPES.REGIONAL_PARK
  }
  if (tags.leisure === 'nature_reserve') {
    return PARK_TYPES.NATURE_PRESERVE
  }
  if (tags.landuse === 'forest' && tags.operator?.match(/state|minnesota/i)) {
    return PARK_TYPES.STATE_FOREST
  }
  return PARK_TYPES.STATE_PARK // Default for Minnesota focus
}

/**
 * 🌻 GENERATE DESCRIPTION - Help each flower tell its story
 */
function generateDescription(tags) {
  const features = []
  if (tags.sport) features.push(tags.sport)
  if (tags.leisure) features.push(tags.leisure)
  if (tags.natural) features.push(tags.natural)
  
  const featureText = features.length > 0 ? ` featuring ${features.join(', ')}` : ''
  return `Minnesota outdoor recreation area${featureText}`
}

/**
 * 🪻 DEDUPLICATE PARKS - Prune our garden for quality
 */
function deduplicateParks(parks) {
  console.log('✂️ Pruning duplicates from our garden...')
  
  const uniqueParks = []
  const seen = new Set()
  
  // Sort by data source priority: NPS > MN_DNR > OSM > MANUAL
  const priorityOrder = [DATA_SOURCES.NPS, DATA_SOURCES.MN_DNR, DATA_SOURCES.OSM, DATA_SOURCES.MANUAL]
  parks.sort((a, b) => priorityOrder.indexOf(a.data_source) - priorityOrder.indexOf(b.data_source))
  
  for (const park of parks) {
    // Create a key based on name similarity and proximity
    const normalizedName = park.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const gridKey = `${Math.round(park.lat * 100)},${Math.round(park.lng * 100)}`
    const key = `${normalizedName}-${gridKey}`
    
    if (!seen.has(key)) {
      seen.add(key)
      uniqueParks.push(park)
    }
  }
  
  console.log(`🌿 Kept ${uniqueParks.length} unique flowers (removed ${parks.length - uniqueParks.length} duplicates)`)
  return uniqueParks
}

/**
 * 🌺 LOAD PARKS INTO DATABASE - Plant our garden!
 */
async function loadParksIntoDatabase(parks) {
  console.log('🌱 Planting our park garden in the database...')
  
  const client = await pool.connect()
  
  try {
    // Start transaction
    await client.query('BEGIN')
    
    // Clear existing non-manual parks (preserve our hand-picked flowers)
    await client.query(`
      DELETE FROM poi_locations 
      WHERE data_source != $1
    `, [DATA_SOURCES.MANUAL])
    
    // Plant each park
    let planted = 0
    for (const park of parks) {
      try {
        await client.query(`
          INSERT INTO poi_locations (
            name, lat, lng, park_type, description, 
            data_source, external_id, osm_id, osm_type, place_rank
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          park.name,
          park.lat,
          park.lng,
          park.park_type,
          park.description,
          park.data_source,
          park.external_id,
          park.osm_id,
          park.osm_type,
          calculatePlaceRank(park)
        ])
        planted++
      } catch (error) {
        console.warn(`🥀 Failed to plant ${park.name}:`, error.message)
      }
    }
    
    await client.query('COMMIT')
    console.log(`🌸 Successfully planted ${planted} parks in our database garden!`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('🥀 Database planting failed:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * 🌟 CALCULATE PLACE RANK - Determine flower prominence
 */
function calculatePlaceRank(park) {
  // National Parks bloom brightest
  if (park.park_type === PARK_TYPES.NATIONAL_PARK) return 10
  // State Parks are our main attractions
  if (park.park_type === PARK_TYPES.STATE_PARK) return 15
  // Regional Parks serve communities
  if (park.park_type === PARK_TYPES.REGIONAL_PARK) return 20
  // Everything else
  return 25
}

/**
 * 🌻 MAIN BLOOM FUNCTION - Watch our garden grow!
 */
async function bloomMinnesotaParks() {
  console.log('🌸 MINNESOTA PARKS ETL - Time to help our data bloom!')
  console.log('================================================')
  
  try {
    // Gather seeds from all sources
    const [osmParks, npsParks, dnrParks] = await Promise.all([
      fetchOSMParks(),
      fetchNPSParks(),
      fetchMNDNRParks()
    ])
    
    // Combine all our flowers
    const allParks = [...osmParks, ...npsParks, ...dnrParks]
    console.log(`\n🌼 Collected ${allParks.length} total park seeds`)
    
    // Prune duplicates
    const uniqueParks = deduplicateParks(allParks)
    
    // Plant in database
    await loadParksIntoDatabase(uniqueParks)
    
    // Show what bloomed
    const stats = uniqueParks.reduce((acc, park) => {
      acc[park.park_type] = (acc[park.park_type] || 0) + 1
      return acc
    }, {})
    
    console.log('\n🌺 Our Minnesota Parks Garden has bloomed!')
    console.log('Garden Statistics:')
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`  🌿 ${type}: ${count} locations`)
    })
    
    console.log('\n✨ Your POI database is now in full bloom!')
    
  } catch (error) {
    console.error('🥀 ETL process failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Let the garden bloom!
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  bloomMinnesotaParks()
}

import { fileURLToPath } from 'url'