const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  addContribution,
  getCategories,
  getGoalStats
} = require('../controllers/goalController');
const {
  validateCreateGoal,
  validateUpdateGoal,
  validateGetGoalById,
  validateDeleteGoal,
  validateAddContribution,
  validateGoalQuery
} = require('../middleware/goalValidation');

// Get goal categories (public route)
router.get('/categories', getCategories);

// Get goal statistics
router.get('/stats', authenticateToken, getGoalStats);

// Get all goals
router.get('/', authenticateToken, validateGoalQuery, getAllGoals);

// Create new goal
router.post('/', authenticateToken, validateCreateGoal, createGoal);

// Get goal by ID
router.get('/:id', authenticateToken, validateGetGoalById, getGoalById);

// Update goal
router.put('/:id', authenticateToken, validateUpdateGoal, updateGoal);

// Delete goal
router.delete('/:id', authenticateToken, validateDeleteGoal, deleteGoal);

// Add contribution to goal
router.post('/:id/contribute', authenticateToken, validateAddContribution, addContribution);

module.exports = router;