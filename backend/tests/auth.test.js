const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/database');
const User = require('../src/models/User');

// Test database setup
const testDb = {
  host: 'localhost',
  user: 'root',
  password: 'test_password',
  database: 'insurance_advisor_test'
};

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Setup test database
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'insurance_advisor_test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    // Clean test database
    await db.query('DROP DATABASE IF EXISTS insurance_advisor_test');
    await db.query('CREATE DATABASE insurance_advisor_test');
    await db.query('USE insurance_advisor_test');
    
    // Create tables (simplified for testing)
    await db.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        account_type ENUM('parent', 'child', 'grandchild') NOT NULL,
        plan_type ENUM('standard', 'master', 'exceed') DEFAULT 'standard',
        parent_id INT NULL,
        customer_limit INT DEFAULT 10,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  afterAll(async () => {
    await db.query('DROP DATABASE IF EXISTS insurance_advisor_test');
    await db.close();
  });

  beforeEach(async () => {
    // Clear test data
    await db.query('DELETE FROM user_sessions');
    await db.query('DELETE FROM users');
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