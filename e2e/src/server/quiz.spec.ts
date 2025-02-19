import request from 'supertest';
import { defaultFirebaseUrl, defaultUrl } from '../constants';

describe('GET /api/quiz', () => {
  let token: string;

  beforeAll(async () => {
    const auth = await request(defaultFirebaseUrl).post('').send({
      email: 'user@email.com',
      password: 'password',
      returnSecureToken: true,
    });

    expect(auth.status).toBe(200);
    token = auth.body.idToken;
  });

  it('should return quizzes for the authenticated user', async () => {
    const response = await request(defaultUrl)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${token}`);

    console.log('Response:', response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('_links');
    expect(response.body._links).toHaveProperty('create');
  });

  it('should return 401 if user is not authenticated', async () => {
    try {
      await request(defaultUrl).get('/api/quiz');
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });
});
