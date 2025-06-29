const { body, param, query } = require('express-validator');

// User registration validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('id-ID')
    .withMessage('Please provide a valid Indonesian phone number'),
  
  body('date_of_birth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth')
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Refresh token validation
const validateRefreshToken = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Forgot password validation
const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Reset password validation
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Update profile validation
const validateUpdateProfile = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('id-ID')
    .withMessage('Please provide a valid Indonesian phone number'),
  
  body('date_of_birth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth'),
  
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  
  body('preferences.currency')
    .optional()
    .isIn(['IDR', 'USD', 'EUR'])
    .withMessage('Currency must be IDR, USD, or EUR'),
  
  body('preferences.language')
    .optional()
    .isIn(['id', 'en'])
    .withMessage('Language must be id or en')
];

// Change password validation
const validateChangePassword = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

// Expense validation
const validateExpense = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  
  body('category')
    .isIn([
      'food_dining', 'transportation', 'shopping', 'entertainment',
      'bills_utilities', 'healthcare', 'education', 'travel',
      'groceries', 'personal_care', 'gifts_donations', 'home_garden',
      'sports_fitness', 'technology', 'insurance', 'investments', 'other'
    ])
    .withMessage('Invalid expense category'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('expense_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid expense date'),
  
  body('payment_method')
    .optional()
    .isIn(['cash', 'debit_card', 'credit_card', 'bank_transfer', 'e_wallet', 'other'])
    .withMessage('Invalid payment method'),
  
  body('is_shared')
    .optional()
    .isBoolean()
    .withMessage('is_shared must be a boolean'),
  
  body('shared_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Shared percentage must be between 0 and 100'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

// Goal validation
const validateGoal = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('target_amount')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number'),
  
  body('category')
    .isIn([
      'emergency_fund', 'vacation_travel', 'home_purchase', 'car_purchase',
      'wedding', 'education', 'retirement', 'investment', 'debt_payoff',
      'home_improvement', 'healthcare', 'business', 'gadgets_electronics', 'other'
    ])
    .withMessage('Invalid goal category'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('target_date')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    })
    .withMessage('Please provide a valid future target date'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('is_shared')
    .optional()
    .isBoolean()
    .withMessage('is_shared must be a boolean'),
  
  body('contribution_method')
    .optional()
    .isIn(['equal', 'percentage', 'custom'])
    .withMessage('Invalid contribution method')
];

// Transaction validation
const validateTransaction = [
  body('goal_id')
    .isUUID()
    .withMessage('Valid goal ID is required'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  
  body('type')
    .optional()
    .isIn(['contribution', 'withdrawal', 'adjustment'])
    .withMessage('Invalid transaction type'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('payment_method')
    .optional()
    .isIn(['cash', 'debit_card', 'credit_card', 'bank_transfer', 'e_wallet', 'other'])
    .withMessage('Invalid payment method')
];

// Couple invitation validation
const validateCoupleInvitation = [
  body('partner_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid partner email address'),
  
  body('couple_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Couple name must be between 2 and 100 characters'),
  
  body('relationship_start_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid relationship start date')
];

// UUID parameter validation
const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`)
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be asc or desc')
];

// Date range validation
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid start date'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      if (value && req.query.start_date && new Date(value) <= new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
    .withMessage('Please provide a valid end date')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateChangePassword,
  validateExpense,
  validateGoal,
  validateTransaction,
  validateCoupleInvitation,
  validateUUIDParam,
  validatePagination,
  validateDateRange
};