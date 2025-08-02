/**
 * POI Navigation Hook - Clean algorithm implementation
 * 
 * Manages distance-based POI slicing, localStorage caching, and atomic navigation
 * Based on the anti-thrashing algorithm:
 * 1. Single API call with 50 results limit
 * 2. Distance-based slicing (0-30mi, 30-60mi, 60-90mi...)  
 * 3. Sequential navigation from closest to farthest
 * 4. Click throttling to prevent rapid clicking issues
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Data structures
export interface POIWithMetadata {
  id: string;
  name: string;
  lat: number; 
  lng: number;
  temperature: number;
  precipitation: number;
  windSpeed: string;
  condition: string;
  description: string;
  
  // Calculated metadata
  distance: number; // Pre-calculated from user location
  displayed: boolean; // Has this been shown to user?
  sliceIndex: number; // Which 30mi slice (0=0-30mi, 1=30-60mi, etc)
}

export interface POINavigationState {
  allPOIs: POIWithMetadata[]; // All 50 from API
  visiblePOIs: POIWithMetadata[]; // Current visible subset
  currentSliceMax: number; // Current max distance (30, 60, 90...)
  currentPOIIndex: number; // Index in visible POIs array
  lastClickTime: number; // For throttling
  isAtClosest: boolean;
  isAtFarthest: boolean;
  canExpand: boolean;
}

interface WeatherFilters {
  temperature: string;
  precipitation: string; 
  wind: string;
}

const STORAGE_KEY = 'poi-navigation-cache';
const DISTANCE_SLICE_SIZE = 30; // 30 mile slices
const CLICK_THROTTLE_MS = 500; // 0.5 second throttling
const MAX_RESULTS = 50; // Hard-coded API limit

export const usePOINavigation = (
  userLocation: [number, number] | null,
  filters: WeatherFilters
) => {
  const [state, setState] = useState<POINavigationState>({
    allPOIs: [],
    visiblePOIs: [],
    currentSliceMax: DISTANCE_SLICE_SIZE, // Start with 0-30mi
    currentPOIIndex: 0,
    lastClickTime: 0,
    isAtClosest: false,
    isAtFarthest: false,
    canExpand: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for preventing duplicate API calls
  const lastAPICallRef = useRef<{
    location: string;
    filters: string;
    timestamp: number;
  } | null>(null);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((point1: [number, number], point2: [number, number]) => {
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
  }, []);

  // Pre-process API data with distance calculations and metadata
  const processAPIData = useCallback((apiData: any[], userLoc: [number, number]) => {
    const processed = apiData.map((location, index) => {
      const distance = calculateDistance(userLoc, [location.lat, location.lng]);
      const sliceIndex = Math.floor(distance / DISTANCE_SLICE_SIZE);
      
      return {
        id: location.id,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        temperature: location.temperature,
        precipitation: location.precipitation,
        windSpeed: location.windSpeed,
        condition: location.condition,
        description: location.description,
        distance,
        displayed: false, // Initially not displayed
        sliceIndex
      } as POIWithMetadata;
    });

    // Sort by distance (closest first) with alphabetical secondary sort
    return processed.sort((a, b) => {
      if (Math.abs(a.distance - b.distance) < 0.01) { // Same distance (within 0.01 miles)
        return a.name.localeCompare(b.name);
      }
      return a.distance - b.distance;
    });
  }, [calculateDistance]);

  // Distance-based slicer - returns only visible subset
  const getVisiblePOIs = useCallback((allPOIs: POIWithMetadata[], maxDistance: number) => {
    return allPOIs.filter(poi => poi.distance <= maxDistance);
  }, []);

  // Check if we can expand (more POIs available beyond current slice)
  const checkCanExpand = useCallback((allPOIs: POIWithMetadata[], currentMax: number) => {
    return allPOIs.some(poi => poi.distance > currentMax);
  }, []);

  // Click throttling check
  const isClickAllowed = useCallback(() => {
    const now = Date.now();
    return (now - state.lastClickTime) >= CLICK_THROTTLE_MS;
  }, [state.lastClickTime]);

  // Load POI data (single API call)
  const loadPOIData = useCallback(async (force = false) => {
    if (!userLocation) return;

    // Cache key for preventing duplicate calls
    const locationKey = `${userLocation[0].toFixed(4)},${userLocation[1].toFixed(4)}`;
    const filtersKey = JSON.stringify(filters);
    const now = Date.now();

    // Check if we recently made the same call (prevent thrashing)
    if (!force && lastAPICallRef.current) {
      const { location, filters: lastFilters, timestamp } = lastAPICallRef.current;
      const timeSinceLastCall = now - timestamp;
      
      if (location === locationKey && lastFilters === filtersKey && timeSinceLastCall < 5000) {
        console.log('🚫 Skipping duplicate API call (made same call <5s ago)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Single API call - this is the ONLY query for POI  
      const params = new URLSearchParams({
        lat: userLocation[0].toString(),
        lng: userLocation[1].toString(),
        limit: MAX_RESULTS.toString(),
        temperature: filters.temperature,
        precipitation: filters.precipitation, 
        wind: filters.wind
      });

      const response = await fetch(`/api/poi-locations-with-weather?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid API response format');
      }

      // Process and cache the data
      const processedPOIs = processAPIData(data.data, userLocation);
      const visiblePOIs = getVisiblePOIs(processedPOIs, DISTANCE_SLICE_SIZE);
      
      // Cache in localStorage
      const cacheData = {
        location: locationKey,
        filters: filtersKey,
        timestamp: now,
        pois: processedPOIs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

      // Update cache reference
      lastAPICallRef.current = { location: locationKey, filters: filtersKey, timestamp: now };

      // Update state
      setState(prevState => ({
        ...prevState,
        allPOIs: processedPOIs,
        visiblePOIs,
        currentSliceMax: DISTANCE_SLICE_SIZE,
        currentPOIIndex: 0, // Start with closest
        isAtClosest: true,
        isAtFarthest: visiblePOIs.length <= 1,
        canExpand: checkCanExpand(processedPOIs, DISTANCE_SLICE_SIZE)
      }));

      console.log(`📍 Loaded ${processedPOIs.length} POIs, showing ${visiblePOIs.length} within ${DISTANCE_SLICE_SIZE}mi`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load POI data';
      setError(errorMessage);
      console.error('POI loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters, processAPIData, getVisiblePOIs, checkCanExpand]);

  // Navigate to closer POI
  const navigateCloser = useCallback(() => {
    if (!isClickAllowed()) {
      console.log('🚫 Click throttled');
      return null;
    }

    const { visiblePOIs, currentPOIIndex } = state;
    
    if (currentPOIIndex === 0) {
      console.log('📍 Already at closest POI');
      return null; // Already at closest
    }

    const newIndex = currentPOIIndex - 1;
    
    setState(prevState => ({
      ...prevState,
      currentPOIIndex: newIndex,
      lastClickTime: Date.now(),
      isAtClosest: newIndex === 0,
      isAtFarthest: false
    }));

    console.log(`📍 Navigate closer: ${currentPOIIndex} -> ${newIndex}`);
    return visiblePOIs[newIndex];
  }, [state, isClickAllowed]);

  // Navigate to farther POI (with expansion logic)
  const navigateFarther = useCallback(() => {
    if (!isClickAllowed()) {
      console.log('🚫 Click throttled');
      return null;
    }

    const { visiblePOIs, currentPOIIndex, allPOIs, currentSliceMax } = state;
    
    // Check if we're at the last visible POI
    if (currentPOIIndex >= visiblePOIs.length - 1) {
      // At farthest visible POI - try to expand
      if (checkCanExpand(allPOIs, currentSliceMax)) {
        console.log(`📍 Expanding from ${currentSliceMax}mi to ${currentSliceMax + DISTANCE_SLICE_SIZE}mi`);
        return expandDistanceSlice();
      } else {
        console.log('📍 No more POIs to show');
        return 'NO_MORE_RESULTS'; // Special return value
      }
    }

    // Normal farther navigation
    const newIndex = currentPOIIndex + 1;
    
    setState(prevState => ({
      ...prevState,
      currentPOIIndex: newIndex,
      lastClickTime: Date.now(),
      isAtClosest: false,
      isAtFarthest: newIndex >= visiblePOIs.length - 1 && !checkCanExpand(allPOIs, currentSliceMax)
    }));

    console.log(`📍 Navigate farther: ${currentPOIIndex} -> ${newIndex}`);
    return visiblePOIs[newIndex];
  }, [state, isClickAllowed, checkCanExpand]);

  // Expand distance slice by 30 miles
  const expandDistanceSlice = useCallback(() => {
    const { allPOIs, currentSliceMax } = state;
    const newSliceMax = currentSliceMax + DISTANCE_SLICE_SIZE;
    const newVisiblePOIs = getVisiblePOIs(allPOIs, newSliceMax);
    
    // Find the closest NEW POI (the first one in the new slice)
    const previousVisibleCount = state.visiblePOIs.length;
    const newPOIsStartIndex = previousVisibleCount;
    
    setState(prevState => ({
      ...prevState,
      visiblePOIs: newVisiblePOIs,
      currentSliceMax: newSliceMax,
      currentPOIIndex: newPOIsStartIndex, // Jump to closest new POI
      lastClickTime: Date.now(),
      isAtClosest: false,
      isAtFarthest: newPOIsStartIndex >= newVisiblePOIs.length - 1 && !checkCanExpand(allPOIs, newSliceMax),
      canExpand: checkCanExpand(allPOIs, newSliceMax)
    }));

    console.log(`🔍 Expanded to ${newSliceMax}mi: ${previousVisibleCount} -> ${newVisiblePOIs.length} POIs`);
    return newVisiblePOIs[newPOIsStartIndex] || null;
  }, [state, getVisiblePOIs, checkCanExpand]);

  // Load data when location or filters change
  useEffect(() => {
    if (userLocation) {
      loadPOIData();
    }
  }, [userLocation, filters, loadPOIData]);

  // Return the hook interface
  return {
    // Data
    visiblePOIs: state.visiblePOIs,
    currentPOI: state.visiblePOIs[state.currentPOIIndex] || null,
    allPOICount: state.allPOIs.length,
    currentSliceMax: state.currentSliceMax,
    
    // State flags
    loading,
    error,
    isAtClosest: state.isAtClosest,
    isAtFarthest: state.isAtFarthest,
    canExpand: state.canExpand,
    
    // Actions
    navigateCloser,
    navigateFarther,
    reload: () => loadPOIData(true)
  };
};