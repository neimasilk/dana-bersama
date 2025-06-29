const { body, param, query } = require('express-validator');

// Validation for creating goal
const validateCreateGoal = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
    
  body('target_amount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number greater than 0'),
    
  body('current_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount must be a non-negative number'),
    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'emergency_fund', 'vacation_travel', 'home_purchase', 'car_purchase',
      'wedding', 'education', 'retirement', 'investment', 'debt_payoff',
      'home_improvement', 'healthcare', 'business', 'gadgets_electronics', 'other'
    ])
    .withMessage('Invalid category'),
    
  body('target_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid target date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
    
  body('is_shared')
    .optional()
    .isBoolean()
    .withMessage('is_shared must be a boolean value'),
    
  body('contribution_method')
    .optional()
    .isIn(['equal', 'percentage', 'custom'])
    .withMessage('Contribution method must be one of: equal, percentage, custom'),
    
  body('contribution_settings')
    .optional()
    .isObject()
    .withMessage('Contribution settings must be an object')
    .custom((settings, { req }) => {
      const method = req.body.contribution_method || 'equal';
      
      if (method === 'percentage') {
        if (!settings.user1_percentage || !settings.user2_percentage) {
          throw new Error('Percentage method requires user1_percentage and user2_percentage');
        }
        const total = settings.user1_percentage + settings.user2_percentage;
        if (total !== 100) {
          throw new Error('Percentage contributions must total 100%');
        }
      }
      
      if (method === 'custom') {
        if (!settings.user1_amount || !settings.user2_amount) {
          throw new Error('Custom method requires user1_amount and user2_amount');
        }
        if (settings.user1_amount < 0 || settings.user2_amount < 0) {
          throw new Error('Custom amounts must be non-negative');
        }
      }
      
      return true;
    }),
    
  body('auto_contribution')
    .optional()
    .isObject()
    .withMessage('Auto contribution must be an object')
    .custom((autoContrib) => {
      if (autoContrib.enabled && typeof autoContrib.enabled !== 'boolean') {
        throw new Error('auto_contribution.enabled must be a boolean');
      }
      if (autoContrib.amount && (typeof autoContrib.amount !== 'number' || autoContrib.amount <= 0)) {
        throw new Error('auto_contribution.amount must be a positive number');
      }
      if (autoContrib.frequency && !['daily', 'weekly', 'monthly'].includes(autoContrib.frequency)) {
        throw new Error('Invalid auto contribution frequency');
      }
      if (autoContrib.start_date && !new Date(autoContrib.start_date).getTime()) {
        throw new Error('Invalid auto contribution start_date format');
      }
      return true;
    })
];

// Validation for updating goal
const validateUpdateGoal = [
  param('id')
    .isUUID()
    .withMessage('Invalid goal ID format'),
    
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
    
  body('target_amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number greater than 0'),
    
  body('current_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount must be a non-negative number'),
    
  body('category')
    .optional()
    .isIn([
      'emergency_fund', 'vacation_travel', 'home_purchase', 'car_purchase',
      'wedding', 'education', 'retirement', 'investment', 'debt_payoff',
      'home_improvement', 'healthcare', 'business', 'gadgets_electronics', 'other'
    ])
    .withMessage('Invalid category'),
    
  body('target_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid target date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
    
  body('status')
    .optional()
    .isIn(['active', 'completed', 'paused', 'cancelled'])
    .withMessage('Status must be one of: active, completed, paused, cancelled'),
    
  body('is_shared')
    .optional()
    .isBoolean()
    .withMessage('is_shared must be a boolean value'),
    
  body('contribution_method')
    .optional()
    .isIn(['equal', 'percentage', 'custom'])
    .withMessage('Contribution method must be one of: equal, percentage, custom'),
    
  body('contribution_settings')
    .optional()
    .isObject()
    .withMessage('Contribution settings must be an object'),
    
  body('auto_contribution')
    .optional()
    .isObject()
    .withMessage('Auto contribution must be an object')
];

// Validation for getting goal by ID
const validateGetGoalById = [
  param('id')
    .isUUID()
    .withMessage('Invalid goal ID format')
];

// Validation for deleting goal
const validateDeleteGoal = [
  param('id')
    .isUUID()
    .withMessage('Invalid goal ID format')
];

// Validation for adding contribution
const validateAddContribution = [
  param('id')
    .isUUID()
    .withMessage('Invalid goal ID format'),
    
  body('amount')
    .notEmpty()
    .withMessage('Contribution amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Contribution amount must be a positive number greater than 0'),
    
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

// Validation for query parameters
const validateGoalQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('category')
    .optional()
    .isIn([
      'emergency_fund', 'vacation_travel', 'home_purchase', 'car_purchase',
      'wedding', 'education', 'retirement', 'investment', 'debt_payoff',
      'home_improvement', 'healthcare', 'business', 'gadgets_electronics', 'other'
    ])
    .withMessage('Invalid category filter'),
    
  query('status')
    .optional()
    .isIn(['active', 'completed', 'paused', 'cancelled'])
    .withMessage('Invalid status filter'),
    
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter')
];

module.exports = {
  validateCreateGoal,
  validateUpdateGoal,
  validateGetGoalById,
  validateDeleteGoal,
  validateAddContribution,
  validateGoalQuery
};