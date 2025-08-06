#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()
const sql = neon(process.env.DATABASE_URL)

console.log('🔍 Checking database state...')

try {
  // Check if expanded table exists
  console.log('\n📋 Checking for poi_locations_expanded table...')
  const expandedExists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'poi_locations_expanded'
    );
  `
  console.log('Expanded table exists:', expandedExists[0].exists)
  
  if (expandedExists[0].exists) {
    // Count records in expanded table
    const expandedCount = await sql`SELECT COUNT(*) as count FROM poi_locations_expanded`
    console.log('Expanded table records:', expandedCount[0].count)
    
    // Show sample data
    const expandedSample = await sql`
      SELECT name, park_type, park_level, data_source, place_rank 
      FROM poi_locations_expanded 
      ORDER BY place_rank ASC, name ASC 
      LIMIT 5
    `
    console.log('Expanded table sample:')
    expandedSample.forEach(row => {
      console.log(`  ${row.name} (${row.park_type}) - ${row.data_source} - Rank: ${row.place_rank}`)
    })
  }
  
  // Check original table
  console.log('\n📋 Checking original poi_locations table...')
  const originalCount = await sql`SELECT COUNT(*) as count FROM poi_locations`
  console.log('Original table records:', originalCount[0].count)
  
  const originalSample = await sql`
    SELECT name, park_type, data_source, place_rank 
    FROM poi_locations 
    WHERE data_source = 'manual' OR park_type IS NOT NULL
    ORDER BY place_rank ASC, name ASC 
    LIMIT 5
  `
  console.log('Original table sample:')
  originalSample.forEach(row => {
    console.log(`  ${row.name} (${row.park_type}) - ${row.data_source} - Rank: ${row.place_rank}`)
  })
  
} catch (error) {
  console.error('Database check failed:', error)
}