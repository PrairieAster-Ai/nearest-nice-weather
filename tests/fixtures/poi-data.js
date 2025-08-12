/**
 * POI Test Data Fixtures
 * Centralized test data for consistent testing
 */

export const createMockPOI = (overrides = {}) => ({
  id: `poi-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Park',
  latitude: 44.9537 + (Math.random() - 0.5) * 0.1,
  longitude: -93.0900 + (Math.random() - 0.5) * 0.1,
  temperature: Math.floor(Math.random() * 40) + 50, // 50-90°F
  condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rain'][Math.floor(Math.random() * 4)],
  precipitation: Math.floor(Math.random() * 100),
  windSpeed: Math.floor(Math.random() * 30),
  distance_miles: (Math.random() * 20).toFixed(1),
  park_type: ['State Park', 'City Park', 'Nature Center', 'Trail'][Math.floor(Math.random() * 4)],
  ...overrides
});

export const createMockPOIList = (count = 10) => {
  return Array.from({ length: count }, () => createMockPOI());
};

export const MOCK_MINNEAPOLIS_POIS = [
  {
    id: '1',
    name: 'Minnehaha Falls',
    latitude: 44.9153,
    longitude: -93.2102,
    temperature: 72,
    condition: 'Sunny',
    precipitation: 0,
    windSpeed: 8,
    distance_miles: '3.2',
    park_type: 'State Park'
  },
  {
    id: '2', 
    name: 'Lake Harriet',
    latitude: 44.9219,
    longitude: -93.3056,
    temperature: 68,
    condition: 'Partly Cloudy',
    precipitation: 20,
    windSpeed: 12,
    distance_miles: '4.1',
    park_type: 'City Park'
  },
  {
    id: '3',
    name: 'Como Park',
    latitude: 44.9820,
    longitude: -93.1458,
    temperature: 75,
    condition: 'Sunny',
    precipitation: 0,
    windSpeed: 5,
    distance_miles: '2.8',
    park_type: 'City Park'
  }
];

export const MOCK_WEATHER_DATA = {
  sunny: { temperature: 75, condition: 'Sunny', precipitation: 0, windSpeed: 5 },
  cloudy: { temperature: 65, condition: 'Cloudy', precipitation: 20, windSpeed: 10 },
  rainy: { temperature: 60, condition: 'Rain', precipitation: 80, windSpeed: 15 }
};

export const MOCK_USER_LOCATIONS = {
  minneapolis: { latitude: 44.9537, longitude: -93.0900 },
  stpaul: { latitude: 44.9537, longitude: -93.0900 },
  duluth: { latitude: 46.7867, longitude: -92.1005 },
  rochester: { latitude: 44.0234, longitude: -92.4630 }
};