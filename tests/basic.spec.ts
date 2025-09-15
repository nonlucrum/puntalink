import request from 'supertest';
import app from '../src/app.js';

describe('API básica', () => {
  it('health ok', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});
