import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import mongoose from 'mongoose';

let app: any;
let user1Token: string;
let user2Token: string;
let user1Id: string;
let user2Id: string;

const user1 = {
  username: 'user1',
  password: 'password123',
};

const user2 = {
  username: 'user2',
  password: 'password123',
};

beforeAll(async () => {
  await connectDatabase();
  app = createApp();

  // Create test users
  const signup1 = await request(app).post('/api/auth/signup').send(user1);
  const signup2 = await request(app).post('/api/auth/signup').send(user2);

  user1Token = signup1.body.data.accessToken;
  user2Token = signup2.body.data.accessToken;
  user1Id = signup1.body.data.user._id || signup1.body.data.user.id;
  user2Id = signup2.body.data.user._id || signup2.body.data.user.id;
});

afterAll(async () => {
  await User.deleteMany({ username: { $in: [user1.username, user2.username] } });
  await Message.deleteMany({});
  await mongoose.connection.close();
});

describe('Message API', () => {
  describe('GET /api/message/users', () => {
    test('should get list of users', async () => {
      const response = await request(app)
        .get('/api/message/users')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/message/users')
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/message', () => {
    test('should get messages between users', async () => {
      const response = await request(app)
        .get('/api/message')
        .query({ channel: user2Id })
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should reject request without channel', async () => {
      const response = await request(app)
        .get('/api/message')
        .set('Authorization', user1Token)
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});






