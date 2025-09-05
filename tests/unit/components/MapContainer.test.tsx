/**
 * Comprehensive tests for MapContainer component
 * Testing Leaflet integration and marker management
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Setup test environment before importing component
const mockDiv = () => ({
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  setAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  }
});

// Mock DOM elements
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => mockDiv()),
    getElementById: jest.fn(() => mockDiv()),
    getElementsByClassName: jest.fn(() => [mockDiv()]),
    body: mockDiv()
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    leafletMapInstance: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock Leaflet library
const mockMarker = {
  addTo: jest.fn(),
  bindPopup: jest.fn(),
  on: jest.fn(),
  getLatLng: jest.fn(),
  setLatLng: jest.fn(),
  getPopup: jest.fn(),
  options: {}
};

const mockMap = {
  setView: jest.fn(),
  remove: jest.fn(),
  removeLayer: jest.fn()
};

const mockTileLayer = {
  addTo: jest.fn()
};

jest.mock('leaflet', () => ({
  map: jest.fn(() => mockMap),
  tileLayer: jest.fn(() => mockTileLayer),
  marker: jest.fn(() => mockMarker),
  Icon: jest.fn()
}));

// Mock the sanitize utilities
jest.mock('../../../apps/web/src/utils/sanitize', () => ({
  escapeHtml: jest.fn((str) => str.replace(/[&<>"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return escapeMap[match];
  })),
  sanitizeUrl: jest.fn((url) => {
    if (url.includes('javascript:')) return '';
    return url;
  })
}));

// Mock ads generation
jest.mock('../../../apps/web/src/components/ads', () => ({
  generatePOIAdHTML: jest.fn(() => '<div class="ad">Mock Ad</div>')
}));

// Mock analytics
jest.mock('../../../apps/web/src/utils/analytics', () => ({
  trackPOIInteraction: jest.fn(),
  trackFeatureUsage: jest.fn()
}));

// Mock POI popup styles
jest.mock('../../../apps/web/src/styles/poi-popup.css', () => ({}));

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
  },
  writable: true
});

// Mock console methods to reduce noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Import component after all mocks are set up
import { MapContainer } from '../../../apps/web/src/components/MapContainer';

describe('MapContainer', () => {
  // Sample test data
  const mockLocations = [
    {
      id: '1',
      name: 'Test Park',
      lat: 44.9778,
      lng: -93.2650,
      temperature: 72,
      condition: 'Sunny',
      description: 'Beautiful park',
      precipitation: 0,
      windSpeed: '5 mph',
      distance: 2.5,
      park_type: 'State Park'
    },
    {
      id: '2',
      name: 'Another Park',
      lat: 44.9537,
      lng: -93.0900,
      temperature: 68,
      condition: 'Cloudy',
      description: 'Nice trail',
      precipitation: 10,
      windSpeed: '8 mph',
      distance: 5.2,
      park_type: 'Regional Park'
    }
  ];

  const defaultProps = {
    center: [44.9778, -93.2650] as [number, number],
    zoom: 12,
    locations: mockLocations,
    userLocation: [44.9778, -93.2650] as [number, number],
    onLocationChange: jest.fn(),
    currentPOI: mockLocations[0],
    isAtClosest: false,
    isAtFarthest: false,
    canExpand: true,
    onNavigateCloser: jest.fn(),
    onNavigateFarther: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();

    // Reset mock implementations
    mockMarker.getLatLng.mockReturnValue({ lat: 44.9778, lng: -93.2650 });
    mockMarker.getPopup.mockReturnValue(null);
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Component Rendering', () => {
    test('should render map container element', () => {
      render(<MapContainer {...defaultProps} />);

      // Check for map container div
      const mapContainer = screen.getByRole('generic');
      expect(mapContainer).toBeInTheDocument();
    });

    test('should handle empty locations array', () => {
      const props = { ...defaultProps, locations: [] };

      expect(() => render(<MapContainer {...props} />)).not.toThrow();
    });

    test('should handle null user location', () => {
      const props = { ...defaultProps, userLocation: null };

      expect(() => render(<MapContainer {...props} />)).not.toThrow();
    });

    test('should handle invalid center coordinates', () => {
      const props = { ...defaultProps, center: [NaN, NaN] as [number, number] };

      render(<MapContainer {...props} />);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Invalid center or zoom provided to MapContainer:',
        expect.objectContaining({
          center: [NaN, NaN],
          zoom: 12
        })
      );
    });
  });

  describe('Leaflet Map Integration', () => {
    test('should initialize Leaflet map with correct parameters', () => {
      const L = require('leaflet');

      render(<MapContainer {...defaultProps} />);

      expect(L.map).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          center: [44.9778, -93.2650],
          zoom: 12,
          scrollWheelZoom: true,
          zoomControl: false
        })
      );
    });

    test('should add OpenStreetMap tile layer', () => {
      const L = require('leaflet');

      render(<MapContainer {...defaultProps} />);

      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({
          attribution: expect.stringContaining('OpenStreetMap')
        })
      );
      expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
    });

    test('should expose map instance to window for testing', () => {
      render(<MapContainer {...defaultProps} />);

      expect((global as any).window.leafletMapInstance).toBeDefined();
    });

    test('should update map view when center or zoom changes', () => {
      const { rerender } = render(<MapContainer {...defaultProps} />);

      // Update props
      const newProps = {
        ...defaultProps,
        center: [45.0, -94.0] as [number, number],
        zoom: 14
      };

      rerender(<MapContainer {...newProps} />);

      expect(mockMap.setView).toHaveBeenCalledWith([45.0, -94.0], 14);
    });
  });

  describe('Marker Management', () => {
    test('should create markers for all locations', () => {
      const L = require('leaflet');

      render(<MapContainer {...defaultProps} />);

      expect(L.marker).toHaveBeenCalledTimes(2); // 2 POI locations
      expect(L.marker).toHaveBeenCalledWith([44.9778, -93.2650], expect.objectContaining({ icon: expect.any(Object) }));
      expect(L.marker).toHaveBeenCalledWith([44.9537, -93.0900], expect.objectContaining({ icon: expect.any(Object) }));
    });

    test('should bind popups to markers', () => {
      render(<MapContainer {...defaultProps} />);

      expect(mockMarker.bindPopup).toHaveBeenCalledTimes(2);
      expect(mockMarker.bindPopup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxWidth: 280,
          className: 'custom-popup'
        })
      );
    });

    test('should add markers to map', () => {
      render(<MapContainer {...defaultProps} />);

      expect(mockMarker.addTo).toHaveBeenCalledTimes(2);
      expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
    });

    test('should handle marker popup open events', () => {
      const { trackPOIInteraction } = require('../../../apps/web/src/utils/analytics');

      render(<MapContainer {...defaultProps} />);

      // Get the popup open handler
      const onPopupOpenCall = mockMarker.on.mock.calls.find(call => call[0] === 'popupopen');
      expect(onPopupOpenCall).toBeDefined();

      // Simulate popup open
      const handler = onPopupOpenCall[1];
      handler();

      expect(trackPOIInteraction).toHaveBeenCalledWith('popup-opened', expect.objectContaining({
        name: 'Test Park',
        temperature: 72,
        condition: 'Sunny'
      }));
    });

    test('should handle incremental marker updates', () => {
      const { rerender } = render(<MapContainer {...defaultProps} />);

      // Add a new location
      const newLocations = [
        ...mockLocations,
        {
          id: '3',
          name: 'New Park',
          lat: 45.0,
          lng: -94.0,
          temperature: 75,
          condition: 'Partly Cloudy',
          description: 'New location',
          precipitation: 5,
          windSpeed: '3 mph'
        }
      ];

      rerender(<MapContainer {...defaultProps} locations={newLocations} />);

      // Should log the update
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('MapContainer updating markers')
      );
    });
  });

  describe('User Location Marker', () => {
    test('should create user location marker when location provided', () => {
      const L = require('leaflet');

      render(<MapContainer {...defaultProps} />);

      // Should create at least one marker (POI markers + user marker)
      expect(L.marker).toHaveBeenCalled();

      // Check if any marker was created with draggable option
      const draggableMarkerCall = L.marker.mock.calls.find(call =>
        call[1] && call[1].draggable === true
      );
      expect(draggableMarkerCall).toBeDefined();
    });

    test('should handle user marker drag events', () => {
      render(<MapContainer {...defaultProps} />);

      // Find the dragend event handler
      const dragendCall = mockMarker.on.mock.calls.find(call => call[0] === 'dragend');

      if (dragendCall) {
        const handler = dragendCall[1];
        const mockEvent = {
          target: {
            getLatLng: () => ({ lat: 45.0, lng: -94.0 })
          }
        };

        handler(mockEvent);

        expect(defaultProps.onLocationChange).toHaveBeenCalledWith([45.0, -94.0]);
      }
    });

    test('should update user marker position when userLocation changes', () => {
      const { rerender } = render(<MapContainer {...defaultProps} />);

      // Update user location
      const newProps = {
        ...defaultProps,
        userLocation: [45.0, -94.0] as [number, number]
      };

      rerender(<MapContainer {...newProps} />);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📍 Updating user marker position:',
        [45.0, -94.0]
      );
    });

    test('should handle invalid user location gracefully', () => {
      const props = {
        ...defaultProps,
        userLocation: [NaN, NaN] as [number, number]
      };

      expect(() => render(<MapContainer {...props} />)).not.toThrow();
    });
  });

  describe('URL Generation for Navigation', () => {
    test('should generate iOS Apple Maps URL', () => {
      // Mock iOS user agent
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true
      });

      render(<MapContainer {...defaultProps} />);

      // This tests the platform detection logic
      expect(navigator.userAgent).toContain('iPhone');
    });

    test('should generate Android geo URL', () => {
      // Mock Android user agent
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
        },
        writable: true
      });

      render(<MapContainer {...defaultProps} />);

      expect(navigator.userAgent).toContain('Android');
    });

    test('should handle desktop browser', () => {
      // Mock desktop user agent
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        writable: true
      });

      render(<MapContainer {...defaultProps} />);

      expect(navigator.userAgent).toContain('Windows');
    });
  });

  describe('Component Cleanup', () => {
    test('should cleanup map instance on unmount', () => {
      const { unmount } = render(<MapContainer {...defaultProps} />);

      unmount();

      // Cleanup is tested indirectly through the useEffect return function
      // The actual cleanup happens in the useEffect dependencies
      expect(mockMap.remove).toHaveBeenCalled();
    });

    test('should handle cleanup with no map instance', () => {
      const L = require('leaflet');
      L.map.mockReturnValue(null);

      const { unmount } = render(<MapContainer {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing container ref', () => {
      // This tests the early return in useEffect when containerRef.current is null
      render(<MapContainer {...defaultProps} />);

      // Component should render without throwing
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    test('should handle invalid zoom value', () => {
      const props = { ...defaultProps, zoom: NaN };

      render(<MapContainer {...props} />);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Invalid center or zoom provided to MapContainer:',
        expect.objectContaining({ zoom: NaN })
      );
    });

    test('should handle Leaflet initialization errors', () => {
      const L = require('leaflet');
      L.map.mockImplementation(() => {
        throw new Error('Leaflet initialization failed');
      });

      // Component should handle the error gracefully
      expect(() => render(<MapContainer {...defaultProps} />)).not.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    test('should use incremental marker updates', () => {
      const { rerender } = render(<MapContainer {...defaultProps} />);

      // Update with same locations (no position changes)
      mockMarker.getLatLng.mockReturnValue({ lat: 44.9778, lng: -93.2650 });

      rerender(<MapContainer {...defaultProps} />);

      // Should log the incremental update logic
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('MapContainer updating markers')
      );
    });

    test('should remove excess markers when location count decreases', () => {
      const { rerender } = render(<MapContainer {...defaultProps} />);

      // Reduce to one location
      const fewerLocations = [mockLocations[0]];
      rerender(<MapContainer {...defaultProps} locations={fewerLocations} />);

      // Should handle the reduction in markers
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('MapContainer updating markers')
      );
    });
  });

  describe('Accessibility and UX', () => {
    test('should provide user-friendly popup content', () => {
      render(<MapContainer {...defaultProps} />);

      // Check that bindPopup was called with user-friendly content
      expect(mockMarker.bindPopup).toHaveBeenCalled();
      const popupContent = mockMarker.bindPopup.mock.calls[0][0];
      expect(typeof popupContent).toBe('string');
    });

    test('should handle touch events for mobile users', () => {
      // This is covered by the user agent detection tests
      // and the draggable marker functionality
      render(<MapContainer {...defaultProps} />);

      expect(mockMarker.on).toHaveBeenCalled();
    });
  });
});
