import request from 'supertest';
import { defaultFirebaseUrl, defaultUrl } from '../constants';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthHelper, TestUser } from '../helpers/auth.helper';

describe('POST /api/users', () => {
  it('should return 201 if user is authenticated', async () => {
    const testUser = await AuthHelper.createAndLoginUser({
      email: 'user@email.com',
      password: 'password',
      username: 'TestUser'
    });

    console.log('Created user:', testUser);
    expect(testUser.token).toBeDefined();
    expect(testUser.uid).toBeDefined();
  });

  it('should return 401 if user is not authenticated', async () => {
    console.log('Sending request without authentication...');
    const response = await request(defaultUrl)
      .post('/api/users')
      .send({ username: 'TestUser' });
    
    console.log('Unauthorized request response:', response.body);
    expect(response.status).toBe(401);
  });

});

describe('GET /api/users/me', () => { 
  let testUser: TestUser;

  beforeAll(async () => {
    console.log('Creating and authenticating user for /api/users/me test...');
    testUser = await AuthHelper.createAndLoginUser({
      email: 'user@email.com',
      password: 'password',
      username: 'TestUser'
    });
  });

  it('should retrieve data of the currently connected user', async () => {
    try {
      const userResponse = await request(defaultUrl)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testUser.token}`);
      
      expect(userResponse.status).toBe(200);
      expect(userResponse.body).toHaveProperty('uid');
      expect(userResponse.body).toHaveProperty('username');
      expect(userResponse.body).toHaveProperty('email');
      
      expect(userResponse.body.uid).toBe(testUser.uid);
      console.log('Body ==> ', userResponse.body);
      
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
