/**
 * Database Connection Validation Tests
 * 
 * These tests prevent the database connection issues we encountered:
 * - Malformed DATABASE_URL (psql wrapper problems)
 * - Environment variable conflicts
 * - Connection string format validation
 * - SSL configuration issues
 */

const { Pool } = require('pg');

describe('Database Connection Validation', () => {
  
  test('DATABASE_URL should be properly formatted', () => {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      // Should start with postgresql:// not psql 'postgresql://
      expect(databaseUrl).toMatch(/^postgresql:\/\//);
      expect(databaseUrl).not.toMatch(/^psql\s+'/);
      
      // Should not have trailing quotes
      expect(databaseUrl).not.toMatch(/'$/);
      
      // Should contain required components
      expect(databaseUrl).toMatch(/@.+\/.+/); // @ for auth, / for database
      
      // Should have SSL mode for Neon
      if (databaseUrl.includes('neon.tech')) {
        expect(databaseUrl).toMatch(/sslmode=require/);
      }
    }
  });

  test('database connection should work with current configuration', async () => {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn('DATABASE_URL not set, skipping connection test');
      return;
    }

    const pool = new Pool({
      connectionString: connectionString,
      ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      max: 1, // Use minimal connection for testing
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    let client;
    try {
      client = await pool.connect();
      
      // Test basic query
      const result = await client.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
      
    } catch (error) {
      fail(`Database connection failed: ${error.message}`);
    } finally {
      if (client) client.release();
      await pool.end();
    }
  }, 10000);

  test('user_feedback table should exist and be accessible', async () => {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn('DATABASE_URL not set, skipping table test');
      return;
    }

    const pool = new Pool({
      connectionString: connectionString,
      ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    let client;
    try {
      client = await pool.connect();
      
      // Check if user_feedback table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_feedback'
        );
      `);
      
      expect(tableCheck.rows[0].exists).toBe(true);
      
      // Test table structure
      const columnCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_feedback'
        ORDER BY ordinal_position;
      `);
      
      const columns = columnCheck.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('feedback_text');
      expect(columns).toContain('email');
      expect(columns).toContain('rating');
      expect(columns).toContain('categories');
      expect(columns).toContain('created_at');
      
    } catch (error) {
      fail(`Table validation failed: ${error.message}`);
    } finally {
      if (client) client.release();
      await pool.end();
    }
  }, 10000);

  test('should not have hardcoded localhost database URLs', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check for hardcoded localhost URLs in API files
    const apiFiles = [
      path.join(__dirname, '../../api/feedback.ts'),
      path.join(__dirname, '../../api/setup-database.ts'),
      path.join(__dirname, '../../api/feedback-list.ts')
    ];

    apiFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toMatch(/postgresql:\/\/.*localhost/);
        expect(content).not.toMatch(/postgres:\/\/.*localhost/);
      }
    });
  });

  test('environment variables should be validated', () => {
    const requiredEnvVars = ['DATABASE_URL'];
    
    // In production/test environments, these should be set
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined();
        expect(process.env[envVar]).not.toBe('');
      });
    }
  });
});