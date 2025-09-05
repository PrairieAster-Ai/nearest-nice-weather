/**
 * ========================================================================
 * MAP CALCULATION SERVICE - GEOGRAPHIC BOUNDS AND ZOOM OPTIMIZATION
 * ========================================================================
 *
 * 📋 PURPOSE: Centralized geographic calculations for optimal map view positioning
 * 🎯 BUSINESS LOGIC: Intelligent map centering and zoom for outdoor recreation discovery
 * 🔒 ALGORITHM STABILITY: Consistent zoom levels and center calculations
 * ⚡ PERFORMANCE: Optimized geographic bounds calculations for real-time UI
 *
 * CALCULATION STRATEGIES:
 * 1. 📍 Geographic Bounds: Min/max latitude/longitude calculation
 * 2. 🎯 Center Point: Geometric center of POI clusters
 * 3. 🔍 Zoom Optimization: Minnesota-specific zoom levels for regional context
 * 4. 📏 Distance-based: User location prioritization in view calculations
 *
 * @BUSINESS_RULE: Must show user location and POIs in single viewport
 * @PERFORMANCE_CRITICAL: Efficient bounds calculation for real-time UI updates
 * @CLAUDE_CONTEXT: Extracted from App.tsx for testability and maintainability
 *
 * LAST UPDATED: 2025-08-13
 */

// Location interface for geographic calculations
export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Coordinate type for map calculations
export type Coordinates = [number, number]; // [latitude, longitude]

// Geographic bounds for map calculations
export interface GeographicBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Map view configuration
export interface MapView {
  center: Coordinates;
  zoom: number;
}

// Map calculation options
export interface MapCalculationOptions {
  padding?: number;           // Padding factor for bounds (default: 1.2)
  defaultZoom?: number;       // Default zoom level (default: 8)
  minZoom?: number;          // Minimum zoom level (default: 6)
  maxZoom?: number;          // Maximum zoom level (default: 15)
  fallbackCenter?: Coordinates; // Fallback center when no locations (default: Minneapolis)
}

/**
 * Map Calculation Service
 * Provides intelligent geographic calculations for map view optimization
 */
export class MapCalculationService {
  private readonly defaultOptions: Required<MapCalculationOptions> = {
    padding: 1.2,
    defaultZoom: 8,
    minZoom: 6,
    maxZoom: 15,
    fallbackCenter: [44.9537, -93.0900] // Minneapolis center
  };

  /**
   * Calculate geographic bounds from a set of locations
   * @param locations Array of locations with lat/lng coordinates
   * @returns Geographic bounds or null if no locations
   */
  calculateBounds(locations: LocationPoint[]): GeographicBounds | null {
    if (locations.length === 0) {
      return null;
    }

    const lats = locations.map(loc => loc.lat);
    const lngs = locations.map(loc => loc.lng);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }

  /**
   * Calculate geometric center point from geographic bounds
   * @param bounds Geographic bounds
   * @returns Center coordinates
   */
  calculateCenter(bounds: GeographicBounds): Coordinates {
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    return [centerLat, centerLng];
  }

  /**
   * Calculate optimal zoom level based on geographic spread
   * Minnesota-optimized zoom levels for regional weather context
   * @param bounds Geographic bounds
   * @param options Calculation options
   * @returns Optimal zoom level
   */
  calculateOptimalZoom(bounds: GeographicBounds, options: Partial<MapCalculationOptions> = {}): number {
    const opts = { ...this.defaultOptions, ...options };

    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    const maxRange = Math.max(latRange, lngRange);

    // Apply padding for better regional context
    const paddedRange = Math.max(maxRange * opts.padding, 0.5);

    // Minnesota-optimized zoom levels for weather platform
    let zoom = opts.defaultZoom; // Start with regional view for statewide weather

    if (paddedRange < 4.0) zoom = 8;   // Statewide view
    if (paddedRange < 3.0) zoom = 8.5; // Large regional view
    if (paddedRange < 2.0) zoom = 9;   // Regional view
    if (paddedRange < 1.5) zoom = 9.5; // Sub-regional view
    if (paddedRange < 1.0) zoom = 10;  // Multi-city view
    if (paddedRange < 0.7) zoom = 10.5;
    if (paddedRange < 0.5) zoom = 11;  // City cluster view
    if (paddedRange < 0.3) zoom = 11.5;
    if (paddedRange < 0.2) zoom = 12;  // Close cluster view
    if (paddedRange < 0.1) zoom = 13;  // Very close markers

    // Ensure zoom is within acceptable bounds
    return Math.max(opts.minZoom, Math.min(opts.maxZoom, zoom));
  }

  /**
   * Calculate optimal map view for a set of locations
   * @param locations Array of locations to include in view
   * @param options Calculation options
   * @returns Optimal map view (center and zoom)
   */
  calculateOptimalView(locations: LocationPoint[], options: Partial<MapCalculationOptions> = {}): MapView {
    const opts = { ...this.defaultOptions, ...options };

    if (locations.length === 0) {
      console.log('📍 No locations provided, using fallback center');
      return {
        center: opts.fallbackCenter,
        zoom: opts.defaultZoom
      };
    }

    const bounds = this.calculateBounds(locations);
    if (!bounds) {
      return {
        center: opts.fallbackCenter,
        zoom: opts.defaultZoom
      };
    }

    const center = this.calculateCenter(bounds);
    const zoom = this.calculateOptimalZoom(bounds, options);

    console.log(`📍 Calculated optimal view: center [${center[0].toFixed(3)}, ${center[1].toFixed(3)}], zoom ${zoom}`);
    console.log(`📍 Bounds: lat ${bounds.minLat.toFixed(3)}-${bounds.maxLat.toFixed(3)}, lng ${bounds.minLng.toFixed(3)}-${bounds.maxLng.toFixed(3)}`);

    return { center, zoom };
  }

  /**
   * Calculate optimal view including user location
   * Prioritizes showing both user location and POIs in single viewport
   * @param locations Array of POI locations
   * @param userLocation User's current location
   * @param options Calculation options
   * @returns Optimal map view including user location
   */
  calculateViewWithUserLocation(
    locations: LocationPoint[],
    userLocation: Coordinates,
    options: Partial<MapCalculationOptions> = {}
  ): MapView {
    // Add user location as a point to consider in bounds calculation
    const userLocationPoint: LocationPoint = {
      id: 'user',
      name: 'User Location',
      lat: userLocation[0],
      lng: userLocation[1]
    };

    const allPoints = [...locations, userLocationPoint];
    return this.calculateOptimalView(allPoints, options);
  }

  /**
   * Calculate distance between two geographic points (simple Euclidean for map calculations)
   * @param point1 First coordinate
   * @param point2 Second coordinate
   * @returns Simple distance metric for sorting/comparison
   */
  calculateSimpleDistance(point1: Coordinates, point2: Coordinates): number {
    const latDiff = point1[0] - point2[0];
    const lngDiff = point1[1] - point2[1];
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  /**
   * Find the closest locations to a reference point
   * @param locations Array of locations to search
   * @param referencePoint Reference coordinate
   * @param maxCount Maximum number of locations to return
   * @returns Locations sorted by distance (closest first)
   */
  findClosestLocations(
    locations: LocationPoint[],
    referencePoint: Coordinates,
    maxCount: number = 10
  ): LocationPoint[] {
    const locationsWithDistance = locations.map(location => ({
      location,
      distance: this.calculateSimpleDistance([location.lat, location.lng], referencePoint)
    }));

    return locationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxCount)
      .map(item => item.location);
  }

  /**
   * Check if a coordinate is within given bounds
   * @param coordinate Coordinate to check
   * @param bounds Geographic bounds
   * @returns True if coordinate is within bounds
   */
  isWithinBounds(coordinate: Coordinates, bounds: GeographicBounds): boolean {
    const [lat, lng] = coordinate;
    return lat >= bounds.minLat &&
           lat <= bounds.maxLat &&
           lng >= bounds.minLng &&
           lng <= bounds.maxLng;
  }

  /**
   * Expand bounds by a given factor
   * @param bounds Original bounds
   * @param factor Expansion factor (1.2 = 20% larger)
   * @returns Expanded bounds
   */
  expandBounds(bounds: GeographicBounds, factor: number = 1.2): GeographicBounds {
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    const latExpansion = (latRange * factor - latRange) / 2;
    const lngExpansion = (lngRange * factor - lngRange) / 2;

    return {
      minLat: bounds.minLat - latExpansion,
      maxLat: bounds.maxLat + latExpansion,
      minLng: bounds.minLng - lngExpansion,
      maxLng: bounds.maxLng + lngExpansion
    };
  }

  /**
   * Get formatted summary of map calculation results
   * @param view Map view result
   * @param locationCount Number of locations included
   * @returns Human-readable summary string
   */
  getCalculationSummary(view: MapView, locationCount: number): string {
    const [lat, lng] = view.center;
    return `Map view: ${locationCount} locations, center [${lat.toFixed(3)}, ${lng.toFixed(3)}], zoom ${view.zoom}`;
  }
}

// Singleton instance for app-wide use
export const mapCalculationService = new MapCalculationService();
