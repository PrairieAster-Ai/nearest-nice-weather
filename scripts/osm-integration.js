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

import fetch from 'node-fetch'

class OSMIntegration {
  constructor() {
    this.overpassUrl = 'https://overpass-api.de/api/interpreter'
    this.timeout = 30000 // 30 seconds
    this.userAgent = 'NearestNiceWeather/1.0 (https://nearestniceweather.com)'

    // Minnesota bounding box: [south,west,north,east]
    this.minnesotaBounds = [43.499356, -97.239209, 49.384472, -89.491739]

    console.log('🗺️  OSM Integration initialized for Minnesota parks')
  }

  /**
   * OVERPASS QUERY BUILDER
   * Creates optimized query for Minnesota parks
   */
  buildMinnesotaParksQuery() {
    const [south, west, north, east] = this.minnesotaBounds

    return `
      [out:json][timeout:25];
      (
        // State Parks
        rel["leisure"="nature_reserve"]["protection_title"~"State Park"](${south},${west},${north},${east});
        way["leisure"="nature_reserve"]["protection_title"~"State Park"](${south},${west},${north},${east});
        node["leisure"="nature_reserve"]["protection_title"~"State Park"](${south},${west},${north},${east});

        // County Parks
        rel["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});
        way["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});
        node["leisure"="park"]["operator"~".*County.*"](${south},${west},${north},${east});

        // Regional Parks
        rel["leisure"="park"]["park:type"="regional"](${south},${west},${north},${east});
        way["leisure"="park"]["park:type"="regional"](${south},${west},${north},${east});
        node["leisure"="park"]["park:type"="regional"](${south},${west},${north},${east});

        // Nature Preserves and Wildlife Areas
        rel["leisure"="nature_reserve"]["protection_title"~"Wildlife"](${south},${west},${north},${east});
        way["leisure"="nature_reserve"]["protection_title"~"Wildlife"](${south},${west},${north},${east});
        node["leisure"="nature_reserve"]["protection_title"~"Wildlife"](${south},${west},${north},${east});

        // Recreation Areas
        rel["leisure"="recreation_ground"](${south},${west},${north},${east});
        way["leisure"="recreation_ground"](${south},${west},${north},${east});
        node["leisure"="recreation_ground"](${south},${west},${north},${east});

        // Forest areas (state and national)
        rel["landuse"="forest"]["operator"~".*State.*|.*National.*"](${south},${west},${north},${east});
        way["landuse"="forest"]["operator"~".*State.*|.*National.*"](${south},${west},${north},${east});

        // Camping and outdoor recreation
        rel["tourism"="camp_site"](${south},${west},${north},${east});
        way["tourism"="camp_site"](${south},${west},${north},${east});
        node["tourism"="camp_site"](${south},${west},${north},${east});
      );
      out geom;
    `
  }

  /**
   * OVERPASS API CLIENT
   * Handles API requests with error handling and rate limiting
   */
  async queryOverpassAPI(query) {
    console.log('🌐 Querying OSM Overpass API for Minnesota parks...')

    try {
      const response = await fetch(this.overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': this.userAgent
        },
        body: query,
        timeout: this.timeout
      })

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`📊 OSM API returned ${data.elements?.length || 0} elements`)

      return data.elements || []

    } catch (error) {
      console.log(`❌ OSM API request failed: ${error.message}`)
      throw error
    }
  }

  /**
   * COORDINATE EXTRACTION
   * Handles different OSM element types (node, way, relation)
   */
  extractCoordinates(element) {
    switch (element.type) {
      case 'node':
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
}

export default OSMIntegration
