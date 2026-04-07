import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

describe('Level Categories API', () => {

  it('GET /api/level-categories should deny access if no dev bypass is provided', async () => {
    const res = await request(app)
      .get('/api/level-categories');
    
    // According to our authCheck, we should get 401
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Unauthorized');
  });

  it('GET /api/level-categories should allow access with dev bypass header', async () => {
    // We send our fake bypass header
    const res = await request(app)
      .get('/api/level-categories')
      .set('x-dev-user-id', 'test_user_123');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    
    // We expect the data to have an array of categories
    if (res.body.data.levelCategories) {
      expect(Array.isArray(res.body.data.levelCategories)).toBe(true);
    }
  });

});
