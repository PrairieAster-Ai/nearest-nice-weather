/**
 * ========================================================================
 * ENHANCED LOCATION MANAGER - IMPROVED USER POSITIONING SYSTEM
 * ========================================================================
 * 
 * 📋 PURPOSE: Advanced location management with accuracy improvements
 * 🎯 ACCURACY FOCUS: Multiple fallback strategies for maximum precision
 * 🔒 PRIVACY-AWARE: Transparent permission handling and user control
 * ⚡ PERFORMANCE: Optimized for fast initial load with progressive enhancement
 * 
 * IMPROVEMENTS OVER ORIGINAL:
 * ✅ Multiple location providers with automatic fallback
 * ✅ Accuracy scoring and best estimate selection
 * ✅ Progressive enhancement (fast → accurate)
 * ✅ User permission state tracking
 * ✅ Location confidence indicators for UI
 * ✅ Manual location override capabilities
 * ✅ Comprehensive error handling and recovery
 * 
 * @CLAUDE_CONTEXT: Enhanced location intelligence for personalized outdoor discovery
 * @BUSINESS_RULE: P0 MUST provide location within 10 seconds with accuracy indicators
 * @INTEGRATION_POINT: Uses UserLocationEstimator service for location intelligence
 * @PERFORMANCE_CRITICAL: See /src/config/PERFORMANCE-REQUIREMENTS.json
 * 
 * LAST UPDATED: 2025-08-08
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  useUserLocationStorage, 
  useLocationMethodStorage, 
  useShowLocationPromptStorage,
  LocationMethod 
} from '../hooks/useLocalStorageState';
import { locationEstimator, LocationEstimate, LocationConfidence } from '../services/UserLocationEstimator';

interface EnhancedLocationManagerProps {
  onLocationChange: (location: [number, number] | null) => void;
  onLocationMethodChange: (method: LocationMethod) => void;
  onShowPromptChange: (show: boolean) => void;
  onMapCenterChange: (center: [number, number]) => void;
  onLocationAccuracyChange?: (accuracy: number, confidence: LocationConfidence) => void;
  onLocationErrorChange?: (error: string | null) => void;
  enableProgressiveAccuracy?: boolean; // Default: true
  requestPreciseLocationOnStart?: boolean; // Default: false
}

export const EnhancedLocationManager: React.FC<EnhancedLocationManagerProps> = ({
  onLocationChange,
  onLocationMethodChange,
  onShowPromptChange,
  onMapCenterChange,
  onLocationAccuracyChange,
  onLocationErrorChange,
  enableProgressiveAccuracy = true,
  requestPreciseLocationOnStart = false
}) => {
  // Persistent state
  const [userLocation, setUserLocation] = useUserLocationStorage();
  const [locationMethod, setLocationMethod] = useLocationMethodStorage();
  const [showLocationPrompt, setShowLocationPrompt] = useShowLocationPromptStorage();
  
  // Enhanced state for accuracy tracking
  const [locationAccuracy, setLocationAccuracy] = useState<number>(50000); // Default 50km uncertainty
  const [locationConfidence, setLocationConfidence] = useState<LocationConfidence>('unknown');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  
  // Track initialization and enhancement state
  const locationInitialized = useRef(false);
  const enhancementInProgress = useRef(false);

  /**
   * CORE LOCATION ESTIMATION with enhanced accuracy
   */
  const performLocationEstimation = useCallback(async (requestPrecise: boolean = false) => {
    try {
      setLocationError(null);
      
      let estimate: LocationEstimate;
      
      if (requestPrecise) {
        // Request high accuracy location (requires user permission)
        estimate = await locationEstimator.requestPreciseLocation({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // 1 minute for precise requests
        });
      } else {
        // Get best available location quickly
        estimate = await locationEstimator.estimateLocation({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000 // 5 minutes for general requests
        });
      }

      // Update all state based on estimate
      setUserLocation(estimate.coordinates);
      setLocationMethod(estimate.method);
      setLocationAccuracy(estimate.accuracy);
      setLocationConfidence(estimate.confidence);
      onMapCenterChange(estimate.coordinates);

      // Hide location prompt if we got a reasonable location
      if (estimate.confidence === 'high' || estimate.confidence === 'medium') {
        setShowLocationPrompt(false);
      }

      console.log(`📍 Location estimated: ${locationEstimator.getLocationSummary(estimate)}`);
      
      return estimate;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location estimation failed';
      setLocationError(errorMessage);
      console.warn('Location estimation failed:', errorMessage);
      
      // Show prompt for manual location setting
      setShowLocationPrompt(true);
      
      // Use fallback if no location exists
      if (!userLocation) {
        const fallbackLocation: [number, number] = [44.9537, -93.0900]; // Minneapolis
        setUserLocation(fallbackLocation);
        setLocationMethod('fallback');
        setLocationAccuracy(50000);
        setLocationConfidence('unknown');
        onMapCenterChange(fallbackLocation);
      }
      
      return null;
    }
  }, [userLocation, setUserLocation, setLocationMethod, onMapCenterChange, setShowLocationPrompt]);

  /**
   * PROGRESSIVE ACCURACY ENHANCEMENT
   * Start with fast/low-accuracy, then enhance with precise location
   */
  const enhanceLocationAccuracy = useCallback(async () => {
    if (enhancementInProgress.current) return;
    
    enhancementInProgress.current = true;
    
    try {
      // Check if current location is already high accuracy
      if (locationConfidence === 'high') {
        console.log('📍 Location already high accuracy, skipping enhancement');
        return;
      }
      
      // Request precise location
      const preciseEstimate = await locationEstimator.requestPreciseLocation({
        enableHighAccuracy: true,
        timeout: 15000
      });
      
      // Update to more accurate location if significantly better
      if (preciseEstimate.accuracy < locationAccuracy * 0.5) { // At least 50% more accurate
        setUserLocation(preciseEstimate.coordinates);
        setLocationMethod(preciseEstimate.method);
        setLocationAccuracy(preciseEstimate.accuracy);
        setLocationConfidence(preciseEstimate.confidence);
        onMapCenterChange(preciseEstimate.coordinates);
        
        console.log(`📍 Location enhanced: ${locationEstimator.getLocationSummary(preciseEstimate)}`);
      }
      
    } catch (error) {
      console.log('📍 Location enhancement failed (this is normal if permissions denied):', error);
    } finally {
      enhancementInProgress.current = false;
    }
  }, [locationAccuracy, locationConfidence, setUserLocation, setLocationMethod, onMapCenterChange]);

  /**
   * CHECK GEOLOCATION PERMISSION STATUS
   */
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionState(permission.state);
        });
      } catch (error) {
        console.log('Could not check geolocation permission:', error);
      }
    }
  }, []);

  /**
   * INITIALIZE LOCATION ON MOUNT
   */
  useEffect(() => {
    if (locationInitialized.current) return;
    
    locationInitialized.current = true;
    
    const initializeLocation = async () => {
      // Check permission status
      await checkPermissionStatus();
      
      // If we have a saved location, use it immediately
      if (userLocation && locationMethod !== 'none') {
        console.log(`📍 Using saved location (${locationMethod}):`, userLocation);
        onMapCenterChange(userLocation);
        
        // Still try to enhance accuracy in background if enabled
        if (enableProgressiveAccuracy && locationMethod !== 'gps') {
          setTimeout(() => enhanceLocationAccuracy(), 2000);
        }
        return;
      }
      
      // Perform initial location estimation
      const estimate = await performLocationEstimation(requestPreciseLocationOnStart);
      
      // If successful and progressive enhancement enabled, enhance accuracy after initial load
      if (estimate && enableProgressiveAccuracy && estimate.confidence !== 'high') {
        setTimeout(() => enhanceLocationAccuracy(), 3000);
      }
    };
    
    initializeLocation();
  }, [
    userLocation,
    locationMethod,
    onMapCenterChange,
    checkPermissionStatus,
    performLocationEstimation,
    requestPreciseLocationOnStart,
    enableProgressiveAccuracy,
    enhanceLocationAccuracy
  ]);

  /**
   * NOTIFY PARENT COMPONENTS OF CHANGES
   */
  useEffect(() => {
    onLocationChange(userLocation);
  }, [userLocation, onLocationChange]);

  useEffect(() => {
    onLocationMethodChange(locationMethod);
  }, [locationMethod, onLocationMethodChange]);

  useEffect(() => {
    onShowPromptChange(showLocationPrompt);
  }, [showLocationPrompt, onShowPromptChange]);

  useEffect(() => {
    if (onLocationAccuracyChange) {
      onLocationAccuracyChange(locationAccuracy, locationConfidence);
    }
  }, [locationAccuracy, locationConfidence, onLocationAccuracyChange]);

  useEffect(() => {
    if (onLocationErrorChange) {
      onLocationErrorChange(locationError);
    }
  }, [locationError, onLocationErrorChange]);

  /**
   * PUBLIC METHODS for external triggers
   */
  const requestPreciseLocation = useCallback(async () => {
    return await performLocationEstimation(true);
  }, [performLocationEstimation]);

  const refreshLocation = useCallback(async () => {
    return await performLocationEstimation(false);
  }, [performLocationEstimation]);

  // Expose methods via ref if needed
  React.useImperativeHandle(React.createRef(), () => ({
    requestPreciseLocation,
    refreshLocation,
    enhanceLocationAccuracy,
    getLocationSummary: () => userLocation ? locationEstimator.getLocationSummary({
      coordinates: userLocation,
      accuracy: locationAccuracy,
      method: locationMethod,
      timestamp: Date.now(),
      confidence: locationConfidence
    }) : 'No location available'
  }));

  // This component doesn't render anything - it's just location management logic
  return null;
};

/**
 * LOCATION ACCURACY DISPLAY COMPONENT
 * Optional component to show location accuracy to users
 */
export const LocationAccuracyIndicator: React.FC<{
  accuracy: number;
  confidence: LocationConfidence;
  method: LocationMethod;
}> = ({ accuracy, confidence, method }) => {
  const getAccuracyDisplay = () => {
    if (accuracy < 50) return `±${Math.round(accuracy)}m`;
    if (accuracy < 1000) return `±${Math.round(accuracy)}m`;
    return `±${Math.round(accuracy / 1000)}km`;
  };

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'gps': return '📍';
      case 'network': return '📶';
      case 'ip': return '🌐';
      case 'cached': return '💾';
      case 'manual': return '👆';
      case 'fallback': return '🏠';
      default: return '❓';
    }
  };

  return (
    <span 
      style={{ 
        color: getConfidenceColor(),
        fontSize: '0.75em',
        fontWeight: 500
      }}
      title={`Location method: ${method}, Confidence: ${confidence}`}
    >
      {getMethodIcon()} {getAccuracyDisplay()}
    </span>
  );
};