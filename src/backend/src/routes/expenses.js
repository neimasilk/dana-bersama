const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getCategories,
  getExpenseStats
} = require('../controllers/expenseController');
const {
  validateCreateExpense,
  validateUpdateExpense,
  validateGetExpenseById,
  validateDeleteExpense,
  validateExpenseQuery,
  validateExpenseStats
} = require('../middleware/expenseValidation');

// Get expense categories (public route)
router.get('/categories', getCategories);

// Get expense statistics
router.get('/stats', authenticateToken, validateExpenseStats, getExpenseStats);

// Get all expenses
router.get('/', authenticateToken, validateExpenseQuery, getAllExpenses);

// Create new expense
router.post('/', authenticateToken, validateCreateExpense, createExpense);

// Get expense by ID
router.get('/:id', authenticateToken, validateGetExpenseById, getExpenseById);

// Update expense
router.put('/:id', authenticateToken, validateUpdateExpense, updateExpense);

// Delete expense
router.delete('/:id', authenticateToken, validateDeleteExpense, deleteExpense);

module.exports = router;