/**
 * ========================================================================
 * MEDIA.NET CONTEXTUAL AD - Geographic Context Optimization
 * ========================================================================
 *
 * @MISSION_ALIGNMENT: Perfect partner for NearestNiceWeather.com's core value:
 *                     "Personal context optimization of geographic constraints"
 *
 * @CONTEXTUAL_INTELLIGENCE:
 * - Geographic Context: Location-based ad relevance
 * - Weather Context: Temperature, conditions, precipitation awareness
 * - Activity Context: Outdoor recreation activity matching
 * - Temporal Context: Time/season-based optimization
 *
 * @STRATEGIC_ADVANTAGE:
 * - Yahoo/Bing ad network = premium outdoor/travel advertisers
 * - Advanced contextual algorithms = higher relevance than AdSense
 * - No policy restrictions on popup/modal placements
 * - Revenue optimization through context-aware bidding
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

interface MediaNetContextualAdProps {
  location: POILocation
  /** Test mode for development */
  testMode?: boolean
  /** Custom CSS class for styling */
  className?: string
}

/**
 * MediaNetContextualAd - Geographic constraint optimization partner
 *
 * Delivers contextually intelligent ads based on user's geographic constraints,
 * weather conditions, and outdoor recreation preferences
 */
export const MediaNetContextualAd: React.FC<MediaNetContextualAdProps> = ({
  location,
  testMode = process.env.NODE_ENV === 'development',
  className = ''
}) => {
  // Generate contextual keywords for Media.net optimization
  const getContextualKeywords = () => {
    const keywords = ['outdoor recreation', 'minnesota parks']

    // Weather-based context
    if (location.temperature > 75) {
      keywords.push('summer activities', 'hiking gear', 'camping equipment')
    } else if (location.temperature < 45) {
      keywords.push('winter activities', 'cold weather gear', 'indoor alternatives')
    } else {
      keywords.push('spring activities', 'fall activities', 'layered clothing')
    }

    // Precipitation context
    if (location.precipitation > 50) {
      keywords.push('rain gear', 'waterproof equipment', 'indoor entertainment')
    } else {
      keywords.push('outdoor adventures', 'hiking trails', 'picnic supplies')
    }

    // Activity context based on park type
    if (location.park_type?.toLowerCase().includes('trail')) {
      keywords.push('hiking boots', 'trail maps', 'backpacking gear')
    } else if (location.park_type?.toLowerCase().includes('lake')) {
      keywords.push('fishing gear', 'water activities', 'boat rentals')
    } else {
      keywords.push('park activities', 'family recreation', 'outdoor games')
    }

    return keywords.join(', ')
  }

  // Development test mode placeholder
  if (testMode) {
    const contextualKeywords = getContextualKeywords()

    return (
      <div
        className={`media-net-contextual-ad-test ${className}`}
        style={{
          width: '100%',
          height: '90px',
          backgroundColor: '#f0f8ff',
          border: '1px dashed #007acc',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          fontSize: '12px',
          color: '#333',
          textAlign: 'center'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Media.net Contextual Ad (Test Mode)
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Context: {location.temperature}°F, {location.condition}, {location.park_type}
        </div>
        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>
          Keywords: {contextualKeywords.substring(0, 50)}...
        </div>
      </div>
    )
  }

  // Production Media.net ad implementation
  const mediaNetClientId = process.env.REACT_APP_MEDIANET_CLIENT_ID || 'your-medianet-client-id'
  const mediaNetSlotId = process.env.REACT_APP_MEDIANET_POPUP_SLOT_ID || 'your-popup-slot-id'
  const contextualKeywords = getContextualKeywords()

  return (
    <div className={`media-net-contextual-ad ${className}`}>
      {/* Media.net ad unit */}
      <div
        id={`${mediaNetSlotId}-${location.id}`}
        data-cfasync="false"
        data-keywords={contextualKeywords}
        data-geo-lat={location.lat}
        data-geo-lng={location.lng}
        data-weather-temp={location.temperature}
        data-weather-condition={location.condition}
        data-park-type={location.park_type}
        style={{
          width: '100%',
          height: '90px',
          textAlign: 'center'
        }}
      />

      {/* Media.net script injection (will be added after approval) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && window._mNHandle) {
              window._mNHandle.queue = window._mNHandle.queue || [];
              window._mNHandle.queue.push(function(){
                window._mNDetails.loadTag("${mediaNetSlotId}-${location.id}", "${mediaNetClientId}", "${mediaNetSlotId}");
              });
            }
          `
        }}
      />

      {/* Contextual enhancement label */}
      <div style={{
        fontSize: '8px',
        color: '#666',
        textAlign: 'center',
        marginTop: '2px',
        opacity: 0.6
      }}>
        Contextual Ad - Powered by Media.net
      </div>
    </div>
  )
}

// Utility function exported from separate file to maintain React Fast Refresh compatibility
// See: /src/utils/adUtils.ts

export default MediaNetContextualAd
