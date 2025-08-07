#!/usr/bin/env node
/**
 * Populate preview database with test POI data
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

// Use production database URL for preview (based on Claude.md instructions)
const sql = neon(process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL)

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
    source_id: "preview_test_001",
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
    source_id: "preview_test_002",
    place_rank: 10,
    website: "https://www.dnr.state.mn.us/state_parks/park.html?id=spk00286"
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
    source_id: "preview_test_003",
    place_rank: 1,
    website: "https://www.nps.gov/voya/"
  }
]

async function populatePreviewDB() {
  console.log('🔄 Populating preview database with test POI data')
  
  try {
    // Create expanded table
    await sql`
      CREATE TABLE IF NOT EXISTS poi_locations_expanded (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        park_type VARCHAR(100),
        park_level VARCHAR(50),
        ownership VARCHAR(100),
        operator VARCHAR(255),
        description TEXT,
        data_source VARCHAR(50),
        source_id VARCHAR(100),
        place_rank INTEGER DEFAULT 50,
        phone VARCHAR(20),
        website VARCHAR(255),
        amenities TEXT[],
        activities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(data_source, source_id)
      )
    `
    console.log('✅ Expanded POI table ready')
    
    // Insert test POIs
    for (const poi of testPOIs) {
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
          updated_at = CURRENT_TIMESTAMP
      `
      console.log(`✅ Added: ${poi.name}`)
    }
    
    console.log(`\n🎉 Preview database populated with ${testPOIs.length} test POIs`)
    
  } catch (error) {
    console.error('❌ Preview database population failed:', error)
  }
}

populatePreviewDB()