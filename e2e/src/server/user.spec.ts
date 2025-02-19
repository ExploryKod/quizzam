import axios from 'axios';
import dotenv from 'dotenv';
import jwt, { JwtPayload } from 'jsonwebtoken';
dotenv.config();

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

});

describe('GET /api/users/me', () => {
  let token;

  beforeAll(async () => {
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

  it('should retrieve data of the currently connected user', async () => {
    try {
      const userResponse = await axios.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(userResponse.status).toBe(200);
      expect(userResponse.data).toHaveProperty('uid');
      expect(userResponse.data).toHaveProperty('username');
      expect(userResponse.data).toHaveProperty('email');
      
      const decodedToken = jwt.decode(token) as JwtPayload;
      expect(userResponse.data.uid).toBe(decodedToken.user_id);
      console.log(userResponse.data.uid);
      
    } catch (e) {
      console.error('Error during the request:', e);
      throw e; 
    }
  });

  it('should return 401 if user is not authenticated', async () => {
    try {
      await axios.get('/api/users/me');
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });

});
