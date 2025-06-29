const { Goal, User, Couple } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Get all goals for authenticated user
const getAllGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, category, status, priority } = req.query;
    
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
    
    if (status) {
      whereClause.status = status;
    }
    
    if (priority) {
      whereClause.priority = priority;
    }

    const goals = await Goal.findAndCountAll({
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
      order: [['priority', 'DESC'], ['target_date', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.rows.map(goal => {
      const progress = goal.target_amount > 0 
        ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
        : 0;
      
      return {
        ...goal.toJSON(),
        progress_percentage: Math.round(progress * 100) / 100,
        remaining_amount: Math.max(goal.target_amount - goal.current_amount, 0)
      };
    });

    res.status(200).json({
      success: true,
      message: 'Goals retrieved successfully',
      data: {
        goals: goalsWithProgress,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(goals.count / limit),
          total_items: goals.count,
          items_per_page: parseInt(limit)
        }
      }
    });

    logger.info(`User ${userId} retrieved ${goals.count} goals`);
  } catch (error) {
    logger.error('Error getting goals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new goal
const createGoal = async (req, res) => {
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
      target_amount,
      current_amount,
      category,
      target_date,
      priority,
      is_shared,
      contribution_method,
      contribution_settings,
      auto_contribution
    } = req.body;

    // Check if user has couple for shared goals
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
          message: 'Cannot create shared goal without an active couple relationship'
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

    const goalData = {
      user_id: userId,
      couple_id: userCouple ? userCouple.id : null,
      title,
      description,
      target_amount,
      current_amount: current_amount || 0,
      category,
      target_date,
      priority: priority || 'medium',
      is_shared: is_shared || false,
      contribution_method: contribution_method || 'equal',
      contribution_settings: contribution_settings || {},
      auto_contribution
    };

    const goal = await Goal.create(goalData);

    // Fetch the created goal with associations
    const createdGoal = await Goal.findByPk(goal.id, {
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

    // Add progress calculation
    const progress = createdGoal.target_amount > 0 
      ? Math.min((createdGoal.current_amount / createdGoal.target_amount) * 100, 100)
      : 0;

    const goalWithProgress = {
      ...createdGoal.toJSON(),
      progress_percentage: Math.round(progress * 100) / 100,
      remaining_amount: Math.max(createdGoal.target_amount - createdGoal.current_amount, 0)
    };

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goalWithProgress
    });

    logger.info(`User ${userId} created goal: ${goal.id}`);
  } catch (error) {
    logger.error('Error creating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get goal by ID
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await Goal.findOne({
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

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Add progress calculation
    const progress = goal.target_amount > 0 
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;

    const goalWithProgress = {
      ...goal.toJSON(),
      progress_percentage: Math.round(progress * 100) / 100,
      remaining_amount: Math.max(goal.target_amount - goal.current_amount, 0)
    };

    res.status(200).json({
      success: true,
      message: 'Goal retrieved successfully',
      data: goalWithProgress
    });

    logger.info(`User ${userId} retrieved goal: ${id}`);
  } catch (error) {
    logger.error('Error getting goal by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update goal
const updateGoal = async (req, res) => {
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

    // Find goal and check ownership
    const goal = await Goal.findOne({
      where: {
        id,
        user_id: userId // Only creator can update
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or you do not have permission to update it'
      });
    }

    // Update goal
    await goal.update(updateData);

    // Fetch updated goal with associations
    const updatedGoal = await Goal.findByPk(goal.id, {
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

    // Add progress calculation
    const progress = updatedGoal.target_amount > 0 
      ? Math.min((updatedGoal.current_amount / updatedGoal.target_amount) * 100, 100)
      : 0;

    const goalWithProgress = {
      ...updatedGoal.toJSON(),
      progress_percentage: Math.round(progress * 100) / 100,
      remaining_amount: Math.max(updatedGoal.target_amount - updatedGoal.current_amount, 0)
    };

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goalWithProgress
    });

    logger.info(`User ${userId} updated goal: ${id}`);
  } catch (error) {
    logger.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete goal
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find goal and check ownership
    const goal = await Goal.findOne({
      where: {
        id,
        user_id: userId // Only creator can delete
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or you do not have permission to delete it'
      });
    }

    await goal.destroy();

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });

    logger.info(`User ${userId} deleted goal: ${id}`);
  } catch (error) {
    logger.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add contribution to goal
const addContribution = async (req, res) => {
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
    const { amount, note } = req.body;

    // Find goal and check access
    const goal = await Goal.findOne({
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
          model: Couple,
          as: 'couple',
          required: false
        }
      ]
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add contribution to inactive goal'
      });
    }

    // Update current amount
    const newCurrentAmount = parseFloat(goal.current_amount) + parseFloat(amount);
    const newStatus = newCurrentAmount >= parseFloat(goal.target_amount) ? 'completed' : goal.status;

    await goal.update({
      current_amount: newCurrentAmount,
      status: newStatus
    });

    // Fetch updated goal
    const updatedGoal = await Goal.findByPk(goal.id, {
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

    // Add progress calculation
    const progress = updatedGoal.target_amount > 0 
      ? Math.min((updatedGoal.current_amount / updatedGoal.target_amount) * 100, 100)
      : 0;

    const goalWithProgress = {
      ...updatedGoal.toJSON(),
      progress_percentage: Math.round(progress * 100) / 100,
      remaining_amount: Math.max(updatedGoal.target_amount - updatedGoal.current_amount, 0)
    };

    res.status(200).json({
      success: true,
      message: newStatus === 'completed' 
        ? 'Contribution added successfully! Goal completed!' 
        : 'Contribution added successfully',
      data: goalWithProgress
    });

    logger.info(`User ${userId} added contribution ${amount} to goal: ${id}`);
  } catch (error) {
    logger.error('Error adding contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get goal categories
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'emergency_fund', label: 'Emergency Fund', icon: '🚨' },
      { value: 'vacation_travel', label: 'Vacation & Travel', icon: '✈️' },
      { value: 'home_purchase', label: 'Home Purchase', icon: '🏠' },
      { value: 'car_purchase', label: 'Car Purchase', icon: '🚗' },
      { value: 'wedding', label: 'Wedding', icon: '💒' },
      { value: 'education', label: 'Education', icon: '🎓' },
      { value: 'retirement', label: 'Retirement', icon: '👴' },
      { value: 'investment', label: 'Investment', icon: '📈' },
      { value: 'debt_payoff', label: 'Debt Payoff', icon: '💳' },
      { value: 'home_improvement', label: 'Home Improvement', icon: '🔨' },
      { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { value: 'business', label: 'Business', icon: '💼' },
      { value: 'gadgets_electronics', label: 'Gadgets & Electronics', icon: '📱' },
      { value: 'other', label: 'Other', icon: '📝' }
    ];

    res.status(200).json({
      success: true,
      message: 'Goal categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    logger.error('Error getting goal categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get goal statistics
const getGoalStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const goals = await Goal.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { '$Couple.user1_id$': userId },
          { '$Couple.user2_id$': userId }
        ]
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
    const totalGoals = goals.length;
    const activeGoals = goals.filter(goal => goal.status === 'active').length;
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    const totalTargetAmount = goals.reduce((sum, goal) => sum + parseFloat(goal.target_amount), 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + parseFloat(goal.current_amount), 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    
    // Category breakdown
    const categoryStats = goals.reduce((acc, goal) => {
      const category = goal.category;
      if (!acc[category]) {
        acc[category] = { 
          count: 0, 
          target_amount: 0, 
          current_amount: 0,
          completed: 0
        };
      }
      acc[category].count += 1;
      acc[category].target_amount += parseFloat(goal.target_amount);
      acc[category].current_amount += parseFloat(goal.current_amount);
      if (goal.status === 'completed') {
        acc[category].completed += 1;
      }
      return acc;
    }, {});

    // Priority breakdown
    const priorityStats = goals.reduce((acc, goal) => {
      const priority = goal.priority;
      if (!acc[priority]) {
        acc[priority] = { count: 0, completed: 0 };
      }
      acc[priority].count += 1;
      if (goal.status === 'completed') {
        acc[priority].completed += 1;
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Goal statistics retrieved successfully',
      data: {
        summary: {
          total_goals: totalGoals,
          active_goals: activeGoals,
          completed_goals: completedGoals,
          total_target_amount: totalTargetAmount,
          total_current_amount: totalCurrentAmount,
          overall_progress: Math.round(overallProgress * 100) / 100,
          completion_rate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100 * 100) / 100 : 0
        },
        category_breakdown: categoryStats,
        priority_breakdown: priorityStats
      }
    });

    logger.info(`User ${userId} retrieved goal statistics`);
  } catch (error) {
    logger.error('Error getting goal statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  addContribution,
  getCategories,
  getGoalStats
};