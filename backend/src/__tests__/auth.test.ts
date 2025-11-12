import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

let app: any;
let accessToken: string;
let refreshToken: string;

const testUser = {
  username: 'testuser',
  password: 'testpass123',
};

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
});

afterAll(async () => {
  await User.deleteMany({ username: testUser.username });
  await mongoose.connection.close();
});

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    test('should create a new user', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    test('should reject duplicate username', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    test('should reject missing username', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ password: 'testpass123' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    test('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'newuser', password: '123' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(testUser)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wronguser', password: 'testpass123' })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'wrongpass' })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/user', () => {
    test('should get user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', accessToken)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should get new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
    });

    test('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});




