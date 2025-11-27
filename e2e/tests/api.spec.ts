import { test, expect } from '@playwright/test';

test.describe('Backend API', () => {
  test('should have healthy backend service', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.info.database.status).toBe('up');
    expect(data.info.redis.status).toBe('up');
    expect(data.info.minio.status).toBe('up');
  });

  test('should have CORS headers configured', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    
    const headers = response.headers();
    // Check for CORS headers (adjust based on your configuration)
    expect(headers['access-control-allow-origin']).toBeDefined();
  });

  test('PDF worker should be healthy', async ({ request }) => {
    const response = await request.get('http://localhost:5001/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});

test.describe('API Endpoints', () => {
  test('should handle PDF upload endpoint', async ({ request }) => {
    // This test would require authentication and proper file upload
    // Placeholder for actual implementation
    const response = await request.post('http://localhost:3001/api/upload', {
      // Add proper headers and form data
    });
    
    // Adjust expectations based on your API response
    // expect(response.status()).toBe(401); // If auth is required
  });
});
