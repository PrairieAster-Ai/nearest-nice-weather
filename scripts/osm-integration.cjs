#!/usr/bin/env node

/**
 * ========================================================================
 * OPENSTREETMAP INTEGRATION - Minnesota Parks Data Extraction
 * ========================================================================
 *
 * @CLAUDE_CONTEXT: OSM Overpass API integration for Minnesota parks
 * @BUSINESS_PURPOSE: Extract ~150 Minnesota parks from OpenStreetMap
 * @TECHNICAL_APPROACH: Overpass API with Minnesota boundary constraints
 *
 * Story: Minnesota POI Database Deployment (#155)
 * Phase: 2 - Data Source Integration
 * Created: 2025-01-30
 * ========================================================================
 */

class OSMIntegration {
  /**
   * @param {Function} httpClient - HTTP client for API requests (default: fetch)
   * @param {Object} options - Configuration options
   */
  constructor(httpClient, options = {}) {
    // If no httpClient provided, try to load node-fetch dynamically
    if (!httpClient) {
      try {
        const fetch = require('node-fetch')
        this.httpClient = fetch
      } catch (e) {
        this.httpClient = null
      }
    } else {
      this.httpClient = httpClient
    }
    this.overpassUrl = options.overpassUrl || 'https://overpass-api.de/api/interpreter'
    this.timeout = options.timeout || 30000 // 30 seconds
    this.userAgent = options.userAgent || 'NearestNiceWeather/1.0 (https://nearestniceweather.com; contact@nearestniceweather.com)'

    // Minnesota bounding box: [south,west,north,east]
    this.minnesotaBounds = options.minnesotaBounds || [43.499356, -97.239209, 49.384472, -89.491739]

    if (!options.silent) {
      console.log('🗺️  OSM Integration initialized for Minnesota parks')
    }
  }

  /**
   * OVERPASS QUERY BUILDER
   * Creates optimized query for Minnesota parks
   */
  buildMinnesotaParksQuery() {
    const [south, west, north, east] = this.minnesotaBounds

    return `
      [out:json][timeout:25][maxsize:1073741824];
      (
        // State Parks (boundary=protected_area is correct tag per OSM wiki)
        rel["boundary"="protected_area"]["protect_class"="5"](${south},${west},${north},${east});
        way["boundary"="protected_area"]["protect_class"="5"](${south},${west},${north},${east});
        rel["boundary"="protected_area"]["protect_class"="21"](${south},${west},${north},${east});
        way["boundary"="protected_area"]["protect_class"="21"](${south},${west},${north},${east});

        // Also include leisure=park with state designation (backward compatibility)
        rel["leisure"="park"]["designation"~"state_park"](${south},${west},${north},${east});
        way["leisure"="park"]["designation"~"state_park"](${south},${west},${north},${east});
        node["leisure"="park"]["designation"~"state_park"](${south},${west},${north},${east});

        // County Parks (leisure=park is correct for local government parks)
        rel["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});
        way["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});
        node["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});

        // Regional Parks
        rel["leisure"="park"]["designation"~"regional_park"](${south},${west},${north},${east});
        way["leisure"="park"]["designation"~"regional_park"](${south},${west},${north},${east});
        node["leisure"="park"]["designation"~"regional_park"](${south},${west},${north},${east});

        // Nature Preserves and Wildlife Areas
        rel["leisure"="nature_reserve"](${south},${west},${north},${east});
        way["leisure"="nature_reserve"](${south},${west},${north},${east});
        node["leisure"="nature_reserve"](${south},${west},${north},${east});

        // Recreation Areas
        rel["leisure"="recreation_ground"](${south},${west},${north},${east});
        way["leisure"="recreation_ground"](${south},${west},${north},${east});
        node["leisure"="recreation_ground"](${south},${west},${north},${east});

        // Camping and outdoor recreation
        rel["tourism"="camp_site"](${south},${west},${north},${east});
        way["tourism"="camp_site"](${south},${west},${north},${east});
        node["tourism"="camp_site"](${south},${west},${north},${east});
      );
      out center;
    `
  }

  /**
   * CATEGORY-SPECIFIC QUERY BUILDERS (Multi-Query Optimization)
   * Split complex query into smaller category-specific queries to avoid timeouts
   */

  /**
   * Build query for state parks and protected areas
   * Uses boundary=protected_area with protect_class tags per OSM wiki
   */
  buildStateParksQuery() {
    const [south, west, north, east] = this.minnesotaBounds

    return `
      [out:json][timeout:25][maxsize:1073741824];
      (
        // State Parks - IUCN Class V (protect_class=5)
        rel["boundary"="protected_area"]["protect_class"="5"](${south},${west},${north},${east});
        way["boundary"="protected_area"]["protect_class"="5"](${south},${west},${north},${east});

        // State Parks - US State Park designation (protect_class=21)
        rel["boundary"="protected_area"]["protect_class"="21"](${south},${west},${north},${east});
        way["boundary"="protected_area"]["protect_class"="21"](${south},${west},${north},${east});

        // Backward compatibility - leisure=park with state designation
        rel["leisure"="park"]["designation"~"state_park"](${south},${west},${north},${east});
        way["leisure"="park"]["designation"~"state_park"](${south},${west},${north},${east});
        node["leisure"="park"]["designation"~"state_park"](${south},${west},${north},${east});
      );
      out center;
    `
  }

  /**
   * Build query for county and regional parks
   * Uses leisure=park with operator or designation filters
   * EXCLUDES sports facilities, boat launches, and other non-walking amenities
   */
  buildCountyParksQuery() {
    const [south, west, north, east] = this.minnesotaBounds

    return `
      [out:json][timeout:25][maxsize:1073741824];
      (
        // County Parks - leisure=park with county operator
        rel["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});
        way["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});
        node["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});

        // Regional Parks - leisure=park with regional designation
        rel["leisure"="park"]["designation"~"regional_park"](${south},${west},${north},${east});
        way["leisure"="park"]["designation"~"regional_park"](${south},${west},${north},${east});
        node["leisure"="park"]["designation"~"regional_park"](${south},${west},${north},${east});
      );
      out center;
    `
  }

  /**
   * Build query for nature reserves and recreation areas
   * Uses leisure=nature_reserve and leisure=recreation_ground
   */
  buildNatureReservesQuery() {
    const [south, west, north, east] = this.minnesotaBounds

    return `
      [out:json][timeout:25][maxsize:1073741824];
      (
        // Nature Reserves
        rel["leisure"="nature_reserve"](${south},${west},${north},${east});
        way["leisure"="nature_reserve"](${south},${west},${north},${east});
        node["leisure"="nature_reserve"](${south},${west},${north},${east});

        // Recreation Areas
        rel["leisure"="recreation_ground"](${south},${west},${north},${east});
        way["leisure"="recreation_ground"](${south},${west},${north},${east});
        node["leisure"="recreation_ground"](${south},${west},${north},${east});
      );
      out center;
    `
  }

  /**
   * Build query for walking paths, hiking trails, and pedestrian-friendly outdoor spaces
   * Focus on pleasant walks and open fields - excludes motorized recreation
   */
  buildWalkingAreasQuery() {
    const [south, west, north, east] = this.minnesotaBounds

    return `
      [out:json][timeout:25][maxsize:1073741824];
      (
        // Walking paths and hiking trails
        way["highway"="footway"](${south},${west},${north},${east});
        way["highway"="path"]["foot"="yes"](${south},${west},${north},${east});
        way["highway"="path"]["foot"!="no"][!"motor_vehicle"](${south},${west},${north},${east});

        // Designated hiking routes
        rel["route"="hiking"](${south},${west},${north},${east});
        way["route"="hiking"](${south},${west},${north},${east});

        // Open meadows, commons, and village greens (open fields to roam)
        way["leisure"="common"](${south},${west},${north},${east});
        node["leisure"="common"](${south},${west},${north},${east});
        way["landuse"="meadow"]["access"!="private"](${south},${west},${north},${east});
        way["landuse"="grass"]["access"!="private"](${south},${west},${north},${east});

        // Gardens and arboretums (pleasant walking areas)
        way["leisure"="garden"]["access"!="private"](${south},${west},${north},${east});
        node["leisure"="garden"]["access"!="private"](${south},${west},${north},${east});
        way["tourism"="attraction"]["attraction"="garden"](${south},${west},${north},${east});
      );
      out center;
    `
  }

  /**
   * OVERPASS API CLIENT
   * Handles API requests with error handling, rate limiting, and exponential backoff
   * @param {string} query - Overpass QL query
   * @param {number} retryCount - Current retry attempt (for internal use)
   * @returns {Promise<Object>} Overpass API response
   */
  async queryOverpassAPI(query, retryCount = 0) {
    const maxRetries = 3

    if (retryCount === 0) {
      console.log('🌐 Querying OSM Overpass API for Minnesota parks...')
    }

    try {
      const response = await this.httpClient(this.overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': this.userAgent
        },
        body: query,
        timeout: this.timeout
      })

      // Handle 429 Too Many Requests with exponential backoff
      if (response.status === 429) {
        if (retryCount >= maxRetries) {
          throw new Error(`Overpass API rate limit exceeded after ${maxRetries} retries`)
        }

        // Check for Retry-After header (in seconds)
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, retryCount) * 1000  // Exponential backoff: 1s, 2s, 4s

        console.log(`⏳ Rate limited (429). Waiting ${waitTime/1000}s before retry ${retryCount + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))

        // Retry with incremented count
        return this.queryOverpassAPI(query, retryCount + 1)
      }

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`📊 OSM API returned ${data.elements?.length || 0} elements`)

      return data

    } catch (error) {
      // Handle network errors (timeout, connection reset) with exponential backoff
      if ((error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.name === 'AbortError') && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000
        console.log(`⏳ Network error (${error.message}). Retrying in ${waitTime/1000}s...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.queryOverpassAPI(query, retryCount + 1)
      }

      console.log(`❌ OSM API request failed: ${error.message}`)
      throw error
    }
  }

  /**
   * CHECK OVERPASS API SERVER STATUS
   * Queries /api/status endpoint to verify server health before imports
   * @returns {Promise<Object>} Server status with available slots
   */
  async checkServerStatus() {
    try {
      const statusUrl = this.overpassUrl.replace('/interpreter', '/status')
      const response = await this.httpClient(statusUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000 // 10 second timeout for status check
      })

      const statusText = await response.text()

      // Parse status response for available slots
      // Example: "Rate limit: 2 slots available now."
      const slotMatch = statusText.match(/(\d+) slots? available/)
      const availableSlots = slotMatch ? parseInt(slotMatch[1]) : -1

      console.log(`🔍 Overpass API Status: ${availableSlots >= 0 ? availableSlots + ' slots available' : 'unknown'}`)

      if (availableSlots === 0) {
        console.log('⚠️  Warning: No slots available. Import may experience delays.')
      }

      return {
        availableSlots,
        healthy: availableSlots !== 0,
        statusText: statusText.substring(0, 200) // First 200 chars for debugging
      }

    } catch (error) {
      console.log(`⚠️  Could not check server status: ${error.message}`)
      return {
        availableSlots: -1,
        healthy: true, // Assume healthy and proceed with caution
        error: error.message
      }
    }
  }

  /**
   * COORDINATE EXTRACTION
   * Handles different OSM element types (node, way, relation)
   */
  extractCoordinates(element) {
    switch (element.type) {
      case 'node':
        if (element.lat === null || element.lat === undefined ||
            element.lon === null || element.lon === undefined) {
          return null
        }
        return { lat: element.lat, lng: element.lon }

      case 'way':
        if (element.nodes && element.nodes.length > 0) {
          // Use first node's coordinates for ways
          const firstNode = element.nodes[0]
          if (firstNode.lat && firstNode.lon) {
            return { lat: firstNode.lat, lng: firstNode.lon }
          }
        }
        // Fallback to geometry center if available
        if (element.center) {
          return { lat: element.center.lat, lng: element.center.lon }
        }
        break

      case 'relation':
        // Use relation center if available
        if (element.center) {
          return { lat: element.center.lat, lng: element.center.lon }
        }
        // Try to find representative coordinates from members
        if (element.members && element.members.length > 0) {
          for (const member of element.members) {
            if (member.lat && member.lon) {
              return { lat: member.lat, lng: member.lon }
            }
          }
        }
        break
    }

    return null
  }

  /**
   * PARK TYPE CLASSIFICATION
   * Maps OSM tags to standardized park types
   */
  classifyParkType(element) {
    const tags = element.tags || {}

    // State Parks
    if (tags.protection_title && tags.protection_title.includes('State Park')) {
      return 'State Park'
    }

    // County Parks
    if (tags.operator && tags.operator.toLowerCase().includes('county')) {
      return 'County Park'
    }

    // Regional Parks
    if (tags['park:type'] === 'regional' ||
        (tags.name && tags.name.toLowerCase().includes('regional'))) {
      return 'Regional Park'
    }

    // Wildlife Areas
    if (tags.protection_title && tags.protection_title.toLowerCase().includes('wildlife')) {
      return 'Wildlife Area'
    }

    // Nature Reserves
    if (tags.leisure === 'nature_reserve') {
      return 'Nature Reserve'
    }

    // Recreation Areas
    if (tags.leisure === 'recreation_ground') {
      return 'Recreation Area'
    }

    // Camping Areas
    if (tags.tourism === 'camp_site') {
      return 'Campground'
    }

    // Forest Areas
    if (tags.landuse === 'forest') {
      if (tags.operator && tags.operator.toLowerCase().includes('state')) {
        return 'State Forest'
      }
      if (tags.operator && tags.operator.toLowerCase().includes('national')) {
        return 'National Forest'
      }
      return 'Forest'
    }

    // Default
    return 'Park'
  }

  /**
   * DESCRIPTION GENERATION
   * Creates meaningful descriptions from OSM data
   */
  generateDescription(element) {
    const tags = element.tags || {}
    const parkType = this.classifyParkType(element)
    const name = tags.name || 'Unnamed location'

    let description = `${name} - ${parkType} in Minnesota`

    // Add specific features if available
    const features = []

    if (tags.natural) features.push(tags.natural)
    if (tags.sport) features.push(`${tags.sport} activities`)
    if (tags.amenity) features.push(tags.amenity)
    if (tags['route:hiking'] === 'yes' || tags.highway === 'footway') features.push('hiking trails')
    if (tags.waterway) features.push(`${tags.waterway} access`)
    if (tags.tourism === 'camp_site') features.push('camping facilities')

    if (features.length > 0) {
      description += ` featuring ${features.slice(0, 3).join(', ')}`
    }

    // Add accessibility info if available
    if (tags.wheelchair === 'yes') {
      description += '. Wheelchair accessible'
    }

    return description
  }

  /**
   * DATA TRANSFORMATION
   * Converts OSM elements to POI format
   */
  transformOSMElement(element) {
    const tags = element.tags || {}
    const coordinates = this.extractCoordinates(element)

    if (!coordinates) {
      console.log(`⚠️  Skipping element ${element.id}: no coordinates found`)
      return null
    }

    // Skip if no name (except for some specific cases)
    if (!tags.name && element.type !== 'relation') {
      console.log(`⚠️  Skipping element ${element.id}: no name tag`)
      return null
    }

    const name = tags.name || `${this.classifyParkType(element)} (OSM ${element.id})`

    return {
      name: name,
      lat: coordinates.lat,
      lng: coordinates.lng,
      park_type: this.classifyParkType(element),
      data_source: 'osm',
      description: this.generateDescription(element),
      osm_id: element.id,
      osm_type: element.type,
      external_id: `osm_${element.type}_${element.id}`,
      name_variations: this.extractNameVariations(tags)
    }
  }

  /**
   * NAME VARIATION EXTRACTION
   * Collects alternative names for search optimization
   */
  extractNameVariations(tags) {
    const variations = []

    if (tags['name:en']) variations.push(tags['name:en'])
    if (tags.alt_name) variations.push(tags.alt_name)
    if (tags.official_name) variations.push(tags.official_name)
    if (tags.short_name) variations.push(tags.short_name)
    if (tags.old_name) variations.push(tags.old_name)

    return variations
  }

  /**
   * MAIN EXTRACTION FUNCTION
   * Entry point for OSM data extraction
   */
  async extractMinnesotaParks() {
    console.log('🚀 Starting OSM extraction for Minnesota parks...')

    try {
      const query = this.buildMinnesotaParksQuery()
      const elements = await this.queryOverpassAPI(query)

      console.log(`📊 Processing ${elements.length} OSM elements...`)

      const pois = []
      let processed = 0
      let skipped = 0

      for (const element of elements) {
        const poi = this.transformOSMElement(element)
        if (poi) {
          pois.push(poi)
          processed++
        } else {
          skipped++
        }
      }

      console.log(`✅ OSM extraction complete: ${processed} POIs processed, ${skipped} skipped`)
      console.log(`📍 Geographic distribution: ${this.analyzeGeographicDistribution(pois)}`)

      return pois

    } catch (error) {
      console.log(`❌ OSM extraction failed: ${error.message}`)
      throw error
    }
  }

  /**
   * GEOGRAPHIC DISTRIBUTION ANALYSIS
   * Provides quick validation of data coverage
   */
  analyzeGeographicDistribution(pois) {
    if (pois.length === 0) return 'No POIs to analyze'

    const lats = pois.map(poi => poi.lat)
    const lngs = pois.map(poi => poi.lng)

    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }

    return `${pois.length} POIs spanning ${bounds.north.toFixed(2)}°N to ${bounds.south.toFixed(2)}°N, ${bounds.west.toFixed(2)}°W to ${bounds.east.toFixed(2)}°W`
  }

  /**
   * IS NON-WALKING POI
   * Filters out sports facilities, boat launches, and motorized recreation
   * @param {Object} tags - OSM tags
   * @param {string} name - POI name
   * @returns {boolean} True if should be excluded
   */
  isNonWalkingPOI(tags, name) {
    // Exclude sports facilities
    if (tags.sport || tags.leisure === 'pitch' || tags.leisure === 'stadium' ||
        tags.leisure === 'sports_centre' || tags.leisure === 'track') {
      return true
    }

    // Exclude boat-related facilities
    if (tags.amenity === 'boat_rental' || tags.amenity === 'boat_storage' ||
        tags.leisure === 'marina' || tags.leisure === 'slipway' ||
        tags.man_made === 'pier' && name?.toLowerCase().includes('boat')) {
      return true
    }

    // Exclude motorized recreation
    if (tags.leisure === 'playground' && tags.playground?.includes('vehicle') ||
        tags.atv === 'yes' || tags.motor_vehicle === 'yes' ||
        tags.motorcycle === 'yes' || tags.snowmobile === 'yes') {
      return true
    }

    // Name-based exclusions (catch-all for missed tags)
    const lowerName = name?.toLowerCase() || ''
    const excludeKeywords = [
      'ball field', 'baseball', 'softball', 'basketball', 'tennis',
      'boat launch', 'boat ramp', 'marina', 'pier',
      'atv', 'orv', 'snowmobile', 'motor',
      'golf', 'disc golf',
      'shooting range', 'gun range',
      'dog park', 'skate park'
    ]

    return excludeKeywords.some(keyword => lowerName.includes(keyword))
  }

  /**
   * NORMALIZE TO POI SCHEMA
   * Converts OSM element to poi_locations database schema
   * @param {Object} element - OSM element
   * @returns {Object|null} Normalized POI object or null if invalid
   */
  normalizeToPOI(element) {
    const tags = element.tags || {}
    const coordinates = this.extractCoordinates(element)

    // Validate coordinates
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return null
    }

    // Validate name (required, min 3 chars)
    if (!tags.name || tags.name.length < 3) {
      return null
    }

    // Validate Minnesota bounds
    if (!this.isInMinnesotaBounds(coordinates.lat, coordinates.lng)) {
      return null
    }

    // EXCLUDE non-walking POIs - sports facilities, boat launches, motorized recreation
    if (this.isNonWalkingPOI(tags, tags.name)) {
      return null
    }

    // Infer park level from tags
    const parkLevel = this.inferParkLevel(tags)

    // Calculate place rank from park level
    const placeRank = this.calculatePlaceRank(parkLevel)

    return {
      name: tags.name,
      lat: parseFloat(coordinates.lat),
      lng: parseFloat(coordinates.lng),
      park_type: this.classifyParkType(element),
      park_level: parkLevel,
      ownership: tags.ownership || tags.operator,
      operator: tags.operator,
      data_source: 'osm_overpass',
      description: tags.description || this.generateDescription(element),
      source_id: element.id?.toString(),
      place_rank: placeRank,
      phone: tags.phone || null,
      website: tags.website || null,
      amenities: this.extractAmenities(tags),
      activities: this.extractActivities(tags)
    }
  }

  /**
   * INFER PARK LEVEL
   * Determines hierarchical level from OSM tags
   */
  inferParkLevel(tags) {
    if (tags.boundary === 'national_park' || tags.protection_title?.includes('National')) {
      return 'national'
    }
    if (tags.owner?.includes('Minnesota') || tags.operator?.includes('DNR') ||
        tags.protection_title?.includes('State')) {
      return 'state'
    }
    if (tags.owner?.includes('County') || tags.operator?.includes('County')) {
      return 'county'
    }
    return 'municipal'
  }

  /**
   * CALCULATE PLACE RANK
   * Maps park level to importance ranking
   */
  calculatePlaceRank(parkLevel) {
    const rankMap = {
      'national': 10,
      'state': 20,
      'county': 30,
      'municipal': 40
    }
    return rankMap[parkLevel] || 50
  }

  /**
   * VALIDATE POI
   * Checks if element meets minimum requirements
   */
  isValidPOI(element) {
    const poi = this.normalizeToPOI(element)
    return poi !== null
  }

  /**
   * CHECK MINNESOTA BOUNDS
   * Validates coordinates are within Minnesota
   */
  isInMinnesotaBounds(lat, lng) {
    const [south, west, north, east] = this.minnesotaBounds
    return lat >= south && lat <= north && lng >= west && lng <= east
  }

  /**
   * EXTRACT AMENITIES
   * Parses amenities from OSM tags
   */
  extractAmenities(tags) {
    const amenities = []

    if (tags.toilets === 'yes') amenities.push('toilets')
    if (tags.drinking_water === 'yes') amenities.push('drinking_water')
    if (tags.picnic_table === 'yes') amenities.push('picnic_tables')
    if (tags.parking) amenities.push('parking')
    if (tags.shelter) amenities.push('shelter')
    if (tags.information) amenities.push('visitor_info')

    return amenities
  }

  /**
   * EXTRACT ACTIVITIES
   * Parses activities from OSM tags
   */
  extractActivities(tags) {
    const activities = []

    if (tags.sport) {
      if (typeof tags.sport === 'string') {
        activities.push(tags.sport)
      } else if (Array.isArray(tags.sport)) {
        activities.push(...tags.sport)
      }
    }

    if (tags.highway === 'footway' || tags['route:hiking'] === 'yes') {
      activities.push('hiking')
    }
    if (tags.tourism === 'camp_site') activities.push('camping')
    if (tags.waterway) activities.push('water_activities')
    if (tags.natural === 'beach') activities.push('swimming')

    return activities
  }
}

// Export for both ES6 and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OSMIntegration
  module.exports.default = OSMIntegration
}

// ES6 export will be added later when Jest is configured for ES modules
// export default OSMIntegration
