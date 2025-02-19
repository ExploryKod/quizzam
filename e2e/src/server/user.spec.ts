import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const API_BASE_URL = 'http://localhost:3000';





describe('POST /api/users', () => {
  let token;

  beforeAll(async () => {
    // Authentification Firebase
    const auth = await axios.post(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA`,
      {
        email: 'user@email.com',
        password: 'password',
        returnSecureToken: true,
      }
    );

    expect(auth.status).toBe(200);
    token = auth.data.idToken;
  });

  it('should return 201 if user is authenticated', async () => {
    const userResponse = await axios.post(
      '/api/users',
      {username: 'TestUser'},
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
      await axios.post('/api/users',  { username: 'TestUser' });
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });

  it('should retrieve the uid from the token returned by the auth service', async () => {
    const decodedToken = jwt.decode(token);
    console.log('Decoded token:', decodedToken);

    const userResponse = await axios.post(
      `${API_BASE_URL}/api/users`,
      { username: 'AnotherTestUser' },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(userResponse.status).toBe(201);
    expect(userResponse.data).toHaveProperty('uid'); 

    const uidFromResponse = userResponse.data.uid;
    console.log('UID from API response:', uidFromResponse);
  });

});

describe('GET /api/users/me', () => {
  it('should retrieve data of the currently connected user', async () => {
    try {
      await axios.get('/api/users/me', {

      });
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });
})
