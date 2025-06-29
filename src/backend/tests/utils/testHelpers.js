const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Couple, Expense, Goal, Transaction } = require('../../src/models');

/**
 * Test Data Factories
 */
class TestHelpers {
  // User factory
  static async createTestUser(overrides = {}) {
    const userData = {
      full_name: `Test User ${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: 'Password123',
      phone: '+6281234567890',
      date_of_birth: '1990-01-01',
      ...overrides
    };

    const { User } = require('../../src/models');
    return await User.create(userData);
  }

  // Couple factory
  static async createTestCouple(user1_id, user2_id, overrides = {}) {
    const coupleData = {
      user1_id,
      user2_id,
      status: 'active',
      ...overrides
    };

    const { Couple } = require('../../src/models');
    return await Couple.create(coupleData);
  }

  // Expense factory
  static async createTestExpense(user_id, couple_id, overrides = {}) {
    const expenseData = {
      user_id,
      couple_id,
      title: 'Test Expense',
      description: 'Test expense description',
      amount: 100.00,
      category: 'food_dining',
      expense_date: new Date(),
      ...overrides
    };

    const { Expense } = require('../../src/models');
    return await Expense.create(expenseData);
  }

  // Goal factory
  static async createTestGoal(user_id, couple_id, overrides = {}) {
    const goalData = {
      user_id,
      couple_id,
      title: 'Test Goal',
      description: 'Test goal description',
      target_amount: 1000000,
      current_amount: 0,
      category: 'vacation_travel',
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'active',
      ...overrides
    };

    const { Goal } = require('../../src/models');
    return await Goal.create(goalData);
  }

  // Transaction factory
  static async createTestTransaction(user_id, goal_id, overrides = {}) {
    const transactionData = {
      user_id,
      goal_id,
      type: 'contribution',
      amount: 50000,
      description: 'Test contribution',
      payment_method: 'bank_transfer',
      transaction_date: new Date(),
      ...overrides
    };

    const { Transaction } = require('../../src/models');
    return await Transaction.create(transactionData);
  }

  /**
   * Authentication Helpers
   */
  static generateTestToken(userId) {
    return jwt.sign(
      { id: userId, email: `test${userId}@example.com` },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  static getAuthHeader(userId) {
    const token = this.generateTestToken(userId);
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Database Helpers
   */
  static async clearDatabase() {
    await Transaction.destroy({ where: {}, force: true });
    await Goal.destroy({ where: {}, force: true });
    await Expense.destroy({ where: {}, force: true });
    await Couple.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  }

  /**
   * API Response Helpers
   */
  static expectSuccessResponse(response, statusCode = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  }

  static expectErrorResponse(response, statusCode, message = null) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    // Accept either 'error' or 'message' property for error responses
    const errorMessage = response.body.error || response.body.message;
    expect(errorMessage).toBeDefined();
    if (message) {
      expect(errorMessage).toContain(message);
    }
  }

  /**
   * Validation Helpers
   */
  static expectValidUser(user) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('firstName');
    expect(user).toHaveProperty('lastName');
    expect(user).toHaveProperty('email');
    expect(user).not.toHaveProperty('password'); // Should not expose password
  }

  static expectValidExpense(expense) {
    expect(expense).toHaveProperty('id');
    expect(expense).toHaveProperty('title');
    expect(expense).toHaveProperty('amount');
    expect(expense).toHaveProperty('category');
    expect(expense).toHaveProperty('splitType');
    expect(expense).toHaveProperty('date');
  }

  static expectValidGoal(goal) {
    expect(goal).toHaveProperty('id');
    expect(goal).toHaveProperty('title');
    expect(goal).toHaveProperty('targetAmount');
    expect(goal).toHaveProperty('currentAmount');
    expect(goal).toHaveProperty('targetDate');
    expect(goal).toHaveProperty('status');
  }

  /**
   * Mock Data
   */
  static getMockUserData(overrides = {}) {
    return {
      full_name: `Test User ${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: 'Password123',
      phone: '+6281234567890',
      date_of_birth: '1990-01-01',
      ...overrides
    };
  }

  static getMockExpenseData() {
    return {
      title: 'Dinner at Restaurant',
      amount: 150000,
      category: 'Food',
      description: 'Romantic dinner',
      splitType: 'equal',
      date: new Date().toISOString()
    };
  }

  static getMockGoalData() {
    return {
      title: 'Vacation to Bali',
      description: 'Honeymoon trip to Bali',
      targetAmount: 10000000,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'vacation'
    };
  }
}

module.exports = TestHelpers;