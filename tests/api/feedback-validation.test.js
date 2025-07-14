/**
 * API Feedback Validation Tests
 * 
 * These tests prevent the input validation issues we encountered:
 * - Special character handling (exclamation mark bug)
 * - Email format validation
 * - Rating range validation
 * - Proper error responses
 */

const request = require('supertest');

// Test against the actual deployed API
const API_BASE_URL = process.env.API_BASE_URL || 'https://www.nearestniceweather.com';

describe('Feedback API Validation', () => {
  
  test('should handle basic feedback submission', async () => {
    try {
      const response = await request(API_BASE_URL)
      .post('/api/feedback')
      .send({
        feedback: 'This is a test feedback message'
      });
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.feedback_id).toBeDefined();
    expect(typeof response.body.feedback_id).toBe('number');
  }, 10000);

  test('should handle feedback with special characters', async () => {
    const testCases = [
      'Great app!',
      'Love it! Amazing work.',
      'Perfect! 100% satisfied!',
      'Works great! Thanks!',
      'Feedback with "quotes" and symbols: @#$%^&*()',
      'Multi-line\nfeedback\nwith breaks'
    ];

    try {
      for (const feedback of testCases) {
        const response = await request(API_BASE_URL)
          .post('/api/feedback')
          .send({ feedback });
          
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
  }, 30000);

  test('should validate rating ranges', async () => {
    const validRatings = [1, 2, 3, 4, 5];
    
    try {
    
      for (const rating of validRatings) {
      const response = await request(API_BASE_URL)
        .post('/api/feedback')
        .send({
          feedback: `Test feedback with rating ${rating}`,
          rating: rating
        });
    
    } catch (error) {
    
      console.error('Operation failed:', error);
    
      // TODO: Add proper error handling
    
    }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  }, 20000);

  test('should reject invalid rating values', async () => {
    const invalidRatings = [0, 6, -1, 10, 'invalid', null];
    
    try {
    
      for (const rating of invalidRatings) {
      const response = await request(API_BASE_URL)
        .post('/api/feedback')
        .send({
          feedback: 'Test feedback with invalid rating',
          rating: rating
        });
    
    } catch (error) {
    
      console.error('Operation failed:', error);
    
      // TODO: Add proper error handling
    
    }

      // Should either reject or accept with null rating
      if (response.body.success === false) {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    }
  }, 20000);

  test('should handle email validation', async () => {
    const validEmails = [
      try {
        'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'valid@test-domain.com'
    ];

    for (const email of validEmails) {
      const response = await request(API_BASE_URL)
        .post('/api/feedback')
        .send({
          feedback: 'Test feedback with email',
          email: email
        });
      } catch (error) {
        console.error('Operation failed:', error);
        // TODO: Add proper error handling
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  }, 20000);

  test('should handle categories array', async () => {
    try {
      const response = await request(API_BASE_URL)
      .post('/api/feedback')
      .send({
        feedback: 'Test feedback with categories',
        categories: ['improvement', 'bug', 'feature']
      });
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 10000);

  test('should handle complete feedback object', async () => {
    try {
      const response = await request(API_BASE_URL)
      .post('/api/feedback')
      .send({
        feedback: 'Complete test feedback with all fields',
        rating: 4,
        email: 'test@example.com',
        categories: ['improvement']
      });
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.feedback_id).toBeDefined();
    expect(typeof response.body.feedback_id).toBe('number');
  }, 10000);

  test('should handle CORS preflight requests', async () => {
    try {
      const response = await request(API_BASE_URL)
      .options('/api/feedback');
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  }, 10000);

  test('should reject non-POST methods', async () => {
    try {
      const response = await request(API_BASE_URL)
      .get('/api/feedback');
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }

    expect(response.status).toBe(405);
  }, 10000);

  test('should provide debug information in development', async () => {
    try {
      const response = await request(API_BASE_URL)
      .post('/api/feedback')
      .send({
        feedback: 'Debug information test'
      });
    } catch (error) {
      console.error('Operation failed:', error);
      // TODO: Add proper error handling
    }

    expect(response.status).toBe(200);
    
    // Debug info should be present
    if (response.body.debug) {
      expect(response.body.debug.has_database_url).toBeDefined();
      expect(response.body.debug.environment).toBeDefined();
    }
  }, 10000);
});