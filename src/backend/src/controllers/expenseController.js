const { Expense, User, Couple } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Get all expenses for authenticated user
const getAllExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, category, start_date, end_date, is_shared } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      [Op.or]: [
        { user_id: userId },
        { '$Couple.user1_id$': userId },
        { '$Couple.user2_id$': userId }
      ]
    };

    // Add filters
    if (category) {
      whereClause.category = category;
    }
    
    if (start_date && end_date) {
      whereClause.expense_date = {
        [Op.between]: [start_date, end_date]
      };
    }
    
    if (is_shared !== undefined) {
      whereClause.is_shared = is_shared === 'true';
    }

    const expenses = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Couple,
          as: 'couple',
          required: false
        }
      ],
      order: [['expense_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses: expenses.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(expenses.count / limit),
          total_items: expenses.count,
          items_per_page: parseInt(limit)
        }
      }
    });

    logger.info(`User ${userId} retrieved ${expenses.count} expenses`);
  } catch (error) {
    logger.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new expense
const createExpense = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      title,
      description,
      amount,
      category,
      expense_date,
      payment_method,
      location,
      receipt_url,
      is_shared,
      shared_percentage,
      tags,
      recurring
    } = req.body;

    // Check if user has couple for shared expenses
    if (is_shared) {
      const userCouple = await Couple.findOne({
        where: {
          [Op.or]: [
            { user1_id: userId },
            { user2_id: userId }
          ],
          status: 'active'
        }
      });

      if (!userCouple) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create shared expense without an active couple relationship'
        });
      }
    }

    // Get user's couple_id if exists
    const userCouple = await Couple.findOne({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ],
        status: 'active'
      }
    });

    const expenseData = {
      user_id: userId,
      couple_id: userCouple ? userCouple.id : null,
      title,
      description,
      amount,
      category,
      expense_date: expense_date || new Date(),
      payment_method: payment_method || 'cash',
      location,
      receipt_url,
      is_shared: is_shared || false,
      shared_percentage: is_shared ? (shared_percentage || 50) : null,
      tags: tags || [],
      recurring
    };

    const expense = await Expense.create(expenseData);

    // Fetch the created expense with associations
    const createdExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Couple,
          as: 'couple',
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: createdExpense
    });

    logger.info(`User ${userId} created expense: ${expense.id}`);
  } catch (error) {
    logger.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findOne({
      where: {
        id,
        [Op.or]: [
          { user_id: userId },
          { '$Couple.user1_id$': userId },
          { '$Couple.user2_id$': userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Couple,
          as: 'couple',
          required: false
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense retrieved successfully',
      data: expense
    });

    logger.info(`User ${userId} retrieved expense: ${id}`);
  } catch (error) {
    logger.error('Error getting expense by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Find expense and check ownership
    const expense = await Expense.findOne({
      where: {
        id,
        user_id: userId // Only creator can update
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you do not have permission to update it'
      });
    }

    // Update expense
    await expense.update(updateData);

    // Fetch updated expense with associations
    const updatedExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Couple,
          as: 'couple',
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });

    logger.info(`User ${userId} updated expense: ${id}`);
  } catch (error) {
    logger.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find expense and check ownership
    const expense = await Expense.findOne({
      where: {
        id,
        user_id: userId // Only creator can delete
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you do not have permission to delete it'
      });
    }

    await expense.destroy();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });

    logger.info(`User ${userId} deleted expense: ${id}`);
  } catch (error) {
    logger.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get expense categories
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'food_dining', label: 'Food & Dining', icon: '🍽️' },
      { value: 'transportation', label: 'Transportation', icon: '🚗' },
      { value: 'shopping', label: 'Shopping', icon: '🛍️' },
      { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
      { value: 'bills_utilities', label: 'Bills & Utilities', icon: '💡' },
      { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { value: 'education', label: 'Education', icon: '📚' },
      { value: 'travel', label: 'Travel', icon: '✈️' },
      { value: 'groceries', label: 'Groceries', icon: '🛒' },
      { value: 'personal_care', label: 'Personal Care', icon: '💄' },
      { value: 'gifts_donations', label: 'Gifts & Donations', icon: '🎁' },
      { value: 'home_garden', label: 'Home & Garden', icon: '🏠' },
      { value: 'sports_fitness', label: 'Sports & Fitness', icon: '🏃' },
      { value: 'technology', label: 'Technology', icon: '💻' },
      { value: 'insurance', label: 'Insurance', icon: '🛡️' },
      { value: 'investments', label: 'Investments', icon: '📈' },
      { value: 'other', label: 'Other', icon: '📝' }
    ];

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query; // month, week, year
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const expenses = await Expense.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { '$Couple.user1_id$': userId },
          { '$Couple.user2_id$': userId }
        ],
        expense_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Couple,
          as: 'couple',
          required: false
        }
      ]
    });

    // Calculate statistics
    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalExpenses = expenses.length;
    const sharedExpenses = expenses.filter(expense => expense.is_shared).length;
    const personalExpenses = totalExpenses - sharedExpenses;
    
    // Category breakdown
    const categoryStats = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = { count: 0, amount: 0 };
      }
      acc[category].count += 1;
      acc[category].amount += parseFloat(expense.amount);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Expense statistics retrieved successfully',
      data: {
        period,
        date_range: { start: startDate, end: endDate },
        summary: {
          total_amount: totalAmount,
          total_expenses: totalExpenses,
          shared_expenses: sharedExpenses,
          personal_expenses: personalExpenses,
          average_expense: totalExpenses > 0 ? totalAmount / totalExpenses : 0
        },
        category_breakdown: categoryStats
      }
    });

    logger.info(`User ${userId} retrieved expense statistics for ${period}`);
  } catch (error) {
    logger.error('Error getting expense statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getCategories,
  getExpenseStats
};