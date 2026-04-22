import request from 'supertest';
import { defaultUrl } from '../constants';

describe('GET /api/ping', () => {
  it('should return ping status payload on get', async () => {
    const response = await request(defaultUrl).get('/api/ping');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: expect.any(String),
      details: {
        database: expect.any(String),
      },
    });
  });

  it('should expose valid status values', async () => {
    const res = await request(defaultUrl).get('/api/ping');

    expect(res.status).toBe(200);
    expect(['OK', 'KO', 'Partial']).toContain(res.body.status);
    expect(['OK', 'KO']).toContain(res.body.details.database);
  });
});
