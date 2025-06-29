const request = require('supertest');
const express = require('express');
const reportController = require('../../../src/controllers/reportController');
const { Expense, Goal, User, Couple } = require('../../../src/models');
const { authenticateToken } = require('../../../src/middleware/auth');
const {
  validateGetSummary,
  validateGetExpenseAnalytics,
  validateGetGoalProgress,
  validateGetSpendingTrends
} = require('../../../src/middleware/reportValidation');

// Mock the models
jest.mock('../../../src/models');

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1 };
    next();
  }
}));

const app = express();
app.use(express.json());

// Setup routes
app.get('/reports/summary', authenticateToken, validateGetSummary, reportController.getSummary);
app.get('/reports/expense-analytics', authenticateToken, validateGetExpenseAnalytics, reportController.getExpenseAnalytics);
app.get('/reports/goal-progress', authenticateToken, validateGetGoalProgress, reportController.getGoalProgress);
app.get('/reports/spending-trends', authenticateToken, validateGetSpendingTrends, reportController.getSpendingTrends);

describe('Report Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /reports/summary', () => {
    it('should get financial summary successfully', async () => {
      // Mock User.findByPk
      User.findByPk.mockResolvedValue({
        id: 1,
        couple_id: null
      });

      // Mock Expense.sum calls
      Expense.sum
        .mockResolvedValueOnce(1500.00) // totalExpenses
        .mockResolvedValueOnce(800.00); // monthlySpending

      // Mock Goal.sum calls
      Goal.sum
        .mockResolvedValueOnce(5000.00) // totalGoalsValue
        .mockResolvedValueOnce(2000.00); // totalSavings

      // Mock Goal.count calls
      Goal.count
        .mockResolvedValueOnce(5) // totalGoals
        .mockResolvedValueOnce(2); // completedGoals

      const response = await request(app)
        .get('/reports/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalExpenses', 1500.00);
      expect(response.body.data).toHaveProperty('totalGoalsValue', 5000.00);
      expect(response.body.data).toHaveProperty('totalSavings', 2000.00);
      expect(response.body.data).toHaveProperty('monthlySpending', 800.00);
      expect(response.body.data).toHaveProperty('goalCompletionRate', 40.00);
      expect(response.body.data.summary).toHaveProperty('netWorth', 500.00);
    });

    it('should handle different period parameter', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });
      Expense.sum.mockResolvedValue(1000.00);
      Goal.sum.mockResolvedValue(2000.00);
      Goal.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/reports/summary?period=week')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('week');
    });

    it('should return validation error for invalid period', async () => {
      const response = await request(app)
        .get('/reports/summary?period=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle couple data when user has couple_id', async () => {
      User.findByPk.mockResolvedValue({
        id: 1,
        couple_id: 1,
        couple: { id: 1 }
      });

      Expense.sum.mockResolvedValue(2000.00);
      Goal.sum.mockResolvedValue(3000.00);
      Goal.count.mockResolvedValue(4);

      const response = await request(app)
        .get('/reports/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Expense.sum).toHaveBeenCalledWith('amount', expect.objectContaining({
        where: expect.objectContaining({
          $or: [{ user_id: 1 }, { couple_id: 1 }]
        })
      }));
    });
  });

  describe('GET /reports/expense-analytics', () => {
    it('should get expense analytics successfully', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });

      // Mock Expense.findAll for categories
      Expense.findAll
        .mockResolvedValueOnce([
          {
            category: 'Food',
            dataValues: { total: '500.00', count: '10' }
          },
          {
            category: 'Transport',
            dataValues: { total: '300.00', count: '5' }
          }
        ])
        // Mock for monthly trends
        .mockResolvedValueOnce([
          {
            dataValues: { month: '2024-01', total: '800.00', count: '15' }
          },
          {
            dataValues: { month: '2024-02', total: '900.00', count: '18' }
          }
        ]);

      const response = await request(app)
        .get('/reports/expense-analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byCategory).toHaveLength(2);
      expect(response.body.data.byCategory[0]).toEqual({
        category: 'Food',
        total: 500.00,
        count: 10
      });
      expect(response.body.data.byMonth).toHaveLength(2);
      expect(response.body.data.trends).toHaveLength(1);
    });

    it('should handle months parameter', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });
      Expense.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/reports/expense-analytics?months=12')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid months', async () => {
      const response = await request(app)
        .get('/reports/expense-analytics?months=50')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /reports/goal-progress', () => {
    it('should get goal progress successfully', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });

      // Mock Goal.findAll for active goals
      Goal.findAll
        .mockResolvedValueOnce([
          {
            id: 1,
            title: 'Emergency Fund',
            category: 'savings',
            target_amount: '10000.00',
            current_amount: '5000.00',
            target_date: '2024-12-31',
            priority: 'high',
            is_shared: false
          }
        ])
        // Mock for completed goals
        .mockResolvedValueOnce([
          {
            id: 2,
            title: 'Vacation Fund',
            category: 'travel',
            target_amount: '3000.00',
            updated_at: '2024-01-15',
            is_shared: true
          }
        ])
        // Mock for goals by category
        .mockResolvedValueOnce([
          {
            category: 'savings',
            dataValues: {
              count: '2',
              totalTarget: '15000.00',
              totalCurrent: '8000.00'
            }
          }
        ]);

      const response = await request(app)
        .get('/reports/goal-progress')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activeGoals).toHaveLength(1);
      expect(response.body.data.activeGoals[0]).toEqual({
        id: 1,
        title: 'Emergency Fund',
        category: 'savings',
        target_amount: 10000.00,
        current_amount: 5000.00,
        progress: 50.00,
        target_date: '2024-12-31',
        priority: 'high',
        is_shared: false
      });
      expect(response.body.data.completedGoals).toHaveLength(1);
      expect(response.body.data.totalProgress).toBe(50.00);
      expect(response.body.data.byCategory).toHaveLength(1);
    });

    it('should handle empty goals', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });
      Goal.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/reports/goal-progress')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activeGoals).toHaveLength(0);
      expect(response.body.data.totalProgress).toBe(0);
    });
  });

  describe('GET /reports/spending-trends', () => {
    it('should get spending trends successfully', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });

      // Mock Expense.findAll for monthly trends
      Expense.findAll
        .mockResolvedValueOnce([
          {
            dataValues: { month: '2024-01', total: '800.00', average: '53.33', count: '15' }
          },
          {
            dataValues: { month: '2024-02', total: '900.00', average: '60.00', count: '15' }
          },
          {
            dataValues: { month: '2024-03', total: '750.00', average: '50.00', count: '15' }
          }
        ])
        // Mock for category trends
        .mockResolvedValueOnce([
          {
            category: 'Food',
            dataValues: { month: '2024-01', total: '400.00' }
          },
          {
            category: 'Transport',
            dataValues: { month: '2024-01', total: '200.00' }
          }
        ]);

      const response = await request(app)
        .get('/reports/spending-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.monthlyTrends).toHaveLength(3);
      expect(response.body.data.categoryTrends).toHaveLength(2);
      expect(response.body.data.predictions).toHaveLength(3);
      expect(response.body.data.insights).toHaveProperty('averageMonthlySpending');
      expect(response.body.data.insights).toHaveProperty('highestSpendingMonth');
      expect(response.body.data.insights).toHaveProperty('lowestSpendingMonth');
    });

    it('should handle months parameter', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });
      Expense.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/reports/spending-trends?months=6')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid months', async () => {
      const response = await request(app)
        .get('/reports/spending-trends?months=50')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty trends data', async () => {
      User.findByPk.mockResolvedValue({ id: 1, couple_id: null });
      Expense.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/reports/spending-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.monthlyTrends).toHaveLength(0);
      expect(response.body.data.predictions).toHaveLength(0);
      expect(response.body.data.insights.averageMonthlySpending).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in getSummary', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/reports/summary')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle database errors in getExpenseAnalytics', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/reports/expense-analytics')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle database errors in getGoalProgress', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/reports/goal-progress')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle database errors in getSpendingTrends', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/reports/spending-trends')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });
});