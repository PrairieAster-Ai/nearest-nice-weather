#!/usr/bin/env node

// Verify production database has all POIs with JSON fields
// Usage: DATABASE_URL="postgresql://..." node scripts/verify-production-database.cjs
const { Pool } = require('pg')

// Get database URL from environment variable or command line argument
const databaseUrl = process.env.DATABASE_URL || process.argv[2]

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable or connection string argument required')
  console.error('Usage: DATABASE_URL="postgresql://..." node scripts/verify-production-database.cjs')
  console.error('   or: node scripts/verify-production-database.cjs "postgresql://..."')
  process.exit(1)
}

async function verifyDatabase() {
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    console.log('📊 Connecting to production database...')

    // Count total POIs
    const totalResult = await pool.query('SELECT COUNT(*) FROM poi_locations')
    const totalPOIs = parseInt(totalResult.rows[0].count)
    console.log(`✅ Total POIs in production: ${totalPOIs}`)

    // Check POIs with amenities
    const amenitiesResult = await pool.query(`
      SELECT COUNT(*) FROM poi_locations
      WHERE amenities IS NOT NULL AND amenities::text != '[]'
    `)
    const withAmenities = parseInt(amenitiesResult.rows[0].count)
    console.log(`✅ POIs with amenities: ${withAmenities}`)

    // Check POIs with activities
    const activitiesResult = await pool.query(`
      SELECT COUNT(*) FROM poi_locations
      WHERE activities IS NOT NULL AND activities::text != '[]'
    `)
    const withActivities = parseInt(activitiesResult.rows[0].count)
    console.log(`✅ POIs with activities: ${withActivities}`)

    // Sample a few POIs to verify JSON fields are valid
    const sampleResult = await pool.query(`
      SELECT name, amenities, activities
      FROM poi_locations
      WHERE (amenities IS NOT NULL AND amenities::text != '[]')
         OR (activities IS NOT NULL AND activities::text != '[]')
      LIMIT 3
    `)

    console.log('\n📋 Sample POIs with JSON data:')
    sampleResult.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.name}`)
      if (row.amenities && row.amenities !== '[]') {
        console.log(`   Amenities: ${row.amenities}`)
      }
      if (row.activities && row.activities !== '[]') {
        console.log(`   Activities: ${row.activities}`)
      }
    })

    console.log('\n✅ Production database verification complete!')
    console.log(`\n📊 Summary:`)
    console.log(`   Total POIs: ${totalPOIs}`)
    console.log(`   With Amenities: ${withAmenities}`)
    console.log(`   With Activities: ${withActivities}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

verifyDatabase()
