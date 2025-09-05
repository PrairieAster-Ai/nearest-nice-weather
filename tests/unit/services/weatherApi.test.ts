/**
 * Comprehensive tests for weatherApi service
 * Achieving high coverage of weatherApi.ts
 */
import { weatherApi, WeatherApiError } from '../../../apps/web/src/services/weatherApi';
import type { Location } from '../../../apps/web/src/types/weather';
import type { FeedbackFormData } from '../../../apps/web/src/types/feedback';

// Mock global objects
global.fetch = jest.fn();
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: 'mock-signal',
  abort: jest.fn(),
}));
global.setTimeout = jest.fn().mockImplementation((fn, delay) => {
  // Execute immediately for testing
  if (delay > 0) {
    return 'mock-timeout-id';
  }
  fn();
  return 'mock-timeout-id';
});
global.clearTimeout = jest.fn();

// Mock window and navigator
const mockWindow = {
  location: {
    href: 'https://test.com/page'
  }
};

const mockNavigator = {
  userAgent: 'Test Browser 1.0'
};

// Only define if not already defined
if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
  });
} else {
  global.window = mockWindow;
}

if (typeof global.navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  });
} else {
  global.navigator = mockNavigator;
}

describe('WeatherApiError', () => {
  test('should create error with message only', () => {
    const error = new WeatherApiError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('WeatherApiError');
    expect(error.status).toBeUndefined();
    expect(error instanceof Error).toBe(true);
  });

  test('should create error with message and status', () => {
    const error = new WeatherApiError('API Error', 500);

    expect(error.message).toBe('API Error');
    expect(error.name).toBe('WeatherApiError');
    expect(error.status).toBe(500);
  });
});

describe('weatherApi.getLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (global.setTimeout as jest.Mock).mockClear();
    (global.clearTimeout as jest.Mock).mockClear();
  });

  test('should fetch locations successfully', async () => {
    const mockLocations: Location[] = [
      {
        id: 1,
        name: 'Minneapolis',
        latitude: 44.9778,
        longitude: -93.2650,
        state: 'MN',
        country: 'US'
      },
      {
        id: 2,
        name: 'Saint Paul',
        latitude: 44.9537,
        longitude: -93.0900,
        state: 'MN',
        country: 'US'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: mockLocations })
    });

    const result = await weatherApi.getLocations();

    expect(global.fetch).toHaveBeenCalledWith('/api/weather-locations', {
      method: 'GET',
      signal: 'mock-signal',
    });
    expect(result).toEqual(mockLocations);
    expect(global.clearTimeout).toHaveBeenCalled();
  });

  test('should handle empty data response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({})
    });

    const result = await weatherApi.getLocations();

    expect(result).toEqual([]);
  });

  test('should handle API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(weatherApi.getLocations()).rejects.toThrow(WeatherApiError);
    await expect(weatherApi.getLocations()).rejects.toThrow('Failed to fetch locations: Internal Server Error');

    try {
      await weatherApi.getLocations();
    } catch (error) {
      expect(error).toBeInstanceOf(WeatherApiError);
      expect((error as WeatherApiError).status).toBe(500);
    }
  });

  test('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(weatherApi.getLocations()).rejects.toThrow(WeatherApiError);
    await expect(weatherApi.getLocations()).rejects.toThrow('An unexpected error occurred while fetching locations');
  });

  test('should handle timeout/abort error', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    await expect(weatherApi.getLocations()).rejects.toThrow(WeatherApiError);
    await expect(weatherApi.getLocations()).rejects.toThrow('Request timed out. Please try again.');
  });

  test('should propagate WeatherApiError instances', async () => {
    const customError = new WeatherApiError('Custom API error', 400);
    (global.fetch as jest.Mock).mockRejectedValue(customError);

    await expect(weatherApi.getLocations()).rejects.toThrow('Custom API error');

    try {
      await weatherApi.getLocations();
    } catch (error) {
      expect(error).toBeInstanceOf(WeatherApiError);
      expect((error as WeatherApiError).status).toBe(400);
    }
  });

  test('should set up abort controller and timeout', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] })
    });

    await weatherApi.getLocations();

    expect(global.AbortController).toHaveBeenCalled();
    expect(global.setTimeout).toHaveBeenCalled();
  });
});

describe('weatherApi.submitFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (global.setTimeout as jest.Mock).mockClear();
    (global.clearTimeout as jest.Mock).mockClear();
  });

  test('should submit feedback successfully', async () => {
    const feedbackData: FeedbackFormData = {
      email: 'test@example.com',
      comment: 'Great service!',
      rating: 5,
      category: 'general'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({
        success: true,
        message: 'Feedback submitted successfully',
        feedback_id: 123
      })
    });

    const result = await weatherApi.submitFeedback(feedbackData);

    expect(global.fetch).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': expect.any(String),
      },
      body: expect.stringContaining('"email":"test@example.com"'),
      signal: 'mock-signal',
    });

    expect(result).toEqual({
      success: true,
      message: 'Feedback submitted successfully',
      id: 123,
    });
  });

  test('should submit feedback without email', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Anonymous feedback',
      rating: 4,
      category: 'bug'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        message: 'Feedback submitted',
        feedback_id: 456
      })
    });

    const result = await weatherApi.submitFeedback(feedbackData);

    // Verify the request body doesn't include email field when not provided
    const [, requestOptions] = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(requestOptions.body);

    expect(requestBody.email).toBeUndefined();
    expect(requestBody.feedback).toBe('Anonymous feedback');
    expect(requestBody.rating).toBe(4);
    expect(requestBody.category).toBe('bug');
    expect(requestBody.session_id).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(typeof requestBody.page_url).toBe('string');

    expect(result.success).toBe(true);
    expect(result.id).toBe(456);
  });

  test('should handle API error response for feedback', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    });

    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow(WeatherApiError);
    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow('Failed to submit feedback: Bad Request');
  });

  test('should handle API success=false response', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: false,
        error: 'Validation failed'
      })
    });

    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow(WeatherApiError);
    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow('Validation failed');
  });

  test('should handle API success=false without error message', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: false
      })
    });

    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow('Failed to submit feedback');
  });

  test('should handle timeout for feedback submission', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow('Request timed out. Please try again.');
  });

  test('should handle network error for feedback submission', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow('An unexpected error occurred while submitting feedback');
  });

  test('should propagate WeatherApiError instances for feedback', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    const customError = new WeatherApiError('Custom feedback error', 422);
    (global.fetch as jest.Mock).mockRejectedValue(customError);

    await expect(weatherApi.submitFeedback(feedbackData)).rejects.toThrow('Custom feedback error');

    try {
      await weatherApi.submitFeedback(feedbackData);
    } catch (error) {
      expect(error).toBeInstanceOf(WeatherApiError);
      expect((error as WeatherApiError).status).toBe(422);
    }
  });

  test('should handle response without message field', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 5,
      category: 'general'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        feedback_id: 789
      })
    });

    const result = await weatherApi.submitFeedback(feedbackData);

    expect(result).toEqual({
      success: true,
      message: 'Feedback submitted successfully',
      id: 789,
    });
  });

  test('should handle response without feedback_id field', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 5,
      category: 'general'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        message: 'Thank you for your feedback'
      })
    });

    const result = await weatherApi.submitFeedback(feedbackData);

    expect(result).toEqual({
      success: true,
      message: 'Thank you for your feedback',
      id: 0,
    });
  });

  test('should clean up timeout on both success and error', async () => {
    const feedbackData: FeedbackFormData = {
      comment: 'Test feedback',
      rating: 3,
      category: 'feature'
    };

    // Test success case
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });

    await weatherApi.submitFeedback(feedbackData);
    expect(global.clearTimeout).toHaveBeenCalled();

    jest.clearAllMocks();

    // Test error case
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    try {
      await weatherApi.submitFeedback(feedbackData);
    } catch (error) {
      // Expected to throw
    }

    expect(global.clearTimeout).toHaveBeenCalled();
  });
});
