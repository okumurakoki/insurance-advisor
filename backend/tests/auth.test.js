const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/database-factory');
const User = require('../src/models/User');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Setup test environment - use production Supabase database
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

    // Initialize database connection
    await db.initialize();

    console.log('✅ Test database connected successfully');
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clear test data from test users only
    await db.query('DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE user_id LIKE \'test%\')');
    await db.query('DELETE FROM users WHERE user_id LIKE \'test%\'');
  });

  describe('POST /api/auth/register', () => {
    test('Should register a new parent user', async () => {
      const userData = {
        userId: 'test001',
        password: 'password123',
        accountType: 'parent',
        planType: 'standard'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('userId');
    });

    test('Should reject registration with invalid data', async () => {
      const userData = {
        userId: 'ab', // Too short
        password: '123', // Too short
        accountType: 'invalid'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    test('Should reject duplicate user ID', async () => {
      // Create first user
      await User.create({
        userId: 'test001',
        password: 'password123',
        accountType: 'parent'
      });

      const userData = {
        userId: 'test001',
        password: 'password456',
        accountType: 'parent'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        userId: 'test001',
        password: 'password123',
        accountType: 'parent',
        planType: 'standard'
      });
    });

    test('Should login with valid credentials', async () => {
      const loginData = {
        userId: 'test001',
        password: 'password123',
        accountType: 'parent'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.userId).toBe('test001');
    });

    test('Should reject login with invalid password', async () => {
      const loginData = {
        userId: 'test001',
        password: 'wrongpassword',
        accountType: 'parent'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('Should reject login with non-existent user', async () => {
      const loginData = {
        userId: 'nonexistent',
        password: 'password123',
        accountType: 'parent'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('Should reject login with missing fields', async () => {
      const loginData = {
        userId: 'test001'
        // Missing password and accountType
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/verify', () => {
    let token;

    beforeEach(async () => {
      // Create test user and get token
      await User.create({
        userId: 'test001',
        password: 'password123',
        accountType: 'parent'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'test001',
          password: 'password123',
          accountType: 'parent'
        });

      token = loginResponse.body.token;
    });

    test('Should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
    });

    test('Should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(403);
    });

    test('Should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      await User.create({
        userId: 'test001',
        password: 'password123',
        accountType: 'parent'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'test001',
          password: 'password123',
          accountType: 'parent'
        });

      token = loginResponse.body.token;
    });

    test('Should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});