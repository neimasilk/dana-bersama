const { User } = require('../../src/models');
const TestHelpers = require('../utils/testHelpers');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+6281234567890',
        date_of_birth: '1990-01-01'
      };

      const user = await User.create(userData);
      
      expect(user.id).toBeDefined();
      expect(user.full_name).toBe('John Doe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.phone).toBe('+6281234567890');
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      const user = await User.create(userData);
      
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should require full_name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      await User.create(userData);
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        full_name: 'Test User',
        password: 'password123'
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'test@example.com'
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Validation', () => {
    it('should validate email format', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate phone number format', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '123' // Invalid phone number
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate password length', async () => {
      const userData = {
        full_name: 'Test User',
        email: 'test@example.com',
        password: '123' // Too short
      };
      
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    it('should have timestamps', async () => {
      const user = await TestHelpers.createTestUser();
      
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const user = await TestHelpers.createTestUser();
      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      user.full_name = 'Updated Name';
      await user.save();
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Associations', () => {
    it('should be able to create couple relationship', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);

      expect(couple.user1_id).toBe(user1.id);
      expect(couple.user2_id).toBe(user2.id);
    });

    it('should be able to create expenses', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      const expense = await TestHelpers.createTestExpense(user1.id, couple.id);

      expect(expense.user_id).toBe(user1.id);
      expect(expense.couple_id).toBe(couple.id);
    });

    it('should be able to create goals', async () => {
      const user1 = await TestHelpers.createTestUser();
      const user2 = await TestHelpers.createTestUser();
      const couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      const goal = await TestHelpers.createTestGoal(user1.id, couple.id);

      expect(goal.user_id).toBe(user1.id);
      expect(goal.couple_id).toBe(couple.id);
    });
  });
});