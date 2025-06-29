const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../utils/testHelpers');

describe('API Integration Tests', () => {
  describe('Complete User Registration and Authentication Flow', () => {
    it('should complete full user registration and login flow', async () => {
      const userData = TestHelpers.getMockUserData();

      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      TestHelpers.expectSuccessResponse(registerResponse, 201);
      expect(registerResponse.body.data).toHaveProperty('user');
      expect(registerResponse.body.data).toHaveProperty('token');

      const userId = registerResponse.body.data.user.id;
      const registrationToken = registerResponse.body.data.token;

      // 2. Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      TestHelpers.expectSuccessResponse(loginResponse, 200);
      expect(loginResponse.body.data.user.id).toBe(userId);

      // 3. Access protected profile endpoint
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${registrationToken}`);

      TestHelpers.expectSuccessResponse(profileResponse, 200);
      expect(profileResponse.body.data.user.id).toBe(userId);
    });
  });

  describe('Complete Expense Management Flow', () => {
    let user1, user2, couple, authToken1, authToken2;

    beforeEach(async () => {
      // Setup test users and couple
      user1 = await TestHelpers.createTestUser();
      user2 = await TestHelpers.createTestUser();
      couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      authToken1 = TestHelpers.generateTestToken(user1.id);
      authToken2 = TestHelpers.generateTestToken(user2.id);
    });

    it('should complete full expense creation and management flow', async () => {
      const expenseData = TestHelpers.getMockExpenseData();

      // 1. Create expense
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(expenseData);

      TestHelpers.expectSuccessResponse(createResponse, 201);
      TestHelpers.expectValidExpense(createResponse.body.data.expense);
      const expenseId = createResponse.body.data.expense.id;

      // 2. Get all expenses
      const getExpensesResponse = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(getExpensesResponse, 200);
      expect(getExpensesResponse.body.data.expenses).toHaveLength(1);
      expect(getExpensesResponse.body.data.expenses[0].id).toBe(expenseId);

      // 3. Get specific expense
      const getExpenseResponse = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(getExpenseResponse, 200);
      TestHelpers.expectValidExpense(getExpenseResponse.body.data.expense);

      // 4. Update expense
      const updateData = {
        title: 'Updated Expense Title',
        amount: 200000
      };

      const updateResponse = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData);

      TestHelpers.expectSuccessResponse(updateResponse, 200);
      expect(updateResponse.body.data.expense.title).toBe(updateData.title);
      expect(updateResponse.body.data.expense.amount).toBe(updateData.amount);

      // 5. Delete expense
      const deleteResponse = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(deleteResponse, 200);

      // 6. Verify expense is deleted
      const getDeletedResponse = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectErrorResponse(getDeletedResponse, 404);
    });

    it('should handle expense split calculations correctly', async () => {
      // Test equal split
      const equalSplitExpense = {
        ...TestHelpers.getMockExpenseData(),
        amount: 100000,
        splitType: 'equal'
      };

      const equalResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(equalSplitExpense);

      TestHelpers.expectSuccessResponse(equalResponse, 201);
      expect(equalResponse.body.data.expense.splitData.user1Amount).toBe(50000);
      expect(equalResponse.body.data.expense.splitData.user2Amount).toBe(50000);

      // Test percentage split
      const percentageSplitExpense = {
        ...TestHelpers.getMockExpenseData(),
        amount: 100000,
        splitType: 'percentage',
        splitData: {
          user1Percentage: 70,
          user2Percentage: 30
        }
      };

      const percentageResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(percentageSplitExpense);

      TestHelpers.expectSuccessResponse(percentageResponse, 201);
      expect(percentageResponse.body.data.expense.splitData.user1Amount).toBe(70000);
      expect(percentageResponse.body.data.expense.splitData.user2Amount).toBe(30000);
    });
  });

  describe('Complete Goal Management Flow', () => {
    let user1, user2, couple, authToken1;

    beforeEach(async () => {
      user1 = await TestHelpers.createTestUser();
      user2 = await TestHelpers.createTestUser();
      couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      authToken1 = TestHelpers.generateTestToken(user1.id);
    });

    it('should complete full goal creation and transaction flow', async () => {
      const goalData = TestHelpers.getMockGoalData();

      // 1. Create goal
      const createGoalResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(goalData);

      TestHelpers.expectSuccessResponse(createGoalResponse, 201);
      TestHelpers.expectValidGoal(createGoalResponse.body.data.goal);
      const goalId = createGoalResponse.body.data.goal.id;

      // 2. Add contribution to goal
      const contributionData = {
        amount: 500000,
        description: 'Monthly contribution'
      };

      const contributionResponse = await request(app)
        .post(`/api/goals/${goalId}/contribute`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(contributionData);

      TestHelpers.expectSuccessResponse(contributionResponse, 201);
      expect(contributionResponse.body.data.transaction.amount).toBe(contributionData.amount);

      // 3. Get updated goal with new current amount
      const updatedGoalResponse = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(updatedGoalResponse, 200);
      expect(updatedGoalResponse.body.data.goal.currentAmount).toBe(contributionData.amount);

      // 4. Get goal transactions
      const transactionsResponse = await request(app)
        .get(`/api/goals/${goalId}/transactions`)
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(transactionsResponse, 200);
      expect(transactionsResponse.body.data.transactions).toHaveLength(1);
      expect(transactionsResponse.body.data.transactions[0].amount).toBe(contributionData.amount);
    });
  });

  describe('Reports and Analytics Flow', () => {
    let user1, user2, couple, authToken1;

    beforeEach(async () => {
      user1 = await TestHelpers.createTestUser();
      user2 = await TestHelpers.createTestUser();
      couple = await TestHelpers.createTestCouple(user1.id, user2.id);
      authToken1 = TestHelpers.generateTestToken(user1.id);

      // Create sample expenses for reporting
      await TestHelpers.createTestExpense(user1.id, couple.id, {
        amount: 100000,
        category: 'food_dining',
        expense_date: new Date('2024-01-15')
      });
      await TestHelpers.createTestExpense(user1.id, couple.id, {
        amount: 200000,
        category: 'transportation',
        expense_date: new Date('2024-01-20')
      });
      await TestHelpers.createTestExpense(user1.id, couple.id, {
        amount: 150000,
        category: 'food_dining',
        expense_date: new Date('2024-02-10')
      });
    });

    it('should generate monthly expense reports', async () => {
      const response = await request(app)
        .get('/api/reports/expenses/monthly')
        .query({ year: 2024, month: 1 })
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(response, 200);
      expect(response.body.data.report).toHaveProperty('totalAmount');
      expect(response.body.data.report).toHaveProperty('categoryBreakdown');
      expect(response.body.data.report.totalAmount).toBe(300000); // 100k + 200k
    });

    it('should generate category-wise expense reports', async () => {
      const response = await request(app)
        .get('/api/reports/expenses/category')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectSuccessResponse(response, 200);
      expect(response.body.data.report.categoryBreakdown).toHaveProperty('Food');
      expect(response.body.data.report.categoryBreakdown).toHaveProperty('Transportation');
      expect(response.body.data.report.categoryBreakdown.Food).toBe(250000); // 100k + 150k
      expect(response.body.data.report.categoryBreakdown.Transportation).toBe(200000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let user1, authToken1;

    beforeEach(async () => {
      user1 = await TestHelpers.createTestUser();
      authToken1 = TestHelpers.generateTestToken(user1.id);
    });

    it('should handle non-existent resource requests', async () => {
      const response = await request(app)
        .get('/api/expenses/999999')
        .set('Authorization', `Bearer ${authToken1}`);

      TestHelpers.expectErrorResponse(response, 404);
    });

    it('should handle unauthorized access attempts', async () => {
      const response = await request(app)
        .get('/api/expenses');

      TestHelpers.expectErrorResponse(response, 401);
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ invalid: 'data' });

      TestHelpers.expectErrorResponse(response, 400);
    });

    it('should handle server errors gracefully', async () => {
      // This would test error handling middleware
      // Implementation depends on how errors are handled in the app
    });
  });
});