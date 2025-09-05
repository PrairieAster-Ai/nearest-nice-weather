/**
 * Weather Utility Unit Tests
 * Testing weather-related utility functions
 */

// Weather utilities for testing
function filterPOIsByWeather(pois, filters) {
  if (!pois || !Array.isArray(pois)) return [];
  if (!filters) return pois;

  return pois.filter(poi => {
    if (filters && filters.temperature) {
      const temp = poi.temperature;
      switch (filters.temperature) {
        case 'cold':
          if (temp >= 60) return false;
          break;
        case 'mild':
          if (temp < 60 || temp > 80) return false;
          break;
        case 'hot':
          if (temp <= 80) return false;
          break;
      }
    }

    if (filters.precipitation) {
      const precip = poi.precipitation;
      switch (filters.precipitation) {
        case 'none':
          if (precip > 20) return false;
          break;
        case 'light':
          if (precip <= 20 || precip > 60) return false;
          break;
        case 'heavy':
          if (precip <= 60) return false;
          break;
      }
    }

    if (filters.wind) {
      const wind = poi.windSpeed;
      switch (filters.wind) {
        case 'calm':
          if (wind > 10) return false;
          break;
        case 'breezy':
          if (wind <= 10 || wind > 20) return false;
          break;
        case 'windy':
          if (wind <= 20) return false;
          break;
      }
    }

    return true;
  });
}

function getWeatherDescription(temperature, condition, precipitation) {
  const temp = temperature || 70;
  const precip = precipitation || 0;

  let description = `${temp}°F, ${condition || 'Clear'}`;

  if (precip > 0) {
    description += `, ${precip}% chance of precipitation`;
  }

  return description;
}

describe('Weather Utilities', () => {
  const mockPOIs = [
    { id: '1', name: 'Cold Park', temperature: 45, precipitation: 10, windSpeed: 5 },
    { id: '2', name: 'Mild Park', temperature: 70, precipitation: 0, windSpeed: 8 },
    { id: '3', name: 'Hot Park', temperature: 85, precipitation: 5, windSpeed: 12 },
    { id: '4', name: 'Rainy Park', temperature: 65, precipitation: 80, windSpeed: 25 }
  ];

  describe('filterPOIsByWeather', () => {
    test('should filter POIs by temperature preference', () => {
      const coldFiltered = filterPOIsByWeather(mockPOIs, { temperature: 'cold' });
      expect(coldFiltered).toHaveLength(1);
      expect(coldFiltered[0].name).toBe('Cold Park');

      const hotFiltered = filterPOIsByWeather(mockPOIs, { temperature: 'hot' });
      expect(hotFiltered).toHaveLength(1);
      expect(hotFiltered[0].name).toBe('Hot Park');
    });

    test('should filter POIs by precipitation preference', () => {
      const noneFiltered = filterPOIsByWeather(mockPOIs, { precipitation: 'none' });
      expect(noneFiltered).toHaveLength(3); // 3 POIs with <= 20% precipitation

      const heavyFiltered = filterPOIsByWeather(mockPOIs, { precipitation: 'heavy' });
      expect(heavyFiltered).toHaveLength(1);
      expect(heavyFiltered[0].name).toBe('Rainy Park');
    });

    test('should filter POIs by wind preference', () => {
      const calmFiltered = filterPOIsByWeather(mockPOIs, { wind: 'calm' });
      expect(calmFiltered).toHaveLength(2); // 2 POIs with <= 10 mph wind

      const windyFiltered = filterPOIsByWeather(mockPOIs, { wind: 'windy' });
      expect(windyFiltered).toHaveLength(1);
      expect(windyFiltered[0].name).toBe('Rainy Park');
    });

    test('should apply multiple filters', () => {
      const filtered = filterPOIsByWeather(mockPOIs, {
        temperature: 'mild',
        precipitation: 'none',
        wind: 'calm'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Mild Park');
    });

    test('should handle empty input gracefully', () => {
      expect(filterPOIsByWeather(null, {})).toEqual([]);
      expect(filterPOIsByWeather([], {})).toEqual([]);
      expect(filterPOIsByWeather(mockPOIs, null)).toEqual(mockPOIs);
    });
  });

  describe('getWeatherDescription', () => {
    test('should format weather description correctly', () => {
      const description = getWeatherDescription(72, 'Sunny', 0);
      expect(description).toBe('72°F, Sunny');
    });

    test('should include precipitation when present', () => {
      const description = getWeatherDescription(65, 'Cloudy', 30);
      expect(description).toBe('65°F, Cloudy, 30% chance of precipitation');
    });

    test('should handle missing data with defaults', () => {
      const description = getWeatherDescription();
      expect(description).toBe('70°F, Clear');
    });
  });
});
