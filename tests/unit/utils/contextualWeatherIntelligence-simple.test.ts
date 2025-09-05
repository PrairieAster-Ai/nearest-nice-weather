/**
 * Simplified comprehensive tests for contextual weather intelligence
 * Focused on core functionality and good coverage
 */

import {
  ContextualWeatherIntelligence,
  WeatherLocation,
  UserContext
} from '../../../apps/web/src/utils/contextualWeatherIntelligence';

describe('ContextualWeatherIntelligence - Core Functionality', () => {
  let intelligence: ContextualWeatherIntelligence;

  // Sample test data
  const mockLocation1: WeatherLocation = {
    id: '1',
    name: 'Minnehaha Falls',
    lat: 44.9153,
    lng: -93.2111,
    temperature: 72,
    condition: 'Clear',
    description: 'Sunny and pleasant',
    precipitation: 0,
    windSpeed: 5
  };

  const mockLocation2: WeatherLocation = {
    id: '2',
    name: 'Lake Harriet',
    lat: 44.9217,
    lng: -93.3072,
    temperature: 68,
    condition: 'Partly Cloudy',
    description: 'Nice with some clouds',
    precipitation: 10,
    windSpeed: 8
  };

  const mockLocation3: WeatherLocation = {
    id: '3',
    name: 'Gooseberry Falls',
    lat: 47.1395,
    lng: -91.4695,
    temperature: 65,
    condition: 'Overcast',
    description: 'Cloudy conditions',
    precipitation: 30,
    windSpeed: 15
  };

  const mockLocations = [mockLocation1, mockLocation2, mockLocation3];

  const defaultUserContext: UserContext = {
    currentLocation: [44.9778, -93.2650], // Minneapolis
    timeOfDay: 'afternoon',
    season: 'summer',
    intendedActivity: 'hiking',
    weatherSensitivity: 'moderate',
    travelWillingness: 50,
    infrastructure: 'basic'
  };

  beforeEach(() => {
    intelligence = new ContextualWeatherIntelligence();
  });

  describe('Constructor and Basic Setup', () => {
    test('should create instance successfully', () => {
      expect(intelligence).toBeInstanceOf(ContextualWeatherIntelligence);
    });

    test('should be able to call main methods without throwing', () => {
      expect(() => {
        intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);
      }).not.toThrow();

      expect(() => {
        intelligence.calculateWeatherNiceness(mockLocation1, defaultUserContext, mockLocations);
      }).not.toThrow();
    });
  });

  describe('Distance-based Nearness Calculation', () => {
    test('should return valid nearness scores', () => {
      const result = intelligence.calculateContextualNearness(mockLocation1, defaultUserContext);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.reasoning)).toBeTruthy();
    });

    test('should handle missing current location', () => {
      const noLocationContext = { ...defaultUserContext, currentLocation: undefined };
      const result = intelligence.calculateContextualNearness(mockLocation1, noLocationContext);

      expect(result.score).toBe(0.5);
      expect(result.reasoning).toContain('Location unknown - distance assessment unavailable');
    });

    test('should provide different scores for different distances', () => {
      const closeResult = intelligence.calculateContextualNearness(mockLocation1, defaultUserContext);
      const farResult = intelligence.calculateContextualNearness(mockLocation3, defaultUserContext);

      expect(closeResult.score).toBeGreaterThan(farResult.score);
    });

    test('should adjust for camping activity', () => {
      const campingContext = { ...defaultUserContext, intendedActivity: 'camping' as const };
      const result = intelligence.calculateContextualNearness(mockLocation3, campingContext);

      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Weather Niceness Calculation', () => {
    test('should return valid niceness scores', () => {
      const result = intelligence.calculateWeatherNiceness(mockLocation1, defaultUserContext, mockLocations);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.reasoning)).toBeTruthy();
    });

    test('should handle different weather conditions', () => {
      const clearResult = intelligence.calculateWeatherNiceness(mockLocation1, defaultUserContext, mockLocations);
      const cloudyResult = intelligence.calculateWeatherNiceness(mockLocation3, defaultUserContext, mockLocations);

      expect(clearResult.score).toBeGreaterThan(cloudyResult.score);
    });

    test('should handle different activities', () => {
      const hikingContext = { ...defaultUserContext, intendedActivity: 'hiking' as const };
      const fishingContext = { ...defaultUserContext, intendedActivity: 'fishing' as const };

      const hikingResult = intelligence.calculateWeatherNiceness(mockLocation1, hikingContext, mockLocations);
      const fishingResult = intelligence.calculateWeatherNiceness(mockLocation1, fishingContext, mockLocations);

      expect(hikingResult.reasoning).not.toEqual(fishingResult.reasoning);
    });

    test('should handle different seasons', () => {
      const summerContext = { ...defaultUserContext, season: 'summer' as const };
      const winterContext = { ...defaultUserContext, season: 'winter' as const };

      const summerResult = intelligence.calculateWeatherNiceness(mockLocation1, summerContext, mockLocations);
      const winterResult = intelligence.calculateWeatherNiceness(mockLocation1, winterContext, mockLocations);

      expect(summerResult.reasoning).not.toEqual(winterResult.reasoning);
    });

    test('should handle weather sensitivity', () => {
      const sensitiveContext = { ...defaultUserContext, weatherSensitivity: 'high' as const };
      const tolerantContext = { ...defaultUserContext, weatherSensitivity: 'low' as const };

      const marginalWeather: WeatherLocation = {
        ...mockLocation1,
        temperature: 60,
        precipitation: 25,
        windSpeed: 15
      };

      const sensitiveResult = intelligence.calculateWeatherNiceness(marginalWeather, sensitiveContext, mockLocations);
      const tolerantResult = intelligence.calculateWeatherNiceness(marginalWeather, tolerantContext, mockLocations);

      expect(sensitiveResult.score).toBeLessThan(tolerantResult.score);
    });
  });

  describe('Contextual Recommendations Generation', () => {
    test('should generate recommendations for all locations', () => {
      const recommendations = intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);

      expect(recommendations.length).toBe(mockLocations.length);

      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('location');
        expect(rec).toHaveProperty('nearnessFit');
        expect(rec).toHaveProperty('nicenessFit');
        expect(rec).toHaveProperty('overallScore');
        expect(rec).toHaveProperty('reasoning');
        expect(rec).toHaveProperty('comparisonContext');
      });
    });

    test('should sort recommendations by overall score', () => {
      const recommendations = intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);

      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].overallScore).toBeGreaterThanOrEqual(recommendations[i + 1].overallScore);
      }
    });

    test('should provide meaningful comparison context', () => {
      const recommendations = intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);

      recommendations.forEach(rec => {
        expect(rec.comparisonContext).toHaveProperty('betterThan');
        expect(rec.comparisonContext).toHaveProperty('uniqueAdvantages');
        expect(rec.comparisonContext.betterThan).toBeGreaterThanOrEqual(0);
        expect(rec.comparisonContext.betterThan).toBeLessThanOrEqual(100);
      });
    });

    test('should handle empty location list', () => {
      const recommendations = intelligence.generateContextualRecommendations([], defaultUserContext);

      expect(recommendations).toEqual([]);
    });

    test('should handle single location', () => {
      const recommendations = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext);

      expect(recommendations.length).toBe(1);
      expect(recommendations[0].comparisonContext.betterThan).toBe(0);
    });
  });

  describe('Activity-Specific Optimizations', () => {
    const activities = ['hiking', 'fishing', 'photography', 'camping', 'sightseeing', 'general'] as const;

    test.each(activities)('should handle %s activity without errors', (activity) => {
      const activityContext = { ...defaultUserContext, intendedActivity: activity };

      expect(() => {
        intelligence.generateContextualRecommendations(mockLocations, activityContext);
      }).not.toThrow();
    });

    test('should provide activity-specific reasoning', () => {
      const hikingContext = { ...defaultUserContext, intendedActivity: 'hiking' as const };
      const campingContext = { ...defaultUserContext, intendedActivity: 'camping' as const };

      const hikingRec = intelligence.generateContextualRecommendations([mockLocation1], hikingContext)[0];
      const campingRec = intelligence.generateContextualRecommendations([mockLocation1], campingContext)[0];

      expect(hikingRec.reasoning.niceness.join(' ').toLowerCase()).toContain('hiking');
      expect(campingRec.reasoning.niceness.join(' ').toLowerCase()).toContain('camping');
    });
  });

  describe('Seasonal Intelligence', () => {
    const seasons = ['spring', 'summer', 'fall', 'winter'] as const;

    test.each(seasons)('should handle %s season without errors', (season) => {
      const seasonContext = { ...defaultUserContext, season };

      expect(() => {
        intelligence.generateContextualRecommendations(mockLocations, seasonContext);
      }).not.toThrow();
    });

    test('should provide different assessments for different seasons', () => {
      const summerContext = { ...defaultUserContext, season: 'summer' as const };
      const winterContext = { ...defaultUserContext, season: 'winter' as const };

      const summerRec = intelligence.generateContextualRecommendations([mockLocation1], summerContext)[0];
      const winterRec = intelligence.generateContextualRecommendations([mockLocation1], winterContext)[0];

      expect(summerRec.reasoning.niceness.join(' ')).toContain('summer');
      expect(winterRec.reasoning.niceness.join(' ')).toContain('winter');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle extreme weather values', () => {
      const extremeWeather: WeatherLocation = {
        ...mockLocation1,
        temperature: -40,
        precipitation: 100,
        windSpeed: 50
      };

      expect(() => {
        intelligence.generateContextualRecommendations([extremeWeather], defaultUserContext);
      }).not.toThrow();
    });

    test('should handle incomplete weather data', () => {
      const incompleteWeather: WeatherLocation = {
        id: '4',
        name: 'Incomplete',
        lat: 45.0,
        lng: -94.0,
        temperature: 0,
        condition: '',
        description: '',
        precipitation: 0,
        windSpeed: 0
      };

      expect(() => {
        intelligence.generateContextualRecommendations([incompleteWeather], defaultUserContext);
      }).not.toThrow();
    });

    test('should handle minimal user context', () => {
      const minimalContext: UserContext = {};

      expect(() => {
        intelligence.generateContextualRecommendations(mockLocations, minimalContext);
      }).not.toThrow();
    });

    test('should handle invalid coordinates', () => {
      const invalidLocation: WeatherLocation = {
        ...mockLocation1,
        lat: 200, // Invalid
        lng: 400  // Invalid
      };

      expect(() => {
        intelligence.generateContextualRecommendations([invalidLocation], defaultUserContext);
      }).not.toThrow();
    });

    test('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        ...mockLocation1,
        id: `location-${i}`,
        name: `Location ${i}`,
        lat: 44 + Math.random(),
        lng: -93 + Math.random(),
        temperature: 50 + Math.random() * 40
      }));

      const start = Date.now();
      const result = intelligence.generateContextualRecommendations(largeDataset, defaultUserContext);
      const duration = Date.now() - start;

      expect(result.length).toBe(largeDataset.length);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Time-of-Day Intelligence', () => {
    const timesOfDay = ['morning', 'afternoon', 'evening', 'night'] as const;

    test.each(timesOfDay)('should handle %s time without errors', (timeOfDay) => {
      const timeContext = { ...defaultUserContext, timeOfDay };

      expect(() => {
        intelligence.generateContextualRecommendations(mockLocations, timeContext);
      }).not.toThrow();
    });

    test('should apply night-specific concerns', () => {
      const nightContext = { ...defaultUserContext, timeOfDay: 'night' as const };
      const recommendations = intelligence.generateContextualRecommendations(mockLocations, nightContext);

      expect(recommendations[0].reasoning.concerns.some(c => c.includes('night'))).toBeTruthy();
    });
  });

  describe('Infrastructure Considerations', () => {
    const infrastructureTypes = ['any', 'basic', 'full_services'] as const;

    test.each(infrastructureTypes)('should handle %s infrastructure without errors', (infrastructure) => {
      const infraContext = { ...defaultUserContext, infrastructure };

      expect(() => {
        intelligence.generateContextualRecommendations(mockLocations, infraContext);
      }).not.toThrow();
    });
  });

  describe('Travel Willingness Impact', () => {
    test('should respect travel willingness constraints', () => {
      const lowTravelContext = { ...defaultUserContext, travelWillingness: 10 };
      const highTravelContext = { ...defaultUserContext, travelWillingness: 200 };

      const lowTravelRec = intelligence.generateContextualRecommendations([mockLocation3], lowTravelContext)[0];
      const highTravelRec = intelligence.generateContextualRecommendations([mockLocation3], highTravelContext)[0];

      expect(lowTravelRec.nearnessFit).toBeLessThan(highTravelRec.nearnessFit);
    });

    test('should handle extreme travel willingness values', () => {
      const extremeContexts = [
        { ...defaultUserContext, travelWillingness: 0 },
        { ...defaultUserContext, travelWillingness: 1000 }
      ];

      extremeContexts.forEach(context => {
        expect(() => {
          intelligence.generateContextualRecommendations(mockLocations, context);
        }).not.toThrow();
      });
    });
  });
});
