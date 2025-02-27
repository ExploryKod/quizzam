import request from 'supertest';
import { defaultFirebaseUrl, defaultUrl } from '../constants';
import jwt, { JwtPayload } from 'jsonwebtoken';

describe('POST /api/users', () => {
  it('should return 201 if user is authenticated', async () => {

    const auth = await request(defaultFirebaseUrl).post('').send({
      email: 'user@email.com',
      password: 'password',
      returnSecureToken: true,
    });

    console.log('Authentication response:', auth.body);
    expect(auth.status).toBe(200);
    const token = auth.body.idToken;

    const userResponse = await request(defaultUrl)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'TestUser' });
    
    console.log('User creation response:', userResponse.body);
    expect(userResponse.status).toBe(201);
  });

  it('should return 401 if user is not authenticated', async () => {
    console.log('Sending request without authentication...');
    const response = await request(defaultUrl).post('/api/users').send({ username: 'TestUser' });
    
    console.log('Unauthorized request response:', response.body);
    expect(response.status).toBe(401);
  });

});

describe('GET /api/users/me', () => { 
  let token: string;

  beforeAll(async () => {
    console.log('Authenticating user for /api/users/me test...');
    const auth = await request(defaultFirebaseUrl).post('').send({
      email: 'user@email.com',
      password: 'password',
      returnSecureToken: true,
    });
    expect(auth.status).toBe(200);
    token = auth.body.idToken;
  });

  it('should retrieve data of the currently connected user', async () => {
    try {
      const userResponse = await request(defaultUrl)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(userResponse.status).toBe(200);
      expect(userResponse.body).toHaveProperty('uid');
      expect(userResponse.body).toHaveProperty('username');
      expect(userResponse.body).toHaveProperty('email');
      
      const decodedToken = jwt.decode(token) as JwtPayload;
      expect(userResponse.body.uid).toBe(decodedToken.user_id);
      console.log('User ID:', userResponse.body.uid);
      
    } catch (e) {
      console.error('Error during the request:', e);
      throw e;
    }
  });
  
  it('should return 401 if user is not authenticated', async () => {
    try {
      await request(defaultUrl).get('/api/users/me');
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });

});
