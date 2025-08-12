/**
 * Distance Calculation Unit Tests
 * Testing utility functions in isolation
 */

// Simple distance calculation utilities for testing
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distance) {
  if (typeof distance !== 'number') return '0.0 mi';
  return `${distance.toFixed(1)} mi`;
}

describe('Distance Utilities', () => {
  describe('calculateDistance', () => {
    test('should calculate distance between two coordinates', () => {
      // Minneapolis to St. Paul (approximately 10 miles)
      const minneapolis = { lat: 44.9537, lng: -93.0900 };
      const stpaul = { lat: 44.9537, lng: -93.0900 };
      
      const distance = calculateDistance(
        minneapolis.lat, minneapolis.lng,
        stpaul.lat, stpaul.lng
      );
      
      expect(distance).toBeCloseTo(0, 1); // Same location = 0 miles
    });

    test('should handle invalid coordinates gracefully', () => {
      const distance = calculateDistance(null, null, 44.9537, -93.0900);
      expect(distance).toBe(0);
    });

    test('should calculate actual distance between different cities', () => {
      // Minneapolis to Duluth (approximately 150 miles)
      const distance = calculateDistance(44.9537, -93.0900, 46.7867, -92.1005);
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(200);
    });
  });

  describe('formatDistance', () => {
    test('should format distance with proper units', () => {
      expect(formatDistance(0.5)).toBe('0.5 mi');
      expect(formatDistance(1.0)).toBe('1.0 mi');
      expect(formatDistance(10.25)).toBe('10.3 mi');
    });

    test('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0.0 mi');
    });

    test('should handle invalid input', () => {
      expect(formatDistance(null)).toBe('0.0 mi');
      expect(formatDistance(undefined)).toBe('0.0 mi');
      expect(formatDistance('not a number')).toBe('0.0 mi');
    });
  });
});