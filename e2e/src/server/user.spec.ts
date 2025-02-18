import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

describe('POST /api/users', () => {
  it('should return 201 if user is authenticated', async () => {
    const auth = await axios.post(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA`,
      {
        email: 'user@email.com',
        password: 'password',
        returnSecureToken: true,
      }
    );

    expect(auth.status).toBe(200);
    const token = auth.data.idToken;
    console.log(token);

    const userResponse = await axios.post(
      '/api/users',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(userResponse.status).toBe(201);
  });

  it('should return 401 if user is not authenticated', async () => {
    try {
      await axios.post('/api/users', {});
    } catch (e) {
      expect(e.status).toBe(401);
    }
  });
});
