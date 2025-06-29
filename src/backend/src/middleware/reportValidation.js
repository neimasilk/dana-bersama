const { body, query, param } = require('express-validator');

/**
 * Validation for getting financial summary
 */
const validateGetSummary = [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Period must be one of: week, month, year')
];

/**
 * Validation for getting expense analytics
 */
const validateGetExpenseAnalytics = [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Period must be one of: week, month, year'),
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months must be an integer between 1 and 24')
    .toInt()
];

/**
 * Validation for getting goal progress
 */
const validateGetGoalProgress = [
  // No specific validation needed for goal progress endpoint
  // Authentication is handled by auth middleware
];

/**
 * Validation for getting spending trends
 */
const validateGetSpendingTrends = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage('Months must be an integer between 1 and 36')
    .toInt()
];

module.exports = {
  validateGetSummary,
  validateGetExpenseAnalytics,
  validateGetGoalProgress,
  validateGetSpendingTrends
};