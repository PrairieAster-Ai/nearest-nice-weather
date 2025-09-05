#!/usr/bin/env node
/**
 * ========================================================================
 * POI TEST IMPORT - Small Batch for Testing
 * ========================================================================
 *
 * Quick test with a small set of known good POIs to validate the pipeline
 * before running the full 1000+ import
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const sql = neon(process.env.DATABASE_URL)

// Small set of high-quality Minnesota state parks for testing
const testPOIs = [
  {
    name: "Gooseberry Falls State Park",
    lat: 47.1389,
    lng: -91.4706,
    park_type: "State Park",
    park_level: "state",
    ownership: "Minnesota DNR",
    operator: "Minnesota DNR",
    description: "Famous waterfalls on the North Shore of Lake Superior",
    data_source: "manual_test",
    source_id: "test_001",
    place_rank: 10,
    website: "https://www.dnr.state.mn.us/state_parks/park.html?id=spk00181"
  },
  {
    name: "Split Rock Lighthouse State Park",
    lat: 47.2005,
    lng: -91.4690,
    park_type: "State Park",
    park_level: "state",
    ownership: "Minnesota DNR",
    operator: "Minnesota DNR",
    description: "Historic lighthouse on Lake Superior with hiking trails",
    data_source: "manual_test",
    source_id: "test_002",
    place_rank: 10,
    website: "https://www.dnr.state.mn.us/state_parks/park.html?id=spk00286"
  },
  {
    name: "Itasca State Park",
    lat: 47.2064,
    lng: -95.2111,
    park_type: "State Park",
    park_level: "state",
    ownership: "Minnesota DNR",
    operator: "Minnesota DNR",
    description: "Headwaters of the Mississippi River, Minnesota's oldest state park",
    data_source: "manual_test",
    source_id: "test_003",
    place_rank: 5,
    website: "https://www.dnr.state.mn.us/state_parks/park.html?id=spk00181"
  },
  {
    name: "Voyageurs National Park",
    lat: 48.4839,
    lng: -92.8382,
    park_type: "National Park",
    park_level: "national",
    ownership: "National Park Service",
    operator: "National Park Service",
    description: "Water-based national park in the Boundary Waters region",
    data_source: "manual_test",
    source_id: "test_004",
    place_rank: 1,
    website: "https://www.nps.gov/voya/"
  },
  {
    name: "Minnehaha Regional Park",
    lat: 44.9153,
    lng: -93.2105,
    park_type: "Regional Park",
    park_level: "county",
    ownership: "Minneapolis Park Board",
    operator: "Minneapolis Park Board",
    description: "Famous waterfall park in Minneapolis with 53-foot waterfall",
    data_source: "manual_test",
    source_id: "test_005",
    place_rank: 15,
    website: "https://www.minneapolisparks.org/parks__destinations/parks__lakes/minnehaha_regional_park/"
  }
]

async function testImport() {
  console.log('🧪 Testing POI Import Pipeline')
  console.log('==============================')

  try {
    // Create expanded table
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

    // Insert test POIs
    console.log(`📝 Inserting ${testPOIs.length} test POIs...`)
    for (const poi of testPOIs) {
      try {
        await sql`
          INSERT INTO poi_locations_expanded (
            name, lat, lng, park_type, park_level, ownership, operator,
            description, data_source, source_id, place_rank, website,
            amenities, activities
          ) VALUES (
            ${poi.name}, ${poi.lat}, ${poi.lng}, ${poi.park_type}, ${poi.park_level},
            ${poi.ownership}, ${poi.operator}, ${poi.description}, ${poi.data_source},
            ${poi.source_id}, ${poi.place_rank}, ${poi.website},
            ${[]}, ${[]}
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
            website = EXCLUDED.website,
            updated_at = CURRENT_TIMESTAMP
        `
        console.log(`✅ Inserted: ${poi.name}`)
      } catch (error) {
        console.error(`❌ Error inserting ${poi.name}:`, error.message)
      }
    }

    // Verify results
    console.log('\n🔍 Verifying imported data...')
    const result = await sql`
      SELECT name, lat, lng, park_type, park_level, data_source, place_rank
      FROM poi_locations_expanded
      WHERE data_source = 'manual_test'
      ORDER BY place_rank ASC, name ASC
    `

    console.log(`✅ Successfully imported ${result.length} test POIs:`)
    result.forEach(poi => {
      console.log(`   ${poi.name} (${poi.park_type}) - Rank: ${poi.place_rank}`)
    })

    console.log('\n🎉 Test Import Complete!')
    console.log('\n📋 Next Steps:')
    console.log('1. Test API endpoint: /api/poi-locations?limit=10')
    console.log('2. Check localhost frontend map display')
    console.log('3. Run full import if test looks good')

  } catch (error) {
    console.error('💥 Test Import Failed:', error)
    process.exit(1)
  }
}

// Execute test
testImport()
