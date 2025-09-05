/**
 * ========================================================================
 * SHARED DATABASE QUERIES - Unified Logic for Dual API Architecture
 * ========================================================================
 *
 * @PURPOSE: Single source of truth for all POI database queries
 * @USAGE: Used by both Express.js (localhost) and Vercel functions (production)
 * @BENEFIT: Eliminates query duplication and sync maintenance overhead
 *
 * This module provides consistent POI query logic across environments:
 * - localhost: dev-api-server.js imports these functions
 * - production: apps/web/api/*.js imports these functions
 *
 * Handles schema fallbacks, coordinate transformations, and result formatting
 * identically for both database drivers (pg vs @neondatabase/serverless)
 */

/**
 * Standard POI query with proximity calculation
 * Uses Haversine formula for distance calculation
 *
 * @param {Object} params - Query parameters
 * @param {number|null} params.lat - User latitude for proximity search
 * @param {number|null} params.lng - User longitude for proximity search
 * @param {number} params.limit - Maximum results to return
 * @returns {Object} Query object with sql and params
 */
export function buildPOIQuery({ lat, lng, limit = 200 }) {
  const limitNum = Math.min(parseInt(limit) || 200, 500)

  if (lat && lng) {
    // Proximity-based query with Haversine distance calculation
    return {
      // Try expanded table first (production schema)
      primaryQuery: `
        SELECT
          id, name, lat, lng, park_type, park_level, ownership, operator,
          data_source, description, place_rank, phone, website, amenities, activities,
          (
            -- 📐 HAVERSINE DISTANCE FORMULA - Great Circle Distance Calculation
            -- 🌍 3959 = Earth's radius in miles (use 6371 for kilometers)
            -- 🧮 Formula: R * acos(cos(lat1) * cos(lat2) * cos(lng2-lng1) + sin(lat1) * sin(lat2))
            -- 📍 Parameters: lng (user), lat (user), lat/lng are POI coordinates
            3959 * acos(
              cos(radians($2)) * cos(radians(lat)) *
              cos(radians(lng) - radians($1)) +
              sin(radians($2)) * sin(radians(lat))
            )
          ) as distance_miles
        FROM poi_locations_expanded
        ORDER BY distance_miles ASC
        LIMIT $3
      `,
      // Fallback to basic table (development schema)
      fallbackQuery: `
        SELECT id, name, lat, lng, park_type, data_source,
               description, place_rank,
               NULL as park_level, NULL as ownership, NULL as operator,
               NULL as phone, NULL as website, NULL as amenities, NULL as activities,
          (3959 * acos(
            cos(radians($2)) * cos(radians(lat)) *
            cos(radians(lng) - radians($1)) +
            sin(radians($2)) * sin(radians(lat))
          )) as distance_miles
        FROM poi_locations
        WHERE data_source = 'manual' OR park_type IS NOT NULL
        ORDER BY distance_miles ASC
        LIMIT $3
      `,
      params: [parseFloat(lng), parseFloat(lat), limitNum]
    }
  } else {
    // Importance-based query (no user location)
    return {
      primaryQuery: `
        SELECT
          id, name, lat, lng, park_type, park_level, ownership, operator,
          data_source, description, place_rank, phone, website, amenities, activities
        FROM poi_locations_expanded
        ORDER BY place_rank ASC, name ASC
        LIMIT $1
      `,
      fallbackQuery: `
        SELECT id, name, lat, lng, park_type, data_source,
               description, place_rank,
               NULL as park_level, NULL as ownership, NULL as operator,
               NULL as phone, NULL as website, NULL as amenities, NULL as activities
        FROM poi_locations
        WHERE data_source = 'manual' OR park_type IS NOT NULL
        ORDER BY place_rank ASC, name ASC
        LIMIT $1
      `,
      params: [limitNum]
    }
  }
}

/**
 * Neon-compatible query builder (template literal format)
 * Converts parameterized queries to Neon's template literal syntax
 */
export function buildNeonPOIQuery({ lat, lng, limit = 200 }) {
  const limitNum = Math.min(parseInt(limit) || 200, 500)

  if (lat && lng) {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    return {
      // Primary query for expanded schema
      primaryQuery: (sql) => sql`
        SELECT
          id, name, lat, lng, park_type, park_level, ownership, operator,
          data_source, description, place_rank, phone, website, amenities, activities,
          (3959 * acos(
            cos(radians(${userLat})) * cos(radians(lat)) *
            cos(radians(lng) - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians(lat))
          )) as distance_miles
        FROM poi_locations_expanded
        ORDER BY distance_miles ASC
        LIMIT ${limitNum}
      `,
      // Fallback for basic schema
      fallbackQuery: (sql) => sql`
        SELECT id, name, lat, lng, park_type, data_source,
               description, place_rank,
               NULL as park_level, NULL as ownership, NULL as operator,
               NULL as phone, NULL as website, NULL as amenities, NULL as activities,
          (3959 * acos(
            cos(radians(${userLat})) * cos(radians(lat)) *
            cos(radians(lng) - radians(${userLng})) +
            sin(radians(${userLat})) * sin(radians(lat))
          )) as distance_miles
        FROM poi_locations
        WHERE data_source = 'manual' OR park_type IS NOT NULL
        ORDER BY distance_miles ASC
        LIMIT ${limitNum}
      `
    }
  } else {
    return {
      primaryQuery: (sql) => sql`
        SELECT
          id, name, lat, lng, park_type, park_level, ownership, operator,
          data_source, description, place_rank, phone, website, amenities, activities
        FROM poi_locations_expanded
        ORDER BY place_rank ASC, name ASC
        LIMIT ${limitNum}
      `,
      fallbackQuery: (sql) => sql`
        SELECT id, name, lat, lng, park_type, data_source,
               description, place_rank,
               NULL as park_level, NULL as ownership, NULL as operator,
               NULL as phone, NULL as website, NULL as amenities, NULL as activities
        FROM poi_locations
        WHERE data_source = 'manual' OR park_type IS NOT NULL
        ORDER BY place_rank ASC, name ASC
        LIMIT ${limitNum}
      `
    }
  }
}

/**
 * Standardized POI result transformation
 * Ensures consistent response format across all environments
 *
 * @param {Array} rows - Raw database rows
 * @returns {Array} Normalized POI objects
 */
export function transformPOIResults(rows) {
  return rows.map(row => ({
    id: row.id.toString(),
    name: row.name,
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    park_type: row.park_type || null,
    park_level: row.park_level || null,
    ownership: row.ownership || null,
    operator: row.operator || null,
    data_source: row.data_source || 'unknown',
    description: row.description || null,
    importance_rank: row.place_rank || 1,
    phone: row.phone || null,
    website: row.website || null,
    amenities: row.amenities || [],
    activities: row.activities || [],
    place_rank: row.place_rank || row.importance_rank || 1,
    distance_miles: row.distance_miles ? parseFloat(row.distance_miles).toFixed(2) : null
  }))
}

/**
 * Standardized error response format
 * Consistent error handling across environments
 */
export function createErrorResponse(error, context = '') {
  return {
    success: false,
    error: 'Failed to retrieve POI data',
    message: error.message,
    context: context,
    timestamp: new Date().toISOString()
  }
}

/**
 * Standardized success response format
 * Consistent success structure across environments
 */
export function createSuccessResponse(data, debug = {}) {
  return {
    success: true,
    data: data,
    count: data.length,
    timestamp: new Date().toISOString(),
    debug: {
      data_source: 'poi_locations_table',
      ...debug
    }
  }
}
