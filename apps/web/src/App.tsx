/**
 * ========================================================================
 * NEAREST NICE WEATHER - MAIN APPLICATION COMPONENT
 * ========================================================================
 * 
 * BUSINESS CONTEXT: Core application for outdoor recreation weather intelligence
 * - Primary target: Minnesota outdoor enthusiasts and recreation consumers
 * - Core value proposition: "Find optimal weather conditions for activities"
 * - Business model: B2C platform with market validation focus until 10,000 daily users
 * - Geographic focus: Minnesota with expansion to Upper Midwest planned
 * 
 * TECHNICAL PURPOSE: React SPA providing interactive POI-weather discovery
 * - Interactive map with POI markers for 200+ Minnesota parks and recreation areas
 * - Dynamic filtering system for temperature, precipitation, and wind preferences
 * - User location integration for proximity-based recommendations
 * - Progressive Web App capabilities for mobile outdoor use
 * 
 * DEPENDENCIES:
 * - React 18.3.1: Core framework with hooks for state management
 * - Material-UI: Design system for consistent professional UI
 * - Leaflet: Interactive mapping with OpenStreetMap tiles
 * - Custom hooks: usePOILocations for unified POI-weather data integration
 * - Backend APIs: poi-locations-with-weather, feedback endpoints via Vercel functions
 * 
 * COMPONENT ARCHITECTURE:
 * - App (this file): Main container with state management and business logic
 * - MapComponent: Leaflet map integration with markers and popups
 * - FabFilterSystem: Floating action button filter interface
 * - FeedbackFab: User feedback collection system
 * - UnifiedStickyFooter: Navigation and branding footer
 * 
 * DATA FLOW:
 * 1. App fetches POI locations with weather data via usePOILocations hook
 * 2. User location determined via geolocation → IP → fallback strategies
 * 3. Filters applied to create subset of POIs with suitable weather conditions
 * 4. Map view dynamically calculated to show user + closest filtered POI results
 * 5. User interactions (filter changes, marker drags) update state and view
 * 
 * STATE MANAGEMENT:
 * - filters: User's weather preferences (temperature, precipitation, wind)
 * - filteredLocations: Subset of POI locations matching current weather filters
 * - mapCenter/mapZoom: Dynamic map view based on user location + POI results
 * - userLocation: User's position for proximity-based POI calculations
 * 
 * USER EXPERIENCE GOALS:
 * - Instant visual feedback: Map updates immediately on filter changes
 * - Location-aware: Prioritizes weather near user's location
 * - Mobile-optimized: Touch-friendly interface for outdoor use
 * - Graceful degradation: Works without geolocation or with slow connections
 * 
 * @CLAUDE_CONTEXT: Primary application entry point containing all business logic
 * @BUSINESS_RULE: B2C consumer platform focused on Minnesota outdoor recreation market
 * @ARCHITECTURE_NOTE: Single-page application with real-time map interactions
 * @INTEGRATION_POINT: Connects all UI components with backend weather data
 * @PERFORMANCE_CRITICAL: Map rendering and filter calculations must be responsive
 * 
 * LAST UPDATED: 2025-07-25
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, CircularProgress, Alert } from '@mui/material'
import { FabFilterSystem } from './components/FabFilterSystem'
import { FeedbackFab } from './components/FeedbackFab'
import { UnifiedStickyFooter } from './components/UnifiedStickyFooter'
import { usePOILocations } from './hooks/usePOILocations'
import { usePOINavigation } from './hooks/usePOINavigation'
import { escapeHtml, sanitizeUrl } from './utils/sanitize'
import 'leaflet/dist/leaflet.css'
import './popup-styles.css'
import L from 'leaflet'

// Distance calculation helper (returns miles)
const calculateDistance = (point1: [number, number], point2: [number, number]) => {
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * CUSTOM POI LOCATION MARKER ICON
 * @CLAUDE_CONTEXT: Branded visual element for POI locations on map
 * 
 * BUSINESS CONTEXT: Purple aster (prairie aster) represents Minnesota native flora
 * - Reinforces "Prairie Aster" brand identity and Minnesota focus
 * - Visually distinct from standard map markers for POI locations (parks, recreation areas)
 * - Consistent 40px size for touch-friendly mobile interaction
 * 
 * TECHNICAL IMPLEMENTATION: Leaflet custom icon configuration
 * - Uses SVG for scalable, crisp rendering at all zoom levels
 * - Icon anchor positioned at bottom center for accurate POI location marking
 * - Popup anchor offset above icon to avoid overlap with marker
 * 
 * @BUSINESS_RULE: Consistent branding across all POI map markers
 */
const asterIcon = new L.Icon({
  iconUrl: '/aster-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
})

// MapComponent with proper lifecycle management to handle React StrictMode
const MapComponent = ({ center, zoom, locations, userLocation, onLocationChange, currentPOI, isAtClosest, isAtFarthest, canExpand, onNavigateCloser, onNavigateFarther }: {
  center: [number, number];
  zoom: number;
  locations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    temperature: number;
    condition: string;
    description: string;
    precipitation: number;
    windSpeed: string;
    distance?: number;
  }>;
  userLocation: [number, number] | null;
  onLocationChange: (newPosition: [number, number]) => void;
  currentPOI: any;
  isAtClosest: boolean;
  isAtFarthest: boolean;
  canExpand: boolean;
  onNavigateCloser: () => any;
  onNavigateFarther: () => any;
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Validate center and zoom before creating map
    if (!center || isNaN(center[0]) || isNaN(center[1]) || !zoom || isNaN(zoom)) {
      console.warn('Invalid center or zoom provided to MapComponent:', { center, zoom });
      return;
    }

    // Create new map instance
    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: false
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Cleanup function
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && center && !isNaN(center[0]) && !isNaN(center[1]) && zoom && !isNaN(zoom)) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // TODO: New POI navigation system will be implemented here


  // Add markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;
    
    console.log(`MapComponent received ${locations.length} locations`);
    console.log(`Location IDs: [${locations.slice(0, 5).map(l => l.id).join(', ')}...]`);
    
    // Note: POI system now handles up to 50 markers with distance slicing
    // Old 21-marker limit no longer applies

    // Optimized incremental marker updates (instead of full rebuild)
    const existingMarkerCount = markersRef.current.length;
    const newLocationCount = locations.length;
    
    // If we have fewer locations now, remove excess markers
    if (newLocationCount < existingMarkerCount) {
      for (let i = newLocationCount; i < existingMarkerCount; i++) {
        if (markersRef.current[i]) {
          mapRef.current.removeLayer(markersRef.current[i]);
        }
      }
      // Trim the array
      markersRef.current = markersRef.current.slice(0, newLocationCount);
    }
    
    // If we have more locations now, expand the array
    if (newLocationCount > existingMarkerCount) {
      markersRef.current = [...markersRef.current, ...new Array(newLocationCount - existingMarkerCount)];
    }
    
    console.log(`🔍 MapComponent updating markers: ${existingMarkerCount} -> ${newLocationCount} locations`);

    // Update existing markers and add new ones (incremental approach)
    locations.forEach((location, index) => {
      const existingMarker = markersRef.current[index];
      
      // Check if we need to create a new marker or update existing
      if (!existingMarker || 
          existingMarker.getLatLng().lat !== location.lat || 
          existingMarker.getLatLng().lng !== location.lng) {
        
        // Remove old marker if it exists
        if (existingMarker) {
          mapRef.current.removeLayer(existingMarker);
        }
        
        // Create new marker
        const marker = L.marker([location.lat, location.lng], { icon: asterIcon });
        
        // Track which marker was clicked to sync currentMarkerIndex
        marker.on('popupopen', () => {
          setCurrentMarkerIndex(index);
          // Marker popup opened - navigation is now handled by POI hook
        });
        
        // Create sanitized popup content for marker
        const safeName = escapeHtml(location.name);
        const safeParkType = (location as any).park_type ? escapeHtml((location as any).park_type) : '';
        const safeDescription = escapeHtml(location.description);
        const safeCondition = escapeHtml(location.condition);
        const safeWindSpeed = escapeHtml(location.windSpeed);
        const safeWeatherStation = (location as any).weather_station_name ? escapeHtml((location as any).weather_station_name) : '';
        const safeWeatherDistance = (location as any).weather_distance_miles ? escapeHtml((location as any).weather_distance_miles) : '';
        
        // Sanitize URLs
        const mapsUrl = sanitizeUrl(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`);
        const dnrUrl = sanitizeUrl(`https://www.dnr.state.mn.us/search?terms=${encodeURIComponent(location.name.replace(/\s+/g, '+'))}&filter=all`);
        
        const popupContent = `
        <div class="p-2 text-xs leading-tight">
          <div class="mb-1">
            <h3 class="font-bold text-sm text-black mb-0">${safeName}</h3>
            ${safeParkType ? `<div class="text-xs text-purple-800 font-medium">${safeParkType}</div>` : ''}
            <p class="text-xs text-gray-800 mt-0">${safeDescription}</p>
          </div>
          <div class="bg-gray-100 rounded p-2 mb-2 border">
            <div class="flex justify-between items-center text-xs text-black font-medium" style="gap: 5px">
              <span class="font-bold text-lg text-black">${escapeHtml(location.temperature)}°F</span>
              <span class="text-lg">
                ${safeCondition === 'Sunny' ? '☀️' : 
                  safeCondition === 'Partly Cloudy' ? '⛅' :
                  safeCondition === 'Cloudy' ? '☁️' :
                  safeCondition === 'Overcast' ? '🌫️' :
                  safeCondition === 'Clear' ? '✨' : safeCondition}
              </span>
              <span>💧 ${escapeHtml(location.precipitation)}%</span>
              <span>💨 ${safeWindSpeed}</span>
            </div>
            ${safeWeatherStation ? `<div class="text-xs text-gray-600 mt-1">Weather from ${safeWeatherStation}${safeWeatherDistance ? ` (${safeWeatherDistance} mi)` : ''}</div>` : ''}
          </div>
          <div class="space-y-1">
            <a href="${mapsUrl}" 
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(133, 109, 166, 0.5)">
              🗺️ Driving Directions
            </a>
            <a href="${dnrUrl}"
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(127, 164, 207, 0.5)">
              🌲 MN DNR
            </a>
            ${locations.length > 1 ? `
            <div class="flex space-x-1 mb-1" data-popup-nav="true">
              <button data-nav-action="closer" 
                      ${isAtClosest ? 'disabled' : ''}
                      class="flex-1 text-black text-center py-2 px-2 rounded text-xs font-bold border ${isAtClosest ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-200'}"
                      style="background-color: rgba(76, 175, 80, 0.5)">
                ← Closer
              </button>
              <button data-nav-action="farther" 
                      class="flex-1 text-black text-center py-2 px-2 rounded text-xs font-bold border ${isAtFarthest && !canExpand ? 'opacity-75' : 'hover:bg-green-200'}"
                      style="background-color: rgba(76, 175, 80, 0.5)">
                ${canExpand && isAtFarthest ? '🔍 Expand +30mi' : isAtFarthest && !canExpand ? 'No More →' : 'Farther →'}
              </button>
            </div>
            ` : ''}
          </div>
        </div>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 280, className: "custom-popup" });
        marker.addTo(mapRef.current!);
        
        // Store marker reference for direct popup access - CRITICAL: exact index match
        markersRef.current[index] = marker;
      } else {
        // Marker exists and position hasn't changed - just update popup content if needed
        // This optimization avoids recreating markers unnecessarily
        const existingPopup = existingMarker.getPopup();
        if (existingPopup) {
          // Use the updatePopupContent function for existing markers
          updatePopupContent(index);
        }
      }
    });

  }, [locations]); // Depend on locations changes

  // DISABLED: Navigation functions disabled to prevent thrashing
  useEffect(() => {
    (window as any).navigateToCloser = () => console.log('Navigation disabled');
    (window as any).navigateToFarther = () => console.log('Navigation disabled');
    (window as any).applySuggestion = () => console.log('Navigation disabled');
  }, []);

  // Create user location marker once and update position as needed
  useEffect(() => {
    if (!mapRef.current) return;

    // Create marker only if it doesn't exist and we have valid location
    if (!userMarkerRef.current && userLocation && userLocation[0] !== undefined && userLocation[1] !== undefined &&
        !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
      
      // Use standard cool guy emoji (😎) with white circular background
      const coolGuyIcon = new L.Icon({
        iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="15" fill="white" stroke="#ddd" stroke-width="1"/>
            <text x="20" y="28" text-anchor="middle" font-size="24" font-family="Arial, sans-serif">😎</text>
          </svg>
        `),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });

      const userMarker = L.marker(userLocation, { 
        draggable: true,
        icon: coolGuyIcon
      }) as any;
      userMarker.options.isUserMarker = true;
      
      userMarker.on('dragend', (e: L.LeafletEvent) => {
        const marker = (e as any).target;
        const position = marker.getLatLng();
        if (position && !isNaN(position.lat) && !isNaN(position.lng)) {
          onLocationChange([position.lat, position.lng]);
        }
      });

      // Add popup matching original DraggableUserMarker functionality
      const popupContent = `
        <div class="text-center p-2">
          <div class="text-sm font-bold text-gray-800 mb-1">Our best guess at your location</div>
          <div class="text-xs text-gray-600">Drag and drop for more accuracy</div>
        </div>
      `;
      
      userMarker.bindPopup(popupContent, { className: "custom-popup" });
      userMarker.addTo(mapRef.current!);
      
      // Store reference to the marker
      userMarkerRef.current = userMarker;
    }
    
    // Update existing marker position if it exists and we have valid location
    if (userMarkerRef.current && userLocation && userLocation[0] !== undefined && userLocation[1] !== undefined &&
        !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
      userMarkerRef.current.setLatLng(userLocation);
    }
    
    // Remove marker if location becomes invalid
    if (userMarkerRef.current && (!userLocation || userLocation[0] === undefined || userLocation[1] === undefined ||
        isNaN(userLocation[0]) || isNaN(userLocation[1]))) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  }, [userLocation, onLocationChange]);

  // Function to update popup content with current navigation state
  const updatePopupContent = useCallback((markerIndex: number) => {
    if (markerIndex >= 0 && markerIndex < locations.length && markersRef.current[markerIndex]) {
      const location = locations[markerIndex];
      
      // Create updated popup content with current navigation state (SANITIZED)
      const safeName = escapeHtml(location.name);
      const safeParkType = (location as any).park_type ? escapeHtml((location as any).park_type) : '';
      const safeDescription = escapeHtml(location.description);
      const safeCondition = escapeHtml(location.condition);
      const safeWindSpeed = escapeHtml(location.windSpeed);
      const safeWeatherStation = (location as any).weather_station_name ? escapeHtml((location as any).weather_station_name) : '';
      const safeWeatherDistance = (location as any).weather_distance_miles ? escapeHtml((location as any).weather_distance_miles) : '';
      
      // Sanitize URLs
      const mapsUrl = sanitizeUrl(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`);
      const dnrUrl = sanitizeUrl(`https://www.dnr.state.mn.us/search?terms=${encodeURIComponent(location.name.replace(/\s+/g, '+'))}&filter=all`);
      
      const updatedContent = `
        <div class="p-2 text-xs leading-tight">
          <div class="mb-1">
            <h3 class="font-bold text-sm text-black mb-0">${safeName}</h3>
            ${safeParkType ? `<div class="text-xs text-purple-800 font-medium">${safeParkType}</div>` : ''}
            <p class="text-xs text-gray-800 mt-0">${safeDescription}</p>
          </div>
          <div class="bg-gray-100 rounded p-2 mb-2 border">
            <div class="flex justify-between items-center text-xs text-black font-medium" style="gap: 5px">
              <span class="font-bold text-lg text-black">${escapeHtml(location.temperature)}°F</span>
              <span class="text-lg">
                ${safeCondition === 'Sunny' ? '☀️' : 
                  safeCondition === 'Partly Cloudy' ? '⛅' :
                  safeCondition === 'Cloudy' ? '☁️' :
                  safeCondition === 'Overcast' ? '🌫️' :
                  safeCondition === 'Clear' ? '✨' : safeCondition}
              </span>
              <span>💧 ${escapeHtml(location.precipitation)}%</span>
              <span>💨 ${safeWindSpeed}</span>
            </div>
            ${safeWeatherStation ? `<div class="text-xs text-gray-600 mt-1">Weather from ${safeWeatherStation}${safeWeatherDistance ? ` (${safeWeatherDistance} mi)` : ''}</div>` : ''}
          </div>
          <div class="space-y-1">
            <a href="${mapsUrl}" 
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(133, 109, 166, 0.5)">
              🗺️ Driving Directions
            </a>
            <a href="${dnrUrl}"
               target="_blank" rel="noopener noreferrer"
               class="block w-full text-black text-center py-2 px-2 rounded text-xs font-bold border"
               style="background-color: rgba(127, 164, 207, 0.5)">
              🌲 MN DNR
            </a>
            ${locations.length > 1 ? `
            <div class="flex space-x-1 mb-1" data-popup-nav="true">
              <button data-nav-action="closer" 
                      ${isAtClosest ? 'disabled' : ''}
                      class="flex-1 text-black text-center py-2 px-2 rounded text-xs font-bold border ${isAtClosest ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-200'}"
                      style="background-color: rgba(76, 175, 80, 0.5)">
                ← Closer
              </button>
              <button data-nav-action="farther" 
                      class="flex-1 text-black text-center py-2 px-2 rounded text-xs font-bold border ${isAtFarthest && !canExpand ? 'opacity-75' : 'hover:bg-green-200'}"
                      style="background-color: rgba(76, 175, 80, 0.5)">
                ${canExpand && isAtFarthest ? '🔍 Expand +30mi' : isAtFarthest && !canExpand ? 'No More →' : 'Farther →'}
              </button>
            </div>
            ` : ''}
          </div>
        </div>
      `;
      
      // Update the popup content
      markersRef.current[markerIndex].setPopupContent(updatedContent);
    }
  }, [locations, isAtClosest, isAtFarthest, canExpand]);

  // Set up secure event delegation for navigation buttons (replaces window globals)
  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.matches('[data-nav-action]')) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const action = target.getAttribute('data-nav-action');
      
      if (action === 'closer') {
        const result = onNavigateCloser();
        if (result) {
          console.log('Navigate closer result:', result);
          // Find and open popup for the new current POI with updated content
          const newPOIIndex = locations.findIndex(loc => loc.id === result.id);
          if (newPOIIndex >= 0 && markersRef.current[newPOIIndex]) {
            updatePopupContent(newPOIIndex);
            markersRef.current[newPOIIndex].openPopup();
            
            // Smart centering: only pan if marker is outside current viewport
            const markerLatLng = L.latLng(result.lat, result.lng);
            if (!mapRef.current.getBounds().contains(markerLatLng)) {
              mapRef.current.panTo(markerLatLng);
            }
          }
        }
      } else if (action === 'farther') {
        const result = onNavigateFarther();
        if (result && result !== 'NO_MORE_RESULTS') {
          console.log('Navigate farther result:', result);
          // Find and open popup for the new current POI with updated content
          const newPOIIndex = locations.findIndex(loc => loc.id === result.id);
          if (newPOIIndex >= 0 && markersRef.current[newPOIIndex]) {
            updatePopupContent(newPOIIndex);
            markersRef.current[newPOIIndex].openPopup();
            
            // Smart centering: only pan if marker is outside current viewport
            const markerLatLng = L.latLng(result.lat, result.lng);
            if (!mapRef.current.getBounds().contains(markerLatLng)) {
              mapRef.current.panTo(markerLatLng);
            }
          }
        } else if (result === 'NO_MORE_RESULTS') {
          // Show "that's all the results" notification
          console.log('No more results available');
          showEndOfResultsNotification();
        }
      }
    };
    
    // Add event listener to document for event delegation
    document.addEventListener('click', handleNavigation);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleNavigation);
    };
  }, [onNavigateCloser, onNavigateFarther, locations, updatePopupContent]);
  
  // Custom notification function (extracted for reuse)
  const showEndOfResultsNotification = useCallback(() => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      text-align: center;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #333;">End of Results</h3>
      <p style="margin: 0 0 15px 0; color: #666;">That's all the results we have for this area!</p>
      <button style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">OK</button>
    `;
    
    // Add click handler to OK button
    const okButton = notification.querySelector('button');
    if (okButton) {
      okButton.addEventListener('click', () => {
        notification.remove();
      });
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }, []);

  // Auto-open popup for currentPOI
  useEffect(() => {
    if (currentPOI && markersRef.current.length > 0) {
      const currentPOIIndex = locations.findIndex(loc => loc.id === currentPOI.id);
      
      // Function to handle popup opening and centering
      const openPopupAndCenter = () => {
        if (currentPOIIndex >= 0 && markersRef.current[currentPOIIndex]) {
          console.log(`🎯 Auto-opening popup for currentPOI: ${currentPOI.name} (index ${currentPOIIndex})`);
          
          // Smart centering: check if marker is outside current viewport and center first
          const markerLatLng = L.latLng(currentPOI.lat, currentPOI.lng);
          if (mapRef.current && !mapRef.current.getBounds().contains(markerLatLng)) {
            console.log(`📍 Centering map on ${currentPOI.name} (outside viewport) - lat: ${currentPOI.lat}, lng: ${currentPOI.lng}`);
            mapRef.current.panTo(markerLatLng);
            
            // Wait for pan animation to complete before opening popup
            setTimeout(() => {
              updatePopupContent(currentPOIIndex);
              markersRef.current[currentPOIIndex].openPopup();
            }, 300);
          } else {
            console.log(`📍 ${currentPOI.name} already in viewport - opening popup immediately`);
            updatePopupContent(currentPOIIndex);
            markersRef.current[currentPOIIndex].openPopup();
          }
        } else if (currentPOIIndex >= 0) {
          // Marker not ready yet, retry after brief delay
          console.log(`⏳ Marker ${currentPOIIndex} not ready, retrying in 100ms...`);
          setTimeout(openPopupAndCenter, 100);
        }
      };
      
      openPopupAndCenter();
    }
  }, [currentPOI, locations, updatePopupContent]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};

// PrairieAster.Ai theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#7563A8',
    },
    secondary: {
      main: '#4FC3F7',
    },
  },
})

interface WeatherFilters {
  temperature: string
  precipitation: string  
  wind: string
}

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  temperature: number
  condition: string
  description: string
  precipitation: number // 0-100 scale (0 = clear, 100 = heavy rain/snow)
  windSpeed: number     // mph
}

// Weather locations now fetched from database via API

export default function App() {
  // Simplified state with new POI navigation system
  const [filters, setFilters] = useState<WeatherFilters>({
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  })
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.7296, -94.6859]) // Default to Minnesota
  const [mapZoom, setMapZoom] = useState(7)
  const [userLocation, setUserLocationState] = useState<[number, number] | null>([46.7296, -94.6859]) // Start with Minnesota center
  const [showLocationPrompt, setShowLocationPrompt] = useState(false) // Show location selection prompt
  
  const setUserLocation = (location: [number, number] | null) => {
    console.log('setUserLocation called with:', location)
    setUserLocationState(location)
  }
  const locationInitialized = useRef(false)
  const currentApiLocationsRef = useRef<Location[]>([])
  const currentFilteredLocationsRef = useRef<Location[]>([])

  // Fetch POI locations with weather from unified API (base search)
  // New POI navigation system - single API call with distance slicing
  const {
    visiblePOIs,
    currentPOI,
    allPOICount,
    currentSliceMax,
    loading: poiLoading,
    error: poiError,
    isAtClosest,
    isAtFarthest,
    canExpand,
    navigateCloser,
    navigateFarther,
    reload: reloadPOIs
  } = usePOINavigation(userLocation, filters)

  // Use POI data from new navigation hook
  const apiLocations = React.useMemo(() => {
    console.log(`POI locations: ${allPOICount} total, ${visiblePOIs.length} visible within ${currentSliceMax}mi`)
    console.log(`Loading: ${poiLoading}, Error: ${poiError}`)
    console.log(`User location:`, userLocation)
    
    // Update the refs with current locations for compatibility  
    currentApiLocationsRef.current = visiblePOIs
    currentFilteredLocationsRef.current = visiblePOIs
    
    return visiblePOIs
  }, [visiblePOIs, allPOICount, currentSliceMax, poiLoading, poiError, userLocation])

  /**
   * RELATIVE WEATHER FILTERING ALGORITHM
   * @CLAUDE_CONTEXT: Core business logic for weather-based location discovery
   * 
   * BUSINESS LOGIC: Intelligent filtering based on current weather conditions
   * - Avoids absolute thresholds that become meaningless across seasons
   * - Provides meaningful "cold/mild/hot" relative to what's actually available
   * - Ensures users always get results relevant to current weather patterns
   * - Supports outdoor activity planning with relative weather preferences
   * 
   * TECHNICAL IMPLEMENTATION: Percentile-based filtering system
   * - Sorts all available weather data to establish relative thresholds
   * - Uses percentile ranges to define "cold", "mild", "hot" dynamically
   * - Maintains consistent result distribution regardless of season
   * - Prevents empty result sets by adapting to available data
   * 
   * BUSINESS RULE: Always provide actionable weather options to users
   * - "Cold" = Coldest 20% of available locations
   * - "Mild" = Middle 60% of available locations  
   * - "Hot" = Hottest 20% of available locations
   * - Same logic applies to precipitation and wind conditions
   * 
   * @BUSINESS_RULE: Relative filtering ensures seasonal relevance
   * @PERFORMANCE_CRITICAL: Efficient sorting and filtering for real-time UI updates
   */
  /**
   * SIMPLE WEATHER FILTERING - STABLE IMPLEMENTATION
   * 
   * ⚠️  STOP RULES - DO NOT VIOLATE:
   * 1. DO NOT MODIFY FILTER PERCENTAGES TO "SHOW MORE RESULTS"
   * 2. DO NOT RECALCULATE THRESHOLDS DURING RADIUS EXPANSION
   * 3. DO NOT CHANGE FILTERING LOGIC TO "IMPROVE" RESULTS
   * 
   * CRITICAL BEHAVIOR: During radius expansion, thresholds are calculated from
   * BASE locations only (not expanded set) to ensure original results remain visible.
   * This prevents the confusing UX where expanding radius causes locations to disappear.
   * 
   * @BUSINESS_RULE: Filter thresholds must remain constant during radius expansion
   * @UX_RULE: Original filtered locations must remain visible after expansion
   * @TECHNICAL_IMPLEMENTATION: useBaseForThresholds=true during expansion
   */
  const applyWeatherFilters = (locations: Location[], filters: WeatherFilters, maxDistance?: number): Location[] => {
    if (locations.length === 0) return []
    
    let filtered = [...locations]
    console.log(`🎯 WEATHER FILTERING: ${locations.length} locations → applying filters`)
    
    // DISTANCE FILTERING - Apply distance constraint if provided
    if (maxDistance && userLocation) {
      const startCount = filtered.length
      filtered = filtered.filter(loc => {
        const distance = calculateDistance(userLocation, [loc.lat, loc.lng])
        return distance <= maxDistance
      })
      console.log(`📏 Distance filter: ${startCount} → ${filtered.length} locations within ${maxDistance} miles`)
    }

    // TEMPERATURE FILTERING
    // DO NOT ADJUST THESE PERCENTAGES - they determine what "mild/cold/hot" means
    if (filters.temperature && filters.temperature.length > 0) {
      // Use all locations for calculating thresholds
      const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b)
      const tempCount = temps.length
      
      if (filters.temperature === 'cold') {
        // Show coldest 40% of available temperatures
        const threshold = temps[Math.floor(tempCount * 0.4)]
        filtered = filtered.filter(loc => loc.temperature <= threshold)
        console.log(`❄️  Cold filter: temps ≤ ${threshold}°F`)
      } else if (filters.temperature === 'hot') {
        // Show hottest 40% of available temperatures  
        const threshold = temps[Math.floor(tempCount * 0.6)]
        filtered = filtered.filter(loc => loc.temperature >= threshold)
        console.log(`🔥 Hot filter: temps ≥ ${threshold}°F`)
      } else if (filters.temperature === 'mild') {
        // Show middle 80% of temperatures (exclude extreme 10% on each end)
        const minThreshold = temps[Math.floor(tempCount * 0.1)]
        const maxThreshold = temps[Math.floor(tempCount * 0.9)]
        filtered = filtered.filter(loc => loc.temperature >= minThreshold && loc.temperature <= maxThreshold)
        console.log(`🌤️  Mild filter: temps ${minThreshold}°F - ${maxThreshold}°F`)
      }
    }

    // PRECIPITATION FILTERING
    // DO NOT ADJUST THESE PERCENTAGES - they determine what "dry/light/heavy" means
    if (filters.precipitation && filters.precipitation.length > 0) {
      const precips = locations.map(loc => loc.precipitation).sort((a, b) => a - b)
      const precipCount = precips.length
      
      if (filters.precipitation === 'none') {
        // Show driest 60% of available locations
        const threshold = precips[Math.floor(precipCount * 0.6)]
        filtered = filtered.filter(loc => loc.precipitation <= threshold)
        console.log(`☀️  No precip filter: precip ≤ ${threshold}%`)
      } else if (filters.precipitation === 'light') {
        // Show middle precipitation range (20th-70th percentile)
        const minThreshold = precips[Math.floor(precipCount * 0.2)]
        const maxThreshold = precips[Math.floor(precipCount * 0.7)]
        filtered = filtered.filter(loc => loc.precipitation >= minThreshold && loc.precipitation <= maxThreshold)
        console.log(`🌦️  Light precip filter: precip ${minThreshold}% - ${maxThreshold}%`)
      } else if (filters.precipitation === 'heavy') {
        // Show wettest 30% of available locations
        const threshold = precips[Math.floor(precipCount * 0.7)]
        filtered = filtered.filter(loc => loc.precipitation >= threshold)
        console.log(`🌧️  Heavy precip filter: precip ≥ ${threshold}%`)
      }
    }

    // WIND FILTERING  
    // DO NOT ADJUST THESE PERCENTAGES - they determine what "calm/breezy/windy" means
    if (filters.wind && filters.wind.length > 0) {
      const winds = locations.map(loc => loc.windSpeed).sort((a, b) => a - b)
      const windCount = winds.length
      
      if (filters.wind === 'calm') {
        // Show calmest 50% of available locations
        const threshold = winds[Math.floor(windCount * 0.5)]
        filtered = filtered.filter(loc => loc.windSpeed <= threshold)
        console.log(`🍃 Calm filter: wind ≤ ${threshold}mph`)
      } else if (filters.wind === 'breezy') {
        // Show middle wind range (30th-70th percentile)
        const minThreshold = winds[Math.floor(windCount * 0.3)]
        const maxThreshold = winds[Math.floor(windCount * 0.7)]
        filtered = filtered.filter(loc => loc.windSpeed >= minThreshold && loc.windSpeed <= maxThreshold)
        console.log(`💨 Breezy filter: wind ${minThreshold} - ${maxThreshold}mph`)
      } else if (filters.wind === 'windy') {
        // Show windiest 30% of available locations
        const threshold = winds[Math.floor(windCount * 0.7)]
        filtered = filtered.filter(loc => loc.windSpeed >= threshold)
        console.log(`🌪️  Windy filter: wind ≥ ${threshold}mph`)
      }
    }

    // Return empty array if no matches - let radius expansion find more locations
    if (filtered.length === 0) {
      console.log(`⚠️ No results after filtering within current radius`)
      return []
    }

    console.log(`✅ Filter results: ${locations.length} → ${filtered.length} locations`)
    
    // DEBUG: Total marker count validation
    if (filtered.length > 21) {
      console.error(`🚨 ERROR: Displaying ${filtered.length} markers but only 21 POI should match sensible defaults!`)
      console.error(`🚨 This indicates a filtering or data issue - investigate immediately`)
      console.error(`🚨 Locations passing filter:`, filtered.map(loc => `${loc.name} (${loc.temperature}°F, ${loc.precipitation}%, ${loc.windSpeed}mph)`))
    } else {
      console.log(`📍 Total markers to display: ${filtered.length} (Expected max: 21 POI)`)
    }
    
    return filtered
  }

  // Helper function to calculate dynamic center and zoom from user location + closest 5 results
  const calculateDynamicMapView = useCallback((filtered: Location[], userPos: [number, number] | null): { center: [number, number], zoom: number } => {
    if (!userPos || filtered.length === 0) {
      return { center: [46.7296, -94.6859], zoom: 15 } // Default Minnesota center (12 + 30% = ~15)
    }
    
    // Calculate distances from user location to all results
    const distancesWithLocations = filtered.map(location => {
      const latDiff = location.lat - userPos[0]
      const lngDiff = location.lng - userPos[1]
      return {
        distance: Math.sqrt(latDiff * latDiff + lngDiff * lngDiff),
        location
      }
    })
    
    // Sort by distance (closest first)
    distancesWithLocations.sort((a, b) => a.distance - b.distance)
    
    // Get the closest 5 results (or all if less than 5)
    const targetCount = Math.min(5, filtered.length)
    const closestResults = distancesWithLocations.slice(0, targetCount)
    
    // Calculate bounds including user location and closest 5 results
    const allLats = [userPos[0], ...closestResults.map(r => r.location.lat)]
    const allLngs = [userPos[1], ...closestResults.map(r => r.location.lng)]
    
    const minLat = Math.min(...allLats)
    const maxLat = Math.max(...allLats)
    const minLng = Math.min(...allLngs)
    const maxLng = Math.max(...allLngs)
    
    // Calculate dynamic center that optimizes the view of user + closest results
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // Calculate the geographic spread for zoom optimization
    const latRange = maxLat - minLat
    const lngRange = maxLng - minLng
    const maxRange = Math.max(latRange, lngRange)
    
    // Minimal padding factor for edge visibility - maximum zoom while keeping all points visible
    const paddedRange = maxRange * 1.1
    
    // Convert range to zoom level - granular increments for precise control
    let zoom = 18 // Start with maximum zoom
    if (paddedRange > 0.008) zoom = 17.5   // Ultra-fine adjustment
    if (paddedRange > 0.012) zoom = 17     // Extremely close grouping
    if (paddedRange > 0.018) zoom = 16.5   // Fine adjustment
    if (paddedRange > 0.025) zoom = 16     // Very close grouping
    if (paddedRange > 0.035) zoom = 15.5   // Fine adjustment
    if (paddedRange > 0.050) zoom = 15     // Close grouping
    if (paddedRange > 0.070) zoom = 14.5   // Fine adjustment
    if (paddedRange > 0.095) zoom = 14     // Medium-close grouping
    if (paddedRange > 0.125) zoom = 13.5   // Fine adjustment
    if (paddedRange > 0.165) zoom = 13     // Medium grouping
    if (paddedRange > 0.220) zoom = 12.5   // Fine adjustment
    if (paddedRange > 0.290) zoom = 12     // Medium-wide grouping
    if (paddedRange > 0.380) zoom = 11.5   // Fine adjustment
    if (paddedRange > 0.500) zoom = 11     // Wide grouping
    if (paddedRange > 0.650) zoom = 10.5   // Fine adjustment
    if (paddedRange > 0.850) zoom = 10     // Very wide grouping
    if (paddedRange > 1.100) zoom = 9.5    // Fine adjustment
    if (paddedRange > 1.450) zoom = 9      // Extra wide grouping
    if (paddedRange > 1.900) zoom = 8.5    // Fine adjustment
    if (paddedRange > 2.500) zoom = 8      // Continental grouping
    
    return { center: [centerLat, centerLng], zoom }
  }, [])

  // Helper function to update map view - uses dynamic center calculation
  const updateMapView = useCallback((filtered: Location[]) => {
    if (userLocation) {
      // When user location exists, use dynamic center calculation
      const { center, zoom } = calculateDynamicMapView(filtered, userLocation)
      setMapCenter(center)
      setMapZoom(zoom)
    } else if (filtered.length > 0) {
      // No user location - fit all markers with geographic bounds
      const lats = filtered.map(loc => loc.lat)
      const lngs = filtered.map(loc => loc.lng)
      
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      
      // Calculate center
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      setMapCenter([centerLat, centerLng])
      
      // Calculate zoom to fit all markers with padding
      const latRange = maxLat - minLat
      const lngRange = maxLng - minLng
      const maxRange = Math.max(latRange, lngRange)
      
      // Dynamic zoom based on geographic spread
      let zoom = 9 // default higher zoom
      if (maxRange < 0.1) zoom = 12      // Very close
      else if (maxRange < 0.5) zoom = 10  // Close
      else if (maxRange < 1.0) zoom = 9   // Medium spread
      else if (maxRange < 2.0) zoom = 8   // Wide spread
      else if (maxRange < 5.0) zoom = 7   // Very wide spread
      else zoom = 6                       // Continental spread
      
      setMapZoom(zoom)
    }
  }, [userLocation, calculateDynamicMapView])

  // Comprehensive location strategy: geolocation → IP → fallback position
  useEffect(() => {
    // Prevent re-initialization if already done
    if (locationInitialized.current) {
      return
    }

    // Wait for initial API data before attempting location initialization
    if (apiLocations.length === 0) {
      return
    }

    locationInitialized.current = true

    const getLocationFromIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        if (data.latitude && data.longitude) {
          const ipLocation: [number, number] = [data.latitude, data.longitude]
          setUserLocation(ipLocation)
          setMapCenter(ipLocation)
          setShowLocationPrompt(false)
          // Location set from IP
          return true
        }
      } catch {
        // IP location failed
      }
      return false
    }

    const setFallbackLocation = () => {
      // Center on available results and place marker there with popup open
      const lats = apiLocations.map(loc => loc.lat)
      const lngs = apiLocations.map(loc => loc.lng)
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
      const fallbackLocation: [number, number] = [centerLat, centerLng]
      setUserLocation(fallbackLocation)
      setMapCenter(fallbackLocation)
      setShowLocationPrompt(true) // Show popup to prompt user to move marker
      // Location set to results center (fallback)
    }

    const initializeLocation = async () => {
      // Start with IP location (no user gesture required) to avoid geolocation violation
      // Geolocation will be triggered by user interaction (e.g., "Find My Location" button)
      const ipSuccess = await getLocationFromIP()
      if (!ipSuccess) {
        // Keep the default location and show prompt to move marker
        setShowLocationPrompt(true)
      }
    }

    initializeLocation()
  }, []) // Run once on mount

  // User-triggered geolocation (for "Find My Location" button or similar)
  // Available for future use
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude]
          setUserLocation(userPos)
          setMapCenter(userPos)
          setShowLocationPrompt(false)
          // DEBUG: Confirm successful geolocation for UX flow validation and user-triggered location requests
          console.log('Location set from user-requested geolocation')
        },
        (error) => {
          // DEBUG: Track geolocation failures to measure user-triggered location request success rate
          console.log('User-requested geolocation failed:', error.message)
          // Could show a user-friendly error message here
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    }
  }
  
  // Keep the function available for future features
  if (false) requestUserLocation()

  // Apply filters when user location or API data changes
  useEffect(() => {
    // Wait for API data to load before any map calculations
    if (apiLocations.length === 0) {
      return
    }

    if (userLocation === null) {
      // No user location yet - apply default filters to show good variety of locations
      // New system: POI hook handles all filtering and distance constraints
      const filtered = visiblePOIs
      
      // Use smarter zoom calculation for filtered markers
      if (filtered.length > 0) {
        // For Minnesota weather platform, show regional context with all filtered markers
        // Use all filtered markers to provide comprehensive regional view
        const markersToShow = filtered
        
        const lats = markersToShow.map(loc => loc.lat)
        const lngs = markersToShow.map(loc => loc.lng)
        
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        
        // Calculate center of the closest markers
        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2
        setMapCenter([centerLat, centerLng])
        
        // Use tighter zoom calculation for initial view focused on marker cluster
        const latRange = maxLat - minLat
        const lngRange = maxLng - minLng
        const maxRange = Math.max(latRange, lngRange)
        
        // Use appropriate padding for regional Minnesota view
        const paddedRange = Math.max(maxRange * 1.2, 0.5) // Ensure good regional context for Minnesota
        
        // Use zoom levels optimized for Minnesota regional weather view
        let zoom = 8 // Start with regional view for statewide weather
        if (paddedRange < 4.0) zoom = 8   // Statewide view
        if (paddedRange < 3.0) zoom = 8.5 // Large regional view  
        if (paddedRange < 2.0) zoom = 9   // Regional view
        if (paddedRange < 1.5) zoom = 9.5 // Sub-regional view
        if (paddedRange < 1.0) zoom = 10  // Multi-city view
        if (paddedRange < 0.7) zoom = 10.5
        if (paddedRange < 0.5) zoom = 11  // City cluster view
        if (paddedRange < 0.3) zoom = 11.5
        if (paddedRange < 0.2) zoom = 12  // Close cluster view
        if (paddedRange < 0.1) zoom = 13  // Very close markers
        
        setMapZoom(zoom)
        
        // Give markers time to render, then ensure they're visible
        setTimeout(() => {
          // DEBUG: Map viewport debugging for responsive design issues and marker visibility problems
          console.log('Zoom fix active:', zoom, 'Center:', centerLat.toFixed(3), centerLng.toFixed(3))
          setMapCenter([centerLat, centerLng])
          setMapZoom(zoom)
        }, 100)
      }
    } else {
      // User location available - use POI hook data (already filtered)
      // New system: POI hook handles all filtering and distance constraints
      const filtered = visiblePOIs
      console.log(`POI hook locations: ${allPOICount} total, ${filtered.length} visible within ${currentSliceMax}mi`)
      
      // Filtered locations now managed by POI hook directly
      
      // Update map center to show current POI locations
      const { center, zoom } = calculateDynamicMapView(filtered, userLocation)
      setMapCenter(center)
      setMapZoom(zoom)
    }
    
    // Map ready state now managed by POI hook
  }, [userLocation, filters, apiLocations, calculateDynamicMapView])

  // TODO: New suggestion application logic will be implemented here

  const handleFilterChange = (category: keyof WeatherFilters, value: string) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    
    // POI hook will automatically reload with new filters
    // Filters will trigger POI hook reload automatically
    console.log(`Filter change: POI hook will reload with new filters`)
    
    // Use consistent dynamic center calculation for all scenarios
    if (userLocation) {
      // User location exists - use dynamic center for optimal view of results
      const { center, zoom } = calculateDynamicMapView(filtered, userLocation)
      setMapCenter(center)
      setMapZoom(zoom)
    } else {
      // No user location - fit all markers using geographic bounds
      updateMapView(filtered)
    }
  }

  const handleUserLocationChange = (newPosition: [number, number]) => {
    // DEBUG: User location change tracking for state management and map interaction validation
    console.log('handleUserLocationChange called with:', newPosition)
    setUserLocation(newPosition)
    setShowLocationPrompt(false) // User has moved the marker, so hide the prompt
    // Distance and expansion now managed by POI hook automatically
    // POI hook will automatically reload with new user location
    
    // POI hook will reload automatically with new user location
    console.log(`User location change: POI hook will reload data`)
    
    // Location change resets expansion state
    
    // Use dynamic center calculation for optimal view of user + closest results
    const { center, zoom } = calculateDynamicMapView(filtered, newPosition)
    setMapCenter(center)
    setMapZoom(zoom)
  }

  // Function to expand display distance (no API calls needed)
  // TODO: New expansion logic will be implemented here

  // TODO: New suggestion system will be implemented here

  // TODO: New navigation and popup system will be implemented here

  // TODO: New no-results handling will be implemented here

  // TODO: All expansion and navigation logic now handled by usePOINavigation hook

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="h-screen w-screen flex flex-col" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>

        {/* Loading State */}
        {poiLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[2000]">
            <div className="flex flex-col items-center space-y-4">
              <CircularProgress size={48} sx={{ color: '#7563A8' }} />
              <div className="text-lg font-medium text-gray-700">Loading weather locations...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {poiError && !poiLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000] max-w-md">
            <Alert 
              severity="error" 
              action={
                <button 
                  onClick={reloadPOIs}
                  className="text-sm font-medium underline text-red-800 hover:text-red-900"
                >
                  Retry
                </button>
              }
            >
              Failed to load weather data: {poiError}
            </Alert>
          </div>
        )}

        {/* Location Prompt */}
        {showLocationPrompt && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[2000] max-w-md">
            <Alert 
              severity="info"
              action={
                <button 
                  onClick={() => setShowLocationPrompt(false)}
                  className="text-sm font-medium underline text-blue-800 hover:text-blue-900"
                >
                  Dismiss
                </button>
              }
            >
              Drag the blue marker to your location for personalized weather recommendations
            </Alert>
          </div>
        )}

        {/* Map Container - Full height, no padding, seamless with footer */}
        <div className="flex-1 relative" style={{ zIndex: 1003 }}>
          <MapComponent
            center={mapCenter}
            zoom={mapZoom}
            locations={visiblePOIs}
            userLocation={userLocation}
            onLocationChange={handleUserLocationChange}
            currentPOI={currentPOI}
            isAtClosest={isAtClosest}
            isAtFarthest={isAtFarthest}
            canExpand={canExpand}
            onNavigateCloser={navigateCloser}
            onNavigateFarther={navigateFarther}
          />

          {/* FAB Filter System - top right, expanding left */}
          <div className="absolute top-6 right-6 z-[1000]">
            <FabFilterSystem
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Feedback FAB - positioned above footer, responsive to footer size */}
          <div className="absolute right-6 z-[1000]" style={{ 
            bottom: window.innerWidth < 600 ? 'max(calc(5.6vh + 8px), 50px)' : 'max(calc(6vh + 8px), 58px)'
          }}>
            <FeedbackFab />
          </div>
        </div>

        {/* Unified Sticky Footer */}
        <UnifiedStickyFooter />
      </div>
    </ThemeProvider>
  )
}// ATTEMPT 3: Force frontend cache refresh $(date +%s)
