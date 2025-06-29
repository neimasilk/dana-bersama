const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateGetSummary,
  validateGetExpenseAnalytics,
  validateGetGoalProgress,
  validateGetSpendingTrends
} = require('../middleware/reportValidation');

// Report routes
router.get('/summary', authenticateToken, validateGetSummary, reportController.getSummary);
router.get('/expense-analytics', authenticateToken, validateGetExpenseAnalytics, reportController.getExpenseAnalytics);
router.get('/goal-progress', authenticateToken, validateGetGoalProgress, reportController.getGoalProgress);
router.get('/spending-trends', authenticateToken, validateGetSpendingTrends, reportController.getSpendingTrends);

module.exports = router;