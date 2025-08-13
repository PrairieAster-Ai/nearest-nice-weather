/**
 * Comprehensive tests for MapCalculationService
 * Testing geographic bounds and zoom optimization algorithms
 */

// Mock console methods to reduce test noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Import the service and types
import { 
  MapCalculationService,
  LocationPoint,
  Coordinates,
  GeographicBounds,
  MapView,
  MapCalculationOptions
} from '../../../apps/web/src/services/MapCalculationService';

describe('MapCalculationService', () => {
  let service: MapCalculationService;

  const mockLocations: LocationPoint[] = [
    {
      id: '1',
      name: 'Minneapolis',
      lat: 44.9778,
      lng: -93.2650
    },
    {
      id: '2', 
      name: 'Saint Paul',
      lat: 44.9537,
      lng: -93.0900
    },
    {
      id: '3',
      name: 'Duluth',
      lat: 46.7867,
      lng: -92.1005
    },
    {
      id: '4',
      name: 'Rochester',
      lat: 44.0121,
      lng: -92.4802
    },
    {
      id: '5',
      name: 'Bemidji',
      lat: 47.4734,
      lng: -94.8803
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    service = new MapCalculationService();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Geographic Bounds Calculation', () => {
    test('should calculate correct bounds for Minnesota cities', () => {
      const bounds = service.calculateBounds(mockLocations);
      
      expect(bounds).not.toBeNull();
      expect(bounds!.minLat).toBeCloseTo(44.0121, 3); // Rochester
      expect(bounds!.maxLat).toBeCloseTo(47.4734, 3); // Bemidji
      expect(bounds!.minLng).toBeCloseTo(-94.8803, 3); // Bemidji
      expect(bounds!.maxLng).toBeCloseTo(-92.1005, 3); // Duluth
    });

    test('should return null for empty locations array', () => {
      const bounds = service.calculateBounds([]);
      
      expect(bounds).toBeNull();
    });

    test('should handle single location correctly', () => {
      const singleLocation = [mockLocations[0]];
      const bounds = service.calculateBounds(singleLocation);
      
      expect(bounds).not.toBeNull();
      expect(bounds!.minLat).toBe(bounds!.maxLat);
      expect(bounds!.minLng).toBe(bounds!.maxLng);
      expect(bounds!.minLat).toBeCloseTo(44.9778, 4);
      expect(bounds!.minLng).toBeCloseTo(-93.2650, 4);
    });

    test('should handle locations with identical coordinates', () => {
      const identicalLocations: LocationPoint[] = [
        { id: '1', name: 'Location A', lat: 45.0, lng: -93.0 },
        { id: '2', name: 'Location B', lat: 45.0, lng: -93.0 }
      ];
      
      const bounds = service.calculateBounds(identicalLocations);
      
      expect(bounds).not.toBeNull();
      expect(bounds!.minLat).toBe(bounds!.maxLat);
      expect(bounds!.minLng).toBe(bounds!.maxLng);
    });
  });

  describe('Center Point Calculation', () => {
    test('should calculate geometric center correctly', () => {
      const bounds: GeographicBounds = {
        minLat: 44.0,
        maxLat: 46.0,
        minLng: -94.0,
        maxLng: -92.0
      };
      
      const center = service.calculateCenter(bounds);
      
      expect(center[0]).toBeCloseTo(45.0, 3); // (44 + 46) / 2
      expect(center[1]).toBeCloseTo(-93.0, 3); // (-94 + -92) / 2
    });

    test('should handle zero-area bounds', () => {
      const bounds: GeographicBounds = {
        minLat: 45.0,
        maxLat: 45.0,
        minLng: -93.0,
        maxLng: -93.0
      };
      
      const center = service.calculateCenter(bounds);
      
      expect(center[0]).toBe(45.0);
      expect(center[1]).toBe(-93.0);
    });

    test('should handle negative coordinates correctly', () => {
      const bounds: GeographicBounds = {
        minLat: -10.0,
        maxLat: -5.0,
        minLng: -100.0,
        maxLng: -90.0
      };
      
      const center = service.calculateCenter(bounds);
      
      expect(center[0]).toBeCloseTo(-7.5, 3);
      expect(center[1]).toBeCloseTo(-95.0, 3);
    });
  });

  describe('Optimal Zoom Calculation', () => {
    test('should calculate zoom for statewide view', () => {
      const bounds: GeographicBounds = {
        minLat: 43.0,
        maxLat: 48.0, // Large range covering most of Minnesota
        minLng: -96.0,
        maxLng: -89.0
      };
      
      const zoom = service.calculateOptimalZoom(bounds);
      
      expect(zoom).toBeLessThanOrEqual(9); // Should be regional view
      expect(zoom).toBeGreaterThanOrEqual(6); // Should not be too zoomed out
    });

    test('should calculate zoom for city cluster view', () => {
      const bounds: GeographicBounds = {
        minLat: 44.9,
        maxLat: 45.1, // Small range around Twin Cities
        minLng: -93.5,
        maxLng: -93.0
      };
      
      const zoom = service.calculateOptimalZoom(bounds);
      
      expect(zoom).toBeGreaterThanOrEqual(10); // Should be closer view
      expect(zoom).toBeLessThanOrEqual(13);
    });

    test('should calculate zoom for very close markers', () => {
      const bounds: GeographicBounds = {
        minLat: 44.95,
        maxLat: 44.98, // Very small range
        minLng: -93.27,
        maxLng: -93.25
      };
      
      const zoom = service.calculateOptimalZoom(bounds);
      
      expect(zoom).toBeGreaterThanOrEqual(10); // Should be close view (algorithm returns 10.5)
    });

    test('should respect custom padding factor', () => {
      const bounds: GeographicBounds = {
        minLat: 44.9,
        maxLat: 45.1,
        minLng: -93.5,
        maxLng: -93.0
      };
      
      const normalZoom = service.calculateOptimalZoom(bounds, { padding: 1.2 });
      const tightZoom = service.calculateOptimalZoom(bounds, { padding: 1.0 });
      
      expect(tightZoom).toBeGreaterThanOrEqual(normalZoom); // Less padding = closer zoom
    });

    test('should respect min and max zoom limits', () => {
      const veryLargeBounds: GeographicBounds = {
        minLat: 30.0,
        maxLat: 60.0,
        minLng: -120.0,
        maxLng: -60.0
      };
      
      const verySmallBounds: GeographicBounds = {
        minLat: 44.999,
        maxLat: 45.001,
        minLng: -93.001,
        maxLng: -92.999
      };
      
      const largeZoom = service.calculateOptimalZoom(veryLargeBounds, { minZoom: 5, maxZoom: 12 });
      const smallZoom = service.calculateOptimalZoom(verySmallBounds, { minZoom: 8, maxZoom: 15 });
      
      expect(largeZoom).toBeGreaterThanOrEqual(5);
      expect(largeZoom).toBeLessThanOrEqual(12);
      expect(smallZoom).toBeGreaterThanOrEqual(8);
      expect(smallZoom).toBeLessThanOrEqual(15);
    });
  });

  describe('Optimal View Calculation', () => {
    test('should calculate optimal view for multiple locations', () => {
      const view = service.calculateOptimalView(mockLocations);
      
      expect(view.center).toHaveLength(2);
      expect(view.center[0]).toBeGreaterThan(44.0); // Should be in Minnesota latitude range
      expect(view.center[0]).toBeLessThan(48.0);
      expect(view.center[1]).toBeGreaterThan(-95.0); // Should be in Minnesota longitude range
      expect(view.center[1]).toBeLessThan(-92.0);
      expect(view.zoom).toBeGreaterThan(6);
      expect(view.zoom).toBeLessThan(15);
    });

    test('should handle empty locations with fallback', () => {
      const view = service.calculateOptimalView([]);
      
      expect(view.center).toEqual([44.9537, -93.0900]); // Minneapolis fallback
      expect(view.zoom).toBe(8); // Default zoom
    });

    test('should use custom fallback options', () => {
      const customOptions: Partial<MapCalculationOptions> = {
        fallbackCenter: [45.0, -94.0],
        defaultZoom: 10
      };
      
      const view = service.calculateOptimalView([], customOptions);
      
      expect(view.center).toEqual([45.0, -94.0]);
      expect(view.zoom).toBe(10);
    });

    test('should handle single location', () => {
      const singleLocation = [mockLocations[0]];
      const view = service.calculateOptimalView(singleLocation);
      
      expect(view.center[0]).toBeCloseTo(44.9778, 3);
      expect(view.center[1]).toBeCloseTo(-93.2650, 3);
      expect(view.zoom).toBeGreaterThan(10); // Should zoom in on single location
    });
  });

  describe('View with User Location', () => {
    test('should include user location in bounds calculation', () => {
      const userLocation: Coordinates = [46.0, -95.0]; // Northwest of Twin Cities
      const view = service.calculateViewWithUserLocation(mockLocations.slice(0, 2), userLocation);
      
      // Should include user location in the view calculation
      expect(view.center[0]).toBeGreaterThan(44.9); // Between cities and user
      expect(view.center[0]).toBeLessThan(46.1);
      expect(view.center[1]).toBeGreaterThan(-95.1);
      expect(view.center[1]).toBeLessThan(-93.0);
    });

    test('should handle user location with no POIs', () => {
      const userLocation: Coordinates = [45.0, -93.0];
      const view = service.calculateViewWithUserLocation([], userLocation);
      
      expect(view.center).toEqual(userLocation);
      expect(view.zoom).toBeGreaterThan(8); // Should zoom in on user location
    });

    test('should prioritize user location in view calculation', () => {
      const userLocation: Coordinates = [44.9778, -93.2650]; // Minneapolis
      const distantLocations: LocationPoint[] = [
        { id: '1', name: 'Distant', lat: 47.0, lng: -94.0 }
      ];
      
      const view = service.calculateViewWithUserLocation(distantLocations, userLocation);
      
      // Should create view that includes both user and distant location
      expect(view.center[0]).toBeGreaterThan(44.9);
      expect(view.center[0]).toBeLessThan(47.1);
    });
  });

  describe('Distance and Proximity Calculations', () => {
    test('should calculate simple distance correctly', () => {
      const point1: Coordinates = [45.0, -93.0];
      const point2: Coordinates = [46.0, -94.0];
      
      const distance = service.calculateSimpleDistance(point1, point2);
      
      expect(distance).toBeCloseTo(Math.sqrt(2), 3); // sqrt((1)² + (1)²)
    });

    test('should return zero for identical points', () => {
      const point: Coordinates = [45.0, -93.0];
      const distance = service.calculateSimpleDistance(point, point);
      
      expect(distance).toBe(0);
    });

    test('should find closest locations correctly', () => {
      const referencePoint: Coordinates = [44.9778, -93.2650]; // Minneapolis
      const closest = service.findClosestLocations(mockLocations, referencePoint, 3);
      
      expect(closest).toHaveLength(3);
      expect(closest[0].name).toBe('Minneapolis'); // Should be closest to itself
      expect(closest[1].name).toBe('Saint Paul'); // Second closest
      
      // Should be sorted by distance
      const distances = closest.map(loc => 
        service.calculateSimpleDistance([loc.lat, loc.lng], referencePoint)
      );
      for (let i = 0; i < distances.length - 1; i++) {
        expect(distances[i]).toBeLessThanOrEqual(distances[i + 1]);
      }
    });

    test('should limit results to maxCount', () => {
      const referencePoint: Coordinates = [45.0, -93.0];
      const closest = service.findClosestLocations(mockLocations, referencePoint, 2);
      
      expect(closest).toHaveLength(2);
    });

    test('should handle empty locations array', () => {
      const referencePoint: Coordinates = [45.0, -93.0];
      const closest = service.findClosestLocations([], referencePoint, 5);
      
      expect(closest).toEqual([]);
    });
  });

  describe('Bounds Utilities', () => {
    test('should check if coordinate is within bounds', () => {
      const bounds: GeographicBounds = {
        minLat: 44.0,
        maxLat: 46.0,
        minLng: -94.0,
        maxLng: -92.0
      };
      
      expect(service.isWithinBounds([45.0, -93.0], bounds)).toBe(true);
      expect(service.isWithinBounds([43.0, -93.0], bounds)).toBe(false); // Below minLat
      expect(service.isWithinBounds([47.0, -93.0], bounds)).toBe(false); // Above maxLat
      expect(service.isWithinBounds([45.0, -95.0], bounds)).toBe(false); // Below minLng
      expect(service.isWithinBounds([45.0, -91.0], bounds)).toBe(false); // Above maxLng
    });

    test('should check bounds edge cases correctly', () => {
      const bounds: GeographicBounds = {
        minLat: 44.0,
        maxLat: 46.0,
        minLng: -94.0,
        maxLng: -92.0
      };
      
      // Edge coordinates should be within bounds
      expect(service.isWithinBounds([44.0, -93.0], bounds)).toBe(true);
      expect(service.isWithinBounds([46.0, -93.0], bounds)).toBe(true);
      expect(service.isWithinBounds([45.0, -94.0], bounds)).toBe(true);
      expect(service.isWithinBounds([45.0, -92.0], bounds)).toBe(true);
    });

    test('should expand bounds correctly', () => {
      const bounds: GeographicBounds = {
        minLat: 44.0,
        maxLat: 46.0,
        minLng: -94.0,
        maxLng: -92.0
      };
      
      const expanded = service.expandBounds(bounds, 1.5);
      
      // Should be 50% larger in each direction
      expect(expanded.minLat).toBeLessThan(bounds.minLat);
      expect(expanded.maxLat).toBeGreaterThan(bounds.maxLat);
      expect(expanded.minLng).toBeLessThan(bounds.minLng);
      expect(expanded.maxLng).toBeGreaterThan(bounds.maxLng);
      
      // Check specific expansion
      const latExpansion = (2.0 * 0.5) / 2; // (range * (factor - 1)) / 2
      const lngExpansion = (2.0 * 0.5) / 2;
      
      expect(expanded.minLat).toBeCloseTo(44.0 - latExpansion, 3);
      expect(expanded.maxLat).toBeCloseTo(46.0 + latExpansion, 3);
      expect(expanded.minLng).toBeCloseTo(-94.0 - lngExpansion, 3);
      expect(expanded.maxLng).toBeCloseTo(-92.0 + lngExpansion, 3);
    });

    test('should handle zero-size bounds expansion', () => {
      const bounds: GeographicBounds = {
        minLat: 45.0,
        maxLat: 45.0,
        minLng: -93.0,
        maxLng: -93.0
      };
      
      const expanded = service.expandBounds(bounds, 2.0);
      
      // Zero-size bounds should remain the same after expansion
      expect(expanded.minLat).toBe(45.0);
      expect(expanded.maxLat).toBe(45.0);
      expect(expanded.minLng).toBe(-93.0);
      expect(expanded.maxLng).toBe(-93.0);
    });
  });

  describe('Utility Methods', () => {
    test('should generate calculation summary', () => {
      const view: MapView = {
        center: [45.123, -93.456],
        zoom: 10
      };
      
      const summary = service.getCalculationSummary(view, 5);
      
      expect(summary).toContain('5 locations');
      expect(summary).toContain('45.123');
      expect(summary).toContain('-93.456');
      expect(summary).toContain('zoom 10');
    });

    test('should format coordinates to reasonable precision', () => {
      const view: MapView = {
        center: [45.123456789, -93.987654321],
        zoom: 12
      };
      
      const summary = service.getCalculationSummary(view, 1);
      
      expect(summary).toContain('45.123'); // Should round to 3 decimal places
      expect(summary).toContain('-93.988');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle extreme coordinates', () => {
      const extremeLocations: LocationPoint[] = [
        { id: '1', name: 'North Pole', lat: 90, lng: 0 },
        { id: '2', name: 'South Pole', lat: -90, lng: 0 }
      ];
      
      const view = service.calculateOptimalView(extremeLocations);
      
      expect(view.center[0]).toBeCloseTo(0, 1); // Should center between poles
      expect(view.center[1]).toBe(0);
      expect(view.zoom).toBeGreaterThan(0);
    });

    test('should handle locations across date line', () => {
      const dateLineLocations: LocationPoint[] = [
        { id: '1', name: 'East', lat: 45, lng: 179 },
        { id: '2', name: 'West', lat: 45, lng: -179 }
      ];
      
      const bounds = service.calculateBounds(dateLineLocations);
      const view = service.calculateOptimalView(dateLineLocations);
      
      expect(bounds).not.toBeNull();
      expect(view.center).toHaveLength(2);
      expect(view.zoom).toBeGreaterThan(0);
    });

    test('should handle very large location arrays', () => {
      const manyLocations: LocationPoint[] = [];
      for (let i = 0; i < 1000; i++) {
        manyLocations.push({
          id: `loc-${i}`,
          name: `Location ${i}`,
          lat: 44 + Math.random() * 4, // Scatter around Minnesota
          lng: -96 + Math.random() * 4
        });
      }
      
      const view = service.calculateOptimalView(manyLocations);
      
      expect(view.center).toHaveLength(2);
      expect(view.zoom).toBeGreaterThan(0);
      expect(view.zoom).toBeLessThan(20);
    });

    test('should handle invalid coordinates gracefully', () => {
      const invalidLocations: LocationPoint[] = [
        { id: '1', name: 'Invalid', lat: NaN, lng: -93 },
        { id: '2', name: 'Valid', lat: 45, lng: -93 }
      ];
      
      // Should not throw error
      expect(() => {
        service.calculateOptimalView(invalidLocations);
      }).not.toThrow();
    });
  });
});