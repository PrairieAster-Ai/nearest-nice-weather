/**
 * ========================================================================
 * POI CONTEXTUAL AD - Location & Weather Aware AdSense Integration
 * ========================================================================
 *
 * @BUSINESS_PURPOSE: Contextual ads within POI map markers for maximum relevance
 * @TECHNICAL_APPROACH: Weather + location-aware ad content for outdoor recreation
 * @PRD_REF: PRD-GOOGLE-ADSENSE-181.md
 *
 * CONTEXTUAL STRATEGY:
 * - Weather-aware ad content (sunny = outdoor gear, rainy = indoor alternatives)
 * - Location-aware targeting (park type specific ads)
 * - Compact format optimized for popup space constraints
 * - High-value placement in user engagement moment
 *
 * ========================================================================
 */

import React from 'react'

interface POILocation {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  precipitation: number
  windSpeed: string
  park_type?: string
}

interface POIContextualAdProps {
  location: POILocation
  /** Test mode for development */
  testMode?: boolean
}

/**
 * POIContextualAd - Weather and location contextual ad for map markers
 *
 * Provides relevant outdoor recreation ads based on current weather
 * conditions and POI characteristics for maximum user value
 */
export const POIContextualAd: React.FC<POIContextualAdProps> = ({
  location,
  testMode = process.env.NODE_ENV === 'development'
}) => {
  // Generate contextual ad content based on weather and location
  const getContextualContent = () => {
    const isWarm = location.temperature > 65
    const isCold = location.temperature < 45
    const isRainy = location.precipitation > 50
    const isWindy = parseInt(location.windSpeed) > 15
    const isPark = location.park_type?.toLowerCase().includes('park')
    const isTrail = location.park_type?.toLowerCase().includes('trail')

    // Contextual ad suggestions based on conditions
    if (isRainy) {
      return {
        category: 'Indoor Alternatives',
        suggestions: ['Rain Gear', 'Indoor Activities', 'Weather Apps']
      }
    } else if (isCold) {
      return {
        category: 'Cold Weather Gear',
        suggestions: ['Winter Jackets', 'Warm Hiking Boots', 'Hand Warmers']
      }
    } else if (isWarm && isPark) {
      return {
        category: 'Park Activities',
        suggestions: ['Picnic Supplies', 'Park Games', 'Sun Protection']
      }
    } else if (isTrail) {
      return {
        category: 'Trail Equipment',
        suggestions: ['Hiking Boots', 'Trail Snacks', 'Water Bottles']
      }
    } else if (isWindy) {
      return {
        category: 'Wind Protection',
        suggestions: ['Wind Jackets', 'Shelters', 'Kites & Wind Sports']
      }
    } else {
      return {
        category: 'Outdoor Recreation',
        suggestions: ['Outdoor Gear', 'Recreation Equipment', 'Activity Guides']
      }
    }
  }

  const contextualContent = getContextualContent()

  // AdSense client ID - will be configured via environment variables
  const clientId = process.env.REACT_APP_ADSENSE_CLIENT_ID || 'ca-pub-test'

  if (testMode || !clientId || clientId === 'ca-pub-test') {
    // Test mode display with contextual preview
    return (
      <div className="poi-contextual-ad" style={{
        border: '1px dashed #ccc',
        borderRadius: '4px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center',
        fontSize: '10px',
        color: '#666',
        marginTop: '8px'
      }}>
        <div style={{ fontSize: '9px', marginBottom: '4px', opacity: 0.7 }}>
          Advertisement
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {contextualContent.category}
        </div>
        <div style={{ fontSize: '9px' }}>
          {location.temperature}°F • {location.condition} • {location.park_type}
        </div>
        <div style={{ fontSize: '8px', marginTop: '4px', opacity: 0.8 }}>
          Contextual: {contextualContent.suggestions.join(' • ')}
        </div>
      </div>
    )
  }

  // Production AdSense integration (to be implemented with real client ID)
  return (
    <div className="poi-contextual-ad" style={{
      marginTop: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '9px', marginBottom: '4px', opacity: 0.7 }}>
        Advertisement
      </div>
      {/* Real AdSense code would go here in production */}
      <div style={{
        width: '100%',
        height: '60px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#666'
      }}>
        Contextual Ad Space
        <br />
        {contextualContent.category}
      </div>
    </div>
  )
}

// Utility function exported from separate file to maintain React Fast Refresh compatibility
// See: /src/utils/adUtils.ts

export default POIContextualAd
