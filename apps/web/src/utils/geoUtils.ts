/**
 * ========================================================================
 * GEOGRAPHIC UTILITIES
 * ========================================================================
 *
 * Pure geographic/distance helpers for outdoor-recreation filtering: Haversine
 * distance, coordinate validation, regional bounds, distance-based filtering and
 * sorting, and distance statistics. Split out of weatherFilteringUtils.ts; that
 * module re-exports these for backward compatibility.
 */

import {
  EARTH_RADIUS_MILES,
  type Coordinates,
  type Location,
} from './weatherFilteringTypes';

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param point1 - First coordinate [latitude, longitude]
 * @param point2 - Second coordinate [latitude, longitude]
 * @returns Distance in miles
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Filter locations by distance from a user location
 * @param locations - Array of locations to filter
 * @param userLocation - User's current coordinates
 * @param maxDistance - Maximum distance in miles
 * @returns Locations within the specified distance
 */
export function filterByDistance(
  locations: Location[],
  userLocation: Coordinates,
  maxDistance: number
): Location[] {
  return locations.filter(loc => {
    const distance = calculateDistance(userLocation, [loc.lat, loc.lng]);
    return distance <= maxDistance;
  });
}

/**
 * Sort locations by distance from user location
 * @param locations - Array of locations to sort
 * @param userLocation - User's current coordinates
 * @returns Locations sorted by distance (closest first)
 */
export function sortByDistance(
  locations: Location[],
  userLocation: Coordinates
): Location[] {
  return [...locations].sort((a, b) => {
    const distanceA = calculateDistance(userLocation, [a.lat, a.lng]);
    const distanceB = calculateDistance(userLocation, [b.lat, b.lng]);
    return distanceA - distanceB;
  });
}

/**
 * Validate geographic coordinates
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(coordinates: Coordinates | null): boolean {
  if (!coordinates || coordinates.length !== 2) {
    return false;
  }

  const [lat, lng] = coordinates;

  // Check for NaN or Infinity
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }

  // Valid latitude: -90 to 90
  if (lat < -90 || lat > 90) {
    return false;
  }

  // Valid longitude: -180 to 180
  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * Check if coordinates are within reasonable bounds for Minnesota/Upper Midwest
 * @param coordinates - [latitude, longitude] pair
 * @returns True if coordinates are within expected regional bounds
 */
export function isWithinMinnesotaBounds(coordinates: Coordinates): boolean {
  if (!isValidCoordinates(coordinates)) {
    return false;
  }

  const [lat, lng] = coordinates;

  // Minnesota bounds (with some buffer)
  const MINNESOTA_BOUNDS = {
    north: 49.5,   // Canadian border
    south: 43.0,   // Iowa border
    east: -89.0,   // Wisconsin border
    west: -97.5    // Dakotas border
  };

  return lat >= MINNESOTA_BOUNDS.south &&
         lat <= MINNESOTA_BOUNDS.north &&
         lng >= MINNESOTA_BOUNDS.west &&
         lng <= MINNESOTA_BOUNDS.east;
}

/**
 * Get the closest location from an array of locations
 * @param locations - Array of locations to search
 * @param userLocation - User's current coordinates
 * @returns Closest location or null if no locations
 */
export function getClosestLocation(
  locations: Location[],
  userLocation: Coordinates
): Location | null {
  if (locations.length === 0) return null;

  return locations.reduce((closest, current) => {
    const currentDistance = calculateDistance(userLocation, [current.lat, current.lng]);
    const closestDistance = calculateDistance(userLocation, [closest.lat, closest.lng]);

    return currentDistance < closestDistance ? current : closest;
  });
}

/**
 * Calculate statistics about location distribution
 * @param locations - Array of locations to analyze
 * @param userLocation - User's current coordinates
 * @returns Statistics about distance distribution
 */
export function calculateLocationStats(
  locations: Location[],
  userLocation: Coordinates
): {
  count: number;
  averageDistance: number;
  medianDistance: number;
  closestDistance: number;
  farthestDistance: number;
} {
  if (locations.length === 0) {
    return {
      count: 0,
      averageDistance: 0,
      medianDistance: 0,
      closestDistance: 0,
      farthestDistance: 0
    };
  }

  const distances = locations.map(loc =>
    calculateDistance(userLocation, [loc.lat, loc.lng])
  ).sort((a, b) => a - b);

  const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
  const medianDistance = distances.length % 2 === 0
    ? (distances[distances.length / 2 - 1] + distances[distances.length / 2]) / 2
    : distances[Math.floor(distances.length / 2)];

  return {
    count: locations.length,
    averageDistance,
    medianDistance,
    closestDistance: distances[0],
    farthestDistance: distances[distances.length - 1]
  };
}
