const { body, param, query } = require('express-validator');

// Validation for creating expense
const validateCreateExpense = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
    
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'food_dining', 'transportation', 'shopping', 'entertainment',
      'bills_utilities', 'healthcare', 'education', 'travel',
      'groceries', 'personal_care', 'gifts_donations', 'home_garden',
      'sports_fitness', 'technology', 'insurance', 'investments', 'other'
    ])
    .withMessage('Invalid category'),
    
  body('expense_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'),
    
  body('payment_method')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'other'])
    .withMessage('Invalid payment method'),
    
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
    
  body('receipt_url')
    .optional()
    .isURL()
    .withMessage('Receipt URL must be a valid URL'),
    
  body('is_shared')
    .optional()
    .isBoolean()
    .withMessage('is_shared must be a boolean value'),
    
  body('shared_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Shared percentage must be between 0 and 100'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          throw new Error('Each tag must be a string with maximum 50 characters');
        }
      }
      return true;
    }),
    
  body('recurring')
    .optional()
    .isObject()
    .withMessage('Recurring must be an object')
    .custom((recurring) => {
      if (recurring.enabled && typeof recurring.enabled !== 'boolean') {
        throw new Error('recurring.enabled must be a boolean');
      }
      if (recurring.frequency && !['daily', 'weekly', 'monthly', 'yearly'].includes(recurring.frequency)) {
        throw new Error('Invalid recurring frequency');
      }
      if (recurring.end_date && !new Date(recurring.end_date).getTime()) {
        throw new Error('Invalid recurring end_date format');
      }
      return true;
    })
];

// Validation for updating expense
const validateUpdateExpense = [
  param('id')
    .isUUID()
    .withMessage('Invalid expense ID format'),
    
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
    
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('category')
    .optional()
    .isIn([
      'food_dining', 'transportation', 'shopping', 'entertainment',
      'bills_utilities', 'healthcare', 'education', 'travel',
      'groceries', 'personal_care', 'gifts_donations', 'home_garden',
      'sports_fitness', 'technology', 'insurance', 'investments', 'other'
    ])
    .withMessage('Invalid category'),
    
  body('expense_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'),
    
  body('payment_method')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'other'])
    .withMessage('Invalid payment method'),
    
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
    
  body('receipt_url')
    .optional()
    .isURL()
    .withMessage('Receipt URL must be a valid URL'),
    
  body('is_shared')
    .optional()
    .isBoolean()
    .withMessage('is_shared must be a boolean value'),
    
  body('shared_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Shared percentage must be between 0 and 100'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          throw new Error('Each tag must be a string with maximum 50 characters');
        }
      }
      return true;
    }),
    
  body('recurring')
    .optional()
    .isObject()
    .withMessage('Recurring must be an object')
    .custom((recurring) => {
      if (recurring.enabled && typeof recurring.enabled !== 'boolean') {
        throw new Error('recurring.enabled must be a boolean');
      }
      if (recurring.frequency && !['daily', 'weekly', 'monthly', 'yearly'].includes(recurring.frequency)) {
        throw new Error('Invalid recurring frequency');
      }
      if (recurring.end_date && !new Date(recurring.end_date).getTime()) {
        throw new Error('Invalid recurring end_date format');
      }
      return true;
    })
];

// Validation for getting expense by ID
const validateGetExpenseById = [
  param('id')
    .isUUID()
    .withMessage('Invalid expense ID format')
];

// Validation for deleting expense
const validateDeleteExpense = [
  param('id')
    .isUUID()
    .withMessage('Invalid expense ID format')
];

/**
 * Validation for expense query parameters
 */
const validateExpenseQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number')
    .toFloat(),
  query('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number')
    .toFloat()
];

// Validation for expense statistics
const validateExpenseStats = [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Period must be one of: week, month, year')
];

module.exports = {
  validateCreateExpense,
  validateUpdateExpense,
  validateGetExpenseById,
  validateDeleteExpense,
  validateExpenseQuery,
  validateExpenseStats
};