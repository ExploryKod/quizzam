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

  private static readonly FIREBASE_SIGNUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA';
  
  private static readonly FIREBASE_SIGNIN_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA';

  static async createAndLoginUser(userData: Partial<TestUser> = {
    email: 'user@email.com',
    password: 'password',
    username: 'TestUser'
  }): Promise<TestUser> {
    
    const testUser: TestUser = {
      email: userData.email,
      password: userData.password,
      username: userData.username,
    };

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
    const authResponse = await request(this.FIREBASE_SIGNIN_URL)
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

  static async deleteUser(uid: string): Promise<void> {
    try {
      const response = await request(defaultUrl)
        .delete(`/api/test/users/${uid}`)
        .send();
      
      if (response.status !== 200) {
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