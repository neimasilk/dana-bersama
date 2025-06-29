const { Expense, Goal, User, Couple } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

/**
 * Get financial summary for user/couple
 */
const getSummary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get user's couple_id if exists
    const user = await User.findByPk(userId, {
      include: [{ model: Couple, as: 'couple' }]
    });
    
    const coupleId = user.couple_id;
    
    // Build where condition for expenses and goals
    const whereCondition = coupleId 
      ? { [Op.or]: [{ user_id: userId }, { couple_id: coupleId }] }
      : { user_id: userId };

    // Get total expenses for the period
    const totalExpenses = await Expense.sum('amount', {
      where: {
        ...whereCondition,
        expense_date: {
          [Op.gte]: startDate,
          [Op.lte]: now
        }
      }
    }) || 0;

    // Get total goals (active)
    const totalGoalsValue = await Goal.sum('target_amount', {
      where: {
        ...whereCondition,
        status: 'active'
      }
    }) || 0;

    // Get total current savings (current_amount in goals)
    const totalSavings = await Goal.sum('current_amount', {
      where: {
        ...whereCondition,
        status: ['active', 'completed']
      }
    }) || 0;

    // Get monthly spending (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySpending = await Expense.sum('amount', {
      where: {
        ...whereCondition,
        expense_date: {
          [Op.gte]: monthStart,
          [Op.lte]: now
        }
      }
    }) || 0;

    // Get goal completion rate
    const totalGoals = await Goal.count({
      where: whereCondition
    });
    
    const completedGoals = await Goal.count({
      where: {
        ...whereCondition,
        status: 'completed'
      }
    });

    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    res.status(200).json({
      success: true,
      message: 'Financial summary retrieved successfully',
      data: {
        period,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalGoalsValue: parseFloat(totalGoalsValue.toFixed(2)),
        totalSavings: parseFloat(totalSavings.toFixed(2)),
        monthlySpending: parseFloat(monthlySpending.toFixed(2)),
        goalCompletionRate: parseFloat(goalCompletionRate.toFixed(2)),
        summary: {
          netWorth: parseFloat((totalSavings - totalExpenses).toFixed(2)),
          savingsRate: totalExpenses > 0 ? parseFloat(((totalSavings / totalExpenses) * 100).toFixed(2)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get expense analytics
 */
const getExpenseAnalytics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { period = 'month', months = 6 } = req.query;
    
    // Get user's couple_id if exists
    const user = await User.findByPk(userId, {
      include: [{ model: Couple, as: 'couple' }]
    });
    
    const coupleId = user.couple_id;
    
    // Build where condition
    const whereCondition = coupleId 
      ? { [Op.or]: [{ user_id: userId }, { couple_id: coupleId }] }
      : { user_id: userId };

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - parseInt(months));

    // Get expenses by category
    const expensesByCategory = await Expense.findAll({
      attributes: [
        'category',
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total'],
        [Expense.sequelize.fn('COUNT', Expense.sequelize.col('id')), 'count']
      ],
      where: {
        ...whereCondition,
        expense_date: {
          [Op.gte]: startDate,
          [Op.lte]: now
        }
      },
      group: ['category'],
      order: [[Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'DESC']]
    });

    // Get monthly trends
    const monthlyTrends = await Expense.findAll({
      attributes: [
        [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m'), 'month'],
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total'],
        [Expense.sequelize.fn('COUNT', Expense.sequelize.col('id')), 'count']
      ],
      where: {
        ...whereCondition,
        expense_date: {
          [Op.gte]: startDate,
          [Op.lte]: now
        }
      },
      group: [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m')],
      order: [[Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m'), 'ASC']]
    });

    // Calculate trends (percentage change)
    const trends = [];
    for (let i = 1; i < monthlyTrends.length; i++) {
      const current = parseFloat(monthlyTrends[i].dataValues.total);
      const previous = parseFloat(monthlyTrends[i-1].dataValues.total);
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      
      trends.push({
        month: monthlyTrends[i].dataValues.month,
        change: parseFloat(change.toFixed(2)),
        direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense analytics retrieved successfully',
      data: {
        byCategory: expensesByCategory.map(item => ({
          category: item.category,
          total: parseFloat(item.dataValues.total),
          count: parseInt(item.dataValues.count)
        })),
        byMonth: monthlyTrends.map(item => ({
          month: item.dataValues.month,
          total: parseFloat(item.dataValues.total),
          count: parseInt(item.dataValues.count)
        })),
        trends
      }
    });
  } catch (error) {
    console.error('Error getting expense analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get goal progress analytics
 */
const getGoalProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    
    // Get user's couple_id if exists
    const user = await User.findByPk(userId, {
      include: [{ model: Couple, as: 'couple' }]
    });
    
    const coupleId = user.couple_id;
    
    // Build where condition
    const whereCondition = coupleId 
      ? { [Op.or]: [{ user_id: userId }, { couple_id: coupleId }] }
      : { user_id: userId };

    // Get active goals with progress
    const activeGoals = await Goal.findAll({
      where: {
        ...whereCondition,
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    });

    // Get completed goals
    const completedGoals = await Goal.findAll({
      where: {
        ...whereCondition,
        status: 'completed'
      },
      order: [['updated_at', 'DESC']],
      limit: 10
    });

    // Calculate overall progress
    const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + parseFloat(goal.target_amount), 0);
    const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + parseFloat(goal.current_amount), 0);
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    // Get goals by category
    const goalsByCategory = await Goal.findAll({
      attributes: [
        'category',
        [Goal.sequelize.fn('COUNT', Goal.sequelize.col('id')), 'count'],
        [Goal.sequelize.fn('SUM', Goal.sequelize.col('target_amount')), 'totalTarget'],
        [Goal.sequelize.fn('SUM', Goal.sequelize.col('current_amount')), 'totalCurrent']
      ],
      where: whereCondition,
      group: ['category'],
      order: [[Goal.sequelize.fn('COUNT', Goal.sequelize.col('id')), 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Goal progress retrieved successfully',
      data: {
        activeGoals: activeGoals.map(goal => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          target_amount: parseFloat(goal.target_amount),
          current_amount: parseFloat(goal.current_amount),
          progress: goal.target_amount > 0 ? parseFloat(((goal.current_amount / goal.target_amount) * 100).toFixed(2)) : 0,
          target_date: goal.target_date,
          priority: goal.priority,
          is_shared: goal.is_shared
        })),
        completedGoals: completedGoals.map(goal => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          target_amount: parseFloat(goal.target_amount),
          completed_at: goal.updated_at,
          is_shared: goal.is_shared
        })),
        totalProgress: parseFloat(totalProgress.toFixed(2)),
        summary: {
          totalActiveGoals: activeGoals.length,
          totalCompletedGoals: completedGoals.length,
          totalTargetAmount: parseFloat(totalTargetAmount.toFixed(2)),
          totalCurrentAmount: parseFloat(totalCurrentAmount.toFixed(2))
        },
        byCategory: goalsByCategory.map(item => ({
          category: item.category,
          count: parseInt(item.dataValues.count),
          totalTarget: parseFloat(item.dataValues.totalTarget || 0),
          totalCurrent: parseFloat(item.dataValues.totalCurrent || 0),
          progress: item.dataValues.totalTarget > 0 ? 
            parseFloat(((item.dataValues.totalCurrent / item.dataValues.totalTarget) * 100).toFixed(2)) : 0
        }))
      }
    });
  } catch (error) {
    console.error('Error getting goal progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get spending trends and predictions
 */
const getSpendingTrends = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { months = 12 } = req.query;
    
    // Get user's couple_id if exists
    const user = await User.findByPk(userId, {
      include: [{ model: Couple, as: 'couple' }]
    });
    
    const coupleId = user.couple_id;
    
    // Build where condition
    const whereCondition = coupleId 
      ? { [Op.or]: [{ user_id: userId }, { couple_id: coupleId }] }
      : { user_id: userId };

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - parseInt(months));

    // Get monthly spending trends
    const monthlyTrends = await Expense.findAll({
      attributes: [
        [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m'), 'month'],
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total'],
        [Expense.sequelize.fn('AVG', Expense.sequelize.col('amount')), 'average'],
        [Expense.sequelize.fn('COUNT', Expense.sequelize.col('id')), 'count']
      ],
      where: {
        ...whereCondition,
        expense_date: {
          [Op.gte]: startDate,
          [Op.lte]: now
        }
      },
      group: [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m')],
      order: [[Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m'), 'ASC']]
    });

    // Get category trends
    const categoryTrends = await Expense.findAll({
      attributes: [
        'category',
        [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m'), 'month'],
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
      ],
      where: {
        ...whereCondition,
        expense_date: {
          [Op.gte]: startDate,
          [Op.lte]: now
        }
      },
      group: ['category', Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m')],
      order: [
        [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('expense_date'), '%Y-%m'), 'ASC'],
        ['category', 'ASC']
      ]
    });

    // Simple prediction based on average (next 3 months)
    const predictions = [];
    if (monthlyTrends.length >= 3) {
      const recentTrends = monthlyTrends.slice(-3);
      const avgSpending = recentTrends.reduce((sum, trend) => sum + parseFloat(trend.dataValues.total), 0) / 3;
      
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(now);
        futureDate.setMonth(now.getMonth() + i);
        const monthStr = futureDate.toISOString().slice(0, 7);
        
        predictions.push({
          month: monthStr,
          predicted_amount: parseFloat(avgSpending.toFixed(2)),
          confidence: 'medium' // Simple confidence level
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Spending trends retrieved successfully',
      data: {
        monthlyTrends: monthlyTrends.map(item => ({
          month: item.dataValues.month,
          total: parseFloat(item.dataValues.total),
          average: parseFloat(item.dataValues.average),
          count: parseInt(item.dataValues.count)
        })),
        categoryTrends: categoryTrends.map(item => ({
          category: item.category,
          month: item.dataValues.month,
          total: parseFloat(item.dataValues.total)
        })),
        predictions,
        insights: {
          totalMonths: monthlyTrends.length,
          averageMonthlySpending: monthlyTrends.length > 0 ? 
            parseFloat((monthlyTrends.reduce((sum, trend) => sum + parseFloat(trend.dataValues.total), 0) / monthlyTrends.length).toFixed(2)) : 0,
          highestSpendingMonth: monthlyTrends.length > 0 ? 
            monthlyTrends.reduce((max, trend) => parseFloat(trend.dataValues.total) > parseFloat(max.dataValues.total) ? trend : max) : null,
          lowestSpendingMonth: monthlyTrends.length > 0 ? 
            monthlyTrends.reduce((min, trend) => parseFloat(trend.dataValues.total) < parseFloat(min.dataValues.total) ? trend : min) : null
        }
      }
    });
  } catch (error) {
    console.error('Error getting spending trends:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSummary,
  getExpenseAnalytics,
  getGoalProgress,
  getSpendingTrends
};