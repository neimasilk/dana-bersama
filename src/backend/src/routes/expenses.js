const express = require('express');
const router = express.Router();

// Placeholder for expense controller
const expenseController = {
  getAllExpenses: (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Get all expenses endpoint - Coming soon',
      data: []
    });
  },
  createExpense: (req, res) => {
    res.status(201).json({
      success: true,
      message: 'Create expense endpoint - Coming soon',
      data: null
    });
  },
  getExpenseById: (req, res) => {
    res.status(200).json({
      success: true,
      message: `Get expense ${req.params.id} endpoint - Coming soon`,
      data: null
    });
  },
  updateExpense: (req, res) => {
    res.status(200).json({
      success: true,
      message: `Update expense ${req.params.id} endpoint - Coming soon`,
      data: null
    });
  },
  deleteExpense: (req, res) => {
    res.status(200).json({
      success: true,
      message: `Delete expense ${req.params.id} endpoint - Coming soon`,
      data: null
    });
  },
  getCategories: (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Get expense categories endpoint - Coming soon',
      data: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other']
    });
  }
};

// Expense routes
router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.get('/categories', expenseController.getCategories);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;