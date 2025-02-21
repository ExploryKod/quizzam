import request from 'supertest';
import { defaultFirebaseUrl, defaultUrl } from '../constants';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface TestUser {
  email: string;
  password: string;
  username: string;
  token?: string;
  uid?: string;
}

export class AuthHelper {
  static async createAndLoginUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const testUser: TestUser = {
      email: userData.email || `test-${Date.now()}@example.com`,
      password: userData.password || 'testPassword123',
      username: userData.username || `testUser-${Date.now()}`,
    };

    // Register the user with Firebase
    const authResponse = await request(defaultFirebaseUrl)
      .post('')
      .send({
        email: testUser.email,
        password: testUser.password,
        returnSecureToken: true,
      });

    if (authResponse.status !== 200) {
      throw new Error('Failed to create Firebase user');
    }

    testUser.token = authResponse.body.idToken;
    const decodedToken = jwt.decode(testUser.token) as JwtPayload;
    testUser.uid = decodedToken.user_id;

    // Create user in your application
    const userResponse = await request(defaultUrl)
      .post('/api/users')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ username: testUser.username });

    if (userResponse.status !== 201) {
      throw new Error('Failed to create application user');
    }

    return testUser;
  }

  static async loginExistingUser(email: string, password: string): Promise<string> {
    const authResponse = await request(defaultFirebaseUrl)
      .post('')
      .send({
        email,
        password,
        returnSecureToken: true,
      });

    if (authResponse.status !== 200) {
      throw new Error('Failed to login');
    }

    return authResponse.body.idToken;
  }
} 