import axios from 'axios';

describe('GET /api/ping', () => {
    it('Should return a 200 status code and a pong message', async () => {
        const res = await axios.get('/api/ping');
        expect(res.status).toBe(200);
        expect(res.data.response).toEqual('pong');
    })

    it('Should return the version of the database', async () => {
        const res = await axios.get('/api/ping');

        expect(res.status).toBe(200);
        expect(res.data).toEqual({
            response: "pong",
            version: {
                status: "OK",
                details: {
                    database: "Database running - version 2"
                }
            }
        });
    })

    

})