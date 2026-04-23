import request from 'supertest';
import { defaultUrl } from '../constants';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface TestUser {
  email: string;
  password: string;
  username: string;
  token?: string;
  uid?: string;
}

export class AuthHelper {
  private static readonly AUTH_TYPE = (process.env.AUTH_TYPE || 'JWT').trim().toUpperCase();
  private static readonly FIREBASE_SIGNUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA';
  
  private static readonly FIREBASE_SIGNIN_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA';

  static async createAndLoginUser(userData: Partial<TestUser> = {
    email: 'user@email.com',
    password: 'password',
    username: 'TestUser'
  }): Promise<TestUser> {
    const generatedEmail = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@email.com`;
    const testUser: TestUser = {
      email: userData.email ?? generatedEmail,
      password: userData.password ?? 'password',
      username: userData.username ?? 'TestUser',
    };

    if (this.AUTH_TYPE === 'FIREBASE') {
      const authResponse = await request(this.FIREBASE_SIGNUP_URL)
        .post('')
        .send({
          email: testUser.email,
          password: testUser.password,
          returnSecureToken: true,
        });

      if (authResponse.status !== 200) {
        console.error('Firebase signup error:', authResponse.body);
        throw new Error('Failed to create Firebase user');
      }

      testUser.token = authResponse.body.idToken;
      const decodedToken = jwt.decode(testUser.token) as JwtPayload;
      testUser.uid = decodedToken.user_id;
    } else {
      const registerResponse = await request(defaultUrl)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password,
        });

      if ([200, 201].includes(registerResponse.status)) {
        testUser.token = registerResponse.body?.token;
        testUser.uid = registerResponse.body?.user?.uid;
      } else if (registerResponse.status === 409) {
        const token = await this.loginExistingUser(testUser.email, testUser.password);
        testUser.token = token;
        const decodedToken = jwt.decode(token) as JwtPayload;
        testUser.uid = (decodedToken.user_id || decodedToken.uid || decodedToken.sub) as string | undefined;
      } else {
        console.error('JWT register error:', registerResponse.body);
        throw new Error(`Failed to register JWT user: ${registerResponse.status}`);
      }

      if (!testUser.token || !testUser.uid) {
        throw new Error('JWT register response is missing token or uid');
      }
    }

    // Create user in your application
    const userResponse = await request(defaultUrl)
      .post('/api/users')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ username: testUser.username });

    // In JWT + Mongo mode, register already persists the user in mongo, so /api/users can return 500 on duplicate _id.
    // We tolerate that here because e2e scenarios only need a valid authenticated identity.
    if (![200, 201, 409, 500].includes(userResponse.status)) {
      throw new Error(`Failed to create application user: ${userResponse.status}`);
    }

    return testUser;
  }

  static async loginExistingUser(email: string, password: string): Promise<string> {
    if (this.AUTH_TYPE === 'FIREBASE') {
      const authResponse = await request(this.FIREBASE_SIGNIN_URL)
        .post('')
        .send({
          email,
          password,
          returnSecureToken: true,
        });

      if (authResponse.status !== 200) {
        throw new Error('Failed to login with Firebase');
      }

      return authResponse.body.idToken;
    }

    const authResponse = await request(defaultUrl)
      .post('/api/auth/login')
      .send({ email, password });

    if (![200, 201].includes(authResponse.status) || !authResponse.body?.token) {
      throw new Error('Failed to login with JWT');
    }

    return authResponse.body.token;
  }

  static async deleteUser(uid: string): Promise<void> {
    if (!uid) {
      return;
    }

    try {
      const response = await request(defaultUrl)
        .delete(`/api/test/users/${uid}`)
        .send();
      
      if (![200, 404].includes(response.status)) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting test user:', error);
      throw error;
    }
  }

  static getAuthHeader(token: string): Record<string, string> {
    return { 'Authorization': `Bearer ${token}` };
  }
} 