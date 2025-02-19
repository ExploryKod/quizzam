import request from 'supertest';
import { defaultUrl } from '../constants';

describe('GET /api/ping', () => {
    it('should return pong on get', async () => {
        const response = await request(defaultUrl).get('/api/ping');

        expect(response.status).toBe(200);
        expect(response.body.response).toBe('pong');
    });

    it('Should return the version of the database', async () => {
        const res = await request(defaultUrl).get('/api/ping');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
        response: 'pong',
        version: {
            status: 'OK',
            details: {
            database: 'Database running - version 2',
            },
        },
        });
    });
});
