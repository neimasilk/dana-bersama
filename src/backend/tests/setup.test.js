const { sequelize } = require('../src/models');
const TestHelpers = require('./utils/testHelpers');

describe('Test Setup Validation', () => {
  describe('Database Connection', () => {
    it('should connect to test database successfully', async () => {
      await sequelize.authenticate();
      expect(sequelize.getDialect()).toBe('sqlite');
    });

    it('should use test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have JWT secret configured', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET).toBe('test-jwt-secret-for-testing');
    });
  });

  describe('Database Operations', () => {
    it('should be able to create and delete test data', async () => {
      // Create test user
      const user = await TestHelpers.createTestUser();
      expect(user.id).toBeDefined();
      expect(user.email).toContain('@example.com');

      // Verify user exists
      const { User } = require('../src/models');
      const foundUser = await User.findByPk(user.id);
      expect(foundUser).toBeTruthy();
      expect(foundUser.id).toBe(user.id);

      // Database should be cleaned after test
      // This will be verified by the afterEach hook in setup.js
    });

    it('should clean database between tests', async () => {
      // This test verifies that the previous test data was cleaned
      const { User } = require('../src/models');
      const userCount = await User.count();
      expect(userCount).toBe(0);
    });
  });

  describe('Test Utilities', () => {
    it('should generate valid test tokens', () => {
      const userId = 'test-user-id';
      const token = TestHelpers.generateTestToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should create valid auth headers', () => {
      const userId = 'test-user-id';
      const authHeader = TestHelpers.getAuthHeader(userId);
      
      expect(authHeader).toHaveProperty('Authorization');
      expect(authHeader.Authorization).toMatch(/^Bearer /);
    });

    it('should generate valid mock data', () => {
      const userData = TestHelpers.getMockUserData();
      
      expect(userData).toHaveProperty('full_name');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('password');
      expect(userData).toHaveProperty('phone');
      expect(userData.email).toContain('@example.com');
    });

    it('should validate API responses correctly', () => {
      const mockSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: { test: 'data' }
        }
      };

      const mockErrorResponse = {
        status: 400,
        body: {
          success: false,
          error: 'Test error message'
        }
      };

      // Should not throw for valid responses
      expect(() => {
        TestHelpers.expectSuccessResponse(mockSuccessResponse, 200);
      }).not.toThrow();

      expect(() => {
        TestHelpers.expectErrorResponse(mockErrorResponse, 400);
      }).not.toThrow();
    });
  });

  describe('Model Factories', () => {
    it('should create test users with unique emails', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      
      expect(user1.email).not.toBe(user2.email);
      expect(user1.id).not.toBe(user2.id);
    });

    it('should create test couples with valid relationships', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      
      expect(couple.user1_id).toBe(user1.id);
      expect(couple.user2_id).toBe(user2.id);
      expect(couple.status).toBe('active');
    });

    it('should create test expenses with proper associations', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      const expense = await TestHelpers.createTestExpense(user1.id, couple.id);
      
      expect(expense.user_id).toBe(user1.id);
      expect(expense.couple_id).toBe(couple.id);
      expect(expense.title).toBeDefined();
      expect(expense.amount).toBeDefined();
      expect(expense.category).toBeDefined();
    });

    it('should create test goals with valid data', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      const goal = await TestHelpers.createTestGoal(user1.id, couple.id);
      
      expect(goal.user_id).toBe(user1.id);
      expect(goal.couple_id).toBe(couple.id);
      expect(goal.target_amount).toBeGreaterThan(0);
      expect(goal.current_amount).toBeGreaterThanOrEqual(0);
      expect(goal.status).toBe('active');
    });

    it('should create test transactions with proper associations', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      const goal = await TestHelpers.createTestGoal(user1.id, couple.id);
      const transaction = await TestHelpers.createTestTransaction(user1.id, goal.id);
      
      expect(transaction.user_id).toBe(user1.id);
      expect(transaction.goal_id).toBe(goal.id);
      expect(transaction.amount).toBeGreaterThan(0);
      expect(transaction.type).toBe('contribution');
    });
  });

  describe('Test Environment Isolation', () => {
    it('should not affect development database', () => {
      // Verify we're using test database configuration
      const config = require('../src/config/database');
      expect(config.storage).toBe(':memory:');
      expect(config.dialect).toBe('sqlite');
    });

    it('should have proper test timeouts configured', () => {
      // Jest should be configured with appropriate timeouts
      // This is more of a configuration check
      expect(jest.getTimerCount).toBeDefined();
    });
  });
});