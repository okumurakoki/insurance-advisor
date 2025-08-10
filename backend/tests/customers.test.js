const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/database');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');

describe('Customer Management Tests', () => {
  let token;
  let userId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'insurance_advisor_test';
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  beforeEach(async () => {
    // Clean test data
    await db.query('DELETE FROM customers');
    await db.query('DELETE FROM users');

    // Create test user
    userId = await User.create({
      userId: 'test001',
      password: 'password123',
      accountType: 'parent',
      planType: 'standard',
      customerLimit: 10
    });

    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        userId: 'test001',
        password: 'password123',
        accountType: 'parent'
      });

    token = loginResponse.body.token;
  });

  describe('POST /api/customers', () => {
    test('Should create a new customer', async () => {
      const customerData = {
        name: '田中太郎',
        email: 'tanaka@example.com',
        phone: '03-1234-5678',
        contractDate: '2024-01-15',
        contractAmount: 1000000,
        monthlyPremium: 50000,
        riskTolerance: 'balanced',
        investmentGoal: '老後資金の準備',
        notes: 'テスト顧客'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message', 'Customer created successfully');
    });

    test('Should reject customer creation with missing required fields', async () => {
      const customerData = {
        name: '田中太郎'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(customerData);

      expect(response.status).toBe(400);
    });

    test('Should reject customer creation when limit is reached', async () => {
      // Create 10 customers (limit for standard plan)
      for (let i = 0; i < 10; i++) {
        await Customer.create({
          user_id: userId,
          name: `Customer ${i}`,
          contract_date: '2024-01-15',
          contract_amount: 1000000,
          monthly_premium: 50000
        });
      }

      const customerData = {
        name: '限界顧客',
        contractDate: '2024-01-15',
        contractAmount: 1000000,
        monthlyPremium: 50000
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(customerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Customer limit reached');
    });

    test('Should reject unauthorized access', async () => {
      const customerData = {
        name: '田中太郎',
        contractDate: '2024-01-15',
        contractAmount: 1000000,
        monthlyPremium: 50000
      };

      const response = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      // Create test customers
      await Customer.create({
        user_id: userId,
        name: '田中太郎',
        email: 'tanaka@example.com',
        contract_date: '2024-01-15',
        contract_amount: 1000000,
        monthly_premium: 50000,
        risk_tolerance: 'balanced'
      });

      await Customer.create({
        user_id: userId,
        name: '佐藤花子',
        email: 'sato@example.com',
        contract_date: '2024-01-20',
        contract_amount: 2000000,
        monthly_premium: 80000,
        risk_tolerance: 'aggressive'
      });
    });

    test('Should get list of customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBeDefined();
    });

    test('Should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/customers/:id', () => {
    let customerId;

    beforeEach(async () => {
      customerId = await Customer.create({
        user_id: userId,
        name: '田中太郎',
        contract_date: '2024-01-15',
        contract_amount: 1000000,
        monthly_premium: 50000
      });
    });

    test('Should get specific customer', async () => {
      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(customerId);
      expect(response.body.name).toBe('田中太郎');
    });

    test('Should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/customers/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/customers/:id', () => {
    let customerId;

    beforeEach(async () => {
      customerId = await Customer.create({
        user_id: userId,
        name: '田中太郎',
        contract_date: '2024-01-15',
        contract_amount: 1000000,
        monthly_premium: 50000
      });
    });

    test('Should update customer', async () => {
      const updateData = {
        name: '田中次郎',
        monthlyPremium: 60000,
        riskTolerance: 'aggressive'
      };

      const response = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Customer updated successfully');

      // Verify update
      const updatedCustomer = await Customer.findById(customerId);
      expect(updatedCustomer.name).toBe('田中次郎');
      expect(updatedCustomer.monthly_premium).toBe(60000);
    });

    test('Should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .put('/api/customers/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    let customerId;

    beforeEach(async () => {
      customerId = await Customer.create({
        user_id: userId,
        name: '田中太郎',
        contract_date: '2024-01-15',
        contract_amount: 1000000,
        monthly_premium: 50000
      });
    });

    test('Should delete customer (deactivate)', async () => {
      const response = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Customer deactivated successfully');

      // Verify deactivation
      const customer = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]);
      expect(customer[0].is_active).toBe(0);
    });
  });
});