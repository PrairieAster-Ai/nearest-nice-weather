/**
 * Comprehensive tests for contextual weather intelligence
 * Testing subjective weather scoring and location assessment algorithms
 */

import {
  ContextualWeatherIntelligence,
  WeatherLocation,
  UserContext,
  ContextualAssessment
} from '../../../apps/web/src/utils/contextualWeatherIntelligence';

describe('ContextualWeatherIntelligence', () => {
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

  describe('Constructor and Setup', () => {
    test('should create instance with default seasonal norms', () => {
      expect(intelligence).toBeInstanceOf(ContextualWeatherIntelligence);
    });

    test('should have proper seasonal norms configured', () => {
      // Testing access to private properties through public methods
      const assessments = intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);
      expect(assessments.length).toBe(mockLocations.length);
      expect(assessments[0]).toHaveProperty('nearnessFit');
      expect(assessments[0]).toHaveProperty('nicenessFit');
      expect(assessments[0]).toHaveProperty('overallScore');
    });
  });

  describe('Distance-based Nearness Calculation', () => {
    test('should score close locations highly', () => {
      const context = { ...defaultUserContext, currentLocation: [44.9153, -93.2111] as [number, number] };
      const result = intelligence.calculateContextualNearness(mockLocation1, context);

      expect(result.score).toBeGreaterThan(0.8);
      expect(result.reasoning).toContain('Practically next door');
    });

    test('should handle moderate distance appropriately', () => {
      const result = intelligence.calculateContextualNearness(mockLocation2, defaultUserContext);

      expect(result.score).toBeGreaterThan(0.5);
      expect(result.score).toBeLessThan(0.9);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    test('should penalize very far locations', () => {
      const result = intelligence.calculateContextualNearness(mockLocation3, defaultUserContext);

      expect(result.score).toBeLessThan(0.8);
      expect(result.reasoning.some(r => r.includes('far'))).toBeTruthy();
    });

    test('should adjust for camping activity with long distance', () => {
      const campingContext = { ...defaultUserContext, intendedActivity: 'camping' as const };
      const result = intelligence.calculateContextualNearness(mockLocation3, campingContext);

      expect(result.reasoning.some(r => r.includes('camping'))).toBeTruthy();
    });

    test('should handle missing current location', () => {
      const noLocationContext = { ...defaultUserContext, currentLocation: undefined };
      const result = intelligence.calculateContextualNearness(mockLocation1, noLocationContext);

      expect(result.score).toBe(0.5);
      expect(result.reasoning).toContain('Location unknown - distance assessment unavailable');
    });
  });

  describe('Weather Niceness Calculation', () => {
    test('should score perfect weather conditions highly', () => {
      const perfectWeather: WeatherLocation = {
        ...mockLocation1,
        temperature: 75,
        precipitation: 0,
        windSpeed: 5
      };

      const result = intelligence.calculateWeatherNiceness(perfectWeather, defaultUserContext, mockLocations);

      expect(result.score).toBeGreaterThan(0.7);
      expect(result.reasoning.some(r => r.includes('Perfect temperature'))).toBeTruthy();
      expect(result.reasoning.some(r => r.includes('No precipitation'))).toBeTruthy();
    });

    test('should handle different activity preferences', () => {
      const fishingContext = { ...defaultUserContext, intendedActivity: 'fishing' as const };
      const photographyContext = { ...defaultUserContext, intendedActivity: 'photography' as const };

      const fishingResult = intelligence.calculateWeatherNiceness(mockLocation1, fishingContext, mockLocations);
      const photoResult = intelligence.calculateWeatherNiceness(mockLocation1, photographyContext, mockLocations);

      expect(fishingResult.reasoning).not.toEqual(photoResult.reasoning);
    });

    test('should penalize high precipitation', () => {
      const rainyWeather: WeatherLocation = {
        ...mockLocation1,
        precipitation: 80,
        condition: 'Heavy Rain'
      };

      const result = intelligence.calculateWeatherNiceness(rainyWeather, defaultUserContext, mockLocations);

      expect(result.score).toBeLessThan(0.5);
      expect(result.reasoning.some(r => r.includes('precipitation'))).toBeTruthy();
    });

    test('should handle wind assessment for different activities', () => {
      const windyWeather: WeatherLocation = {
        ...mockLocation1,
        windSpeed: 25
      };

      const hikingResult = intelligence.calculateWeatherNiceness(windyWeather, defaultUserContext, mockLocations);
      const campingContext = { ...defaultUserContext, intendedActivity: 'camping' as const };
      const campingResult = intelligence.calculateWeatherNiceness(windyWeather, campingContext, mockLocations);

      expect(hikingResult.score).not.toEqual(campingResult.score);
    });

    test('should provide seasonal context adjustments', () => {
      const winterContext = { ...defaultUserContext, season: 'winter' as const };
      const summerContext = { ...defaultUserContext, season: 'summer' as const };

      const coldWeather: WeatherLocation = {
        ...mockLocation1,
        temperature: 35
      };

      const winterResult = intelligence.calculateWeatherNiceness(coldWeather, winterContext, mockLocations);
      const summerResult = intelligence.calculateWeatherNiceness(coldWeather, summerContext, mockLocations);

      expect(winterResult.score).toBeGreaterThan(summerResult.score);
    });

    test('should handle weather sensitivity adjustments', () => {
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

  describe('Time-of-Day Intelligence', () => {
    test('should apply morning preferences', () => {
      const morningContext = { ...defaultUserContext, timeOfDay: 'morning' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, morningContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('morning'))).toBeTruthy();
    });

    test('should apply evening adjustments', () => {
      const eveningContext = { ...defaultUserContext, timeOfDay: 'evening' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, eveningContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('evening'))).toBeTruthy();
    });

    test('should handle night considerations', () => {
      const nightContext = { ...defaultUserContext, timeOfDay: 'night' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, nightContext, mockLocations);

      expect(assessment.reasoning.concerns.some(r => r.includes('night'))).toBeTruthy();
    });
  });

  describe('Location Assessment Integration', () => {
    test('should provide complete assessment with all scores', () => {
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0];

      expect(assessment).toHaveProperty('nearnessFit');
      expect(assessment).toHaveProperty('nicenessFit');
      expect(assessment).toHaveProperty('overallScore');
      expect(assessment).toHaveProperty('reasoning');
      expect(assessment).toHaveProperty('comparisonContext');

      expect(assessment.nearnessFit).toBeGreaterThanOrEqual(0);
      expect(assessment.nearnessFit).toBeLessThanOrEqual(1);
      expect(assessment.nicenessFit).toBeGreaterThanOrEqual(0);
      expect(assessment.nicenessFit).toBeLessThanOrEqual(1);
    });

    test('should generate meaningful reasoning', () => {
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0];

      expect(assessment.reasoning.nearness.length).toBeGreaterThan(0);
      expect(assessment.reasoning.niceness.length).toBeGreaterThan(0);
      expect(Array.isArray(assessment.reasoning.concerns)).toBeTruthy();
    });

    test('should provide comparison context', () => {
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0];

      expect(assessment.comparisonContext).toHaveProperty('betterThan');
      expect(assessment.comparisonContext).toHaveProperty('uniqueAdvantages');
      expect(assessment.comparisonContext.betterThan).toBeGreaterThanOrEqual(0);
      expect(assessment.comparisonContext.betterThan).toBeLessThanOrEqual(100);
    });

    test('should handle single location assessment', () => {
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, defaultUserContext, [mockLocation1]);

      expect(assessment.comparisonContext.betterThan).toBe(0);
      expect(assessment.comparisonContext.uniqueAdvantages.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Location Ranking', () => {
    test('should rank locations by overall score', () => {
      const assessments = intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);

      expect(assessments.length).toBe(mockLocations.length);

      // Should be sorted by overall score descending
      for (let i = 0; i < assessments.length - 1; i++) {
        expect(assessments[i].overallScore).toBeGreaterThanOrEqual(assessments[i + 1].overallScore);
      }
    });

    test('should provide relative comparisons between locations', () => {
      const assessments = intelligence.generateContextualRecommendations(mockLocations, defaultUserContext);

      // Each location should have comparison context
      assessments.forEach(assessment => {
        expect(assessment.comparisonContext.betterThan).toBeGreaterThanOrEqual(0);
        expect(assessment.comparisonContext.betterThan).toBeLessThanOrEqual(100);
      });
    });

    test('should handle empty location list', () => {
      const assessments = intelligence.generateContextualRecommendations([], defaultUserContext);

      expect(assessments).toEqual([]);
    });

    test('should handle different user contexts consistently', () => {
      const photographyContext = { ...defaultUserContext, intendedActivity: 'photography' as const };
      const campingContext = { ...defaultUserContext, intendedActivity: 'camping' as const };

      const photoRanking = intelligence.generateContextualRecommendations(mockLocations, photographyContext);
      const campingRanking = intelligence.generateContextualRecommendations(mockLocations, campingContext);

      expect(photoRanking.length).toBe(campingRanking.length);
      // Rankings might differ based on activity
      expect(photoRanking).toBeDefined();
      expect(campingRanking).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing weather data gracefully', () => {
      const incompleteLocation: WeatherLocation = {
        id: '4',
        name: 'Incomplete Data',
        lat: 45.0,
        lng: -94.0,
        temperature: 0,
        condition: '',
        description: '',
        precipitation: 0,
        windSpeed: 0
      };

      expect(() => {
        intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](incompleteLocation, defaultUserContext, [incompleteLocation]);
      }).not.toThrow();
    });

    test('should handle extreme weather values', () => {
      const extremeWeather: WeatherLocation = {
        ...mockLocation1,
        temperature: -40,
        precipitation: 100,
        windSpeed: 50
      };

      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](extremeWeather, defaultUserContext, [extremeWeather]);

      expect(assessment.nicenessFit).toBeLessThan(0.3);
      expect(assessment.reasoning.concerns.length).toBeGreaterThan(0);
    });

    test('should handle undefined user context fields', () => {
      const minimalContext: UserContext = {};

      expect(() => {
        intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, minimalContext, mockLocations);
      }).not.toThrow();
    });

    test('should handle invalid coordinates', () => {
      const invalidLocation: WeatherLocation = {
        ...mockLocation1,
        lat: 200, // Invalid latitude
        lng: 400  // Invalid longitude
      };

      expect(() => {
        intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](invalidLocation, defaultUserContext, [invalidLocation]);
      }).not.toThrow();
    });

    test('should handle very large datasets', () => {
      // Create a large dataset to test performance
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockLocation1,
        id: `location-${i}`,
        name: `Location ${i}`,
        lat: 44 + Math.random(),
        lng: -93 + Math.random(),
        temperature: 50 + Math.random() * 40
      }));

      expect(() => {
        intelligence.generateContextualRecommendations(largeDataset, defaultUserContext);
      }).not.toThrow();
    });
  });

  describe('Activity-Specific Optimization', () => {
    test('should optimize for hiking conditions', () => {
      const hikingContext = { ...defaultUserContext, intendedActivity: 'hiking' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, hikingContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('hiking'))).toBeTruthy();
    });

    test('should optimize for fishing conditions', () => {
      const fishingContext = { ...defaultUserContext, intendedActivity: 'fishing' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation2], fishingContext)[0];

      expect(assessment.reasoning.niceness.some(r => r.includes('fishing'))).toBeTruthy();
    });

    test('should optimize for photography conditions', () => {
      const photoContext = { ...defaultUserContext, intendedActivity: 'photography' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, photoContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('photography'))).toBeTruthy();
    });

    test('should optimize for camping conditions', () => {
      const campingContext = { ...defaultUserContext, intendedActivity: 'camping' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation3, campingContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('camping'))).toBeTruthy();
    });

    test('should handle sightseeing activity', () => {
      const sightseeingContext = { ...defaultUserContext, intendedActivity: 'sightseeing' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, sightseeingContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('sightseeing'))).toBeTruthy();
    });

    test('should handle general activity', () => {
      const generalContext = { ...defaultUserContext, intendedActivity: 'general' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, generalContext, mockLocations);

      expect(assessment).toBeDefined();
      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Seasonal Intelligence', () => {
    test('should apply spring weather preferences', () => {
      const springContext = { ...defaultUserContext, season: 'spring' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, springContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('spring'))).toBeTruthy();
    });

    test('should apply summer weather preferences', () => {
      const summerContext = { ...defaultUserContext, season: 'summer' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, summerContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('summer'))).toBeTruthy();
    });

    test('should apply fall weather preferences', () => {
      const fallContext = { ...defaultUserContext, season: 'fall' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, fallContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('fall'))).toBeTruthy();
    });

    test('should apply winter weather preferences', () => {
      const winterContext = { ...defaultUserContext, season: 'winter' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, winterContext, mockLocations);

      expect(assessment.reasoning.niceness.some(r => r.includes('winter'))).toBeTruthy();
    });
  });

  describe('Infrastructure Considerations', () => {
    test('should handle any infrastructure preference', () => {
      const anyInfraContext = { ...defaultUserContext, infrastructure: 'any' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, anyInfraContext, mockLocations);

      expect(assessment).toBeDefined();
    });

    test('should handle basic infrastructure preference', () => {
      const basicInfraContext = { ...defaultUserContext, infrastructure: 'basic' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, basicInfraContext, mockLocations);

      expect(assessment).toBeDefined();
    });

    test('should handle full services infrastructure preference', () => {
      const fullInfraContext = { ...defaultUserContext, infrastructure: 'full_services' as const };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation1, fullInfraContext, mockLocations);

      expect(assessment).toBeDefined();
    });
  });

  describe('Travel Willingness Impact', () => {
    test('should respect low travel willingness', () => {
      const lowTravelContext = { ...defaultUserContext, travelWillingness: 10 };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation3, lowTravelContext, mockLocations);

      expect(assessment.nearnessFit).toBeLessThan(0.3);
    });

    test('should accommodate high travel willingness', () => {
      const highTravelContext = { ...defaultUserContext, travelWillingness: 200 };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation3, highTravelContext, mockLocations);

      expect(assessment.nearnessFit).toBeGreaterThan(0.5);
    });

    test('should handle moderate travel willingness', () => {
      const moderateTravelContext = { ...defaultUserContext, travelWillingness: 50 };
      const assessment = intelligence.generateContextualRecommendations([mockLocation1], defaultUserContext)[0](mockLocation2, moderateTravelContext, mockLocations);

      expect(assessment.nearnessFit).toBeGreaterThan(0.3);
      expect(assessment.nearnessFit).toBeLessThan(1.0);
    });
  });
});
