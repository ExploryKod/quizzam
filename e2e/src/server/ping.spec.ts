import axios from 'axios';

describe('GET /api/ping', () => {
    it('Should return a 200 status code', async () => {
        const res = await axios.get('/api/ping');
        expect(res.status).toBe(200);
        expect(res.data).toEqual({message: 'Pong!', status: 200});
    })
})