import request from 'supertest';
import { defaultUrl } from '../constants';
import { AuthHelper, TestUser } from '../helpers/auth.helper';

describe('POST /api/users', () => {
  
  it('should return 201 if user is authenticated', async () => {
    const testUser = await AuthHelper.createAndLoginUser();
    expect(testUser.token).toBeDefined();
    expect(testUser.uid).toBeDefined();

    await AuthHelper.deleteUser(testUser.uid);
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(defaultUrl)
      .post('/api/users')
      .send({ username: 'TestUser' });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/users/me', () => { 
  let testUser: TestUser;

  beforeAll(async () => {
    testUser = await AuthHelper.createAndLoginUser();
  });

  afterAll(async () => {
    await AuthHelper.deleteUser(testUser.uid);
  });

  it('should retrieve data of the currently connected user', async () => {
    const userResponse = await request(defaultUrl)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${testUser.token}`);
    
    expect(userResponse.status).toBe(200);
    expect(userResponse.body).toHaveProperty('uid');
    expect(userResponse.body).toHaveProperty('username');
    expect(userResponse.body).toHaveProperty('email');
    
    expect(userResponse.body.uid).toBe(testUser.uid);
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(defaultUrl).get('/api/users/me');
    expect(response.status).toBe(401);
  });
});
