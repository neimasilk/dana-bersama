const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../utils/testHelpers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = TestHelpers.getMockUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      TestHelpers.expectSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      TestHelpers.expectValidUser(response.body.data.user);
    });

    it('should reject registration with invalid email', async () => {
      const userData = TestHelpers.getMockUserData();
      userData.email = 'invalid-email';

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      TestHelpers.expectErrorResponse(response, 400);
    });

    it('should reject registration with missing required fields', async () => {
      const userData = TestHelpers.getMockUserData();
      delete userData.full_name;

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      TestHelpers.expectErrorResponse(response, 400);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = TestHelpers.getMockUserData();
      
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      TestHelpers.expectErrorResponse(response, 400, 'already exists');
    });

    it('should reject weak passwords', async () => {
      const userData = TestHelpers.getMockUserData();
      userData.password = '123'; // Too weak

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      TestHelpers.expectErrorResponse(response, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;
    const password = 'Password123';

    beforeEach(async () => {
      const userData = TestHelpers.getMockUserData();
      userData.password = password;
      testUser = await TestHelpers.createTestUser(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: password
        });

      TestHelpers.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      TestHelpers.expectValidUser(response.body.data.user);
      
      // Verify token is valid
      const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser.id);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: password
        });

      TestHelpers.expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      TestHelpers.expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: password
        });

      TestHelpers.expectErrorResponse(response, 400);
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        });

      TestHelpers.expectErrorResponse(response, 400);
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: password
        });

      TestHelpers.expectErrorResponse(response, 400);
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser();
      authToken = TestHelpers.generateTestToken(testUser.id);
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      TestHelpers.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('user');
      TestHelpers.expectValidUser(response.body.data.user);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      TestHelpers.expectErrorResponse(response, 401, 'No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      TestHelpers.expectErrorResponse(response, 401, 'Invalid token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      TestHelpers.expectErrorResponse(response, 401, 'Token expired');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser();
      authToken = TestHelpers.generateTestToken(testUser.id);
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+6289876543210'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      TestHelpers.expectSuccessResponse(response, 200);
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
      expect(response.body.data.user.phoneNumber).toBe(updateData.phoneNumber);
    });

    it('should reject update with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      TestHelpers.expectErrorResponse(response, 400);
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData);

      TestHelpers.expectErrorResponse(response, 401);
    });
  });
});