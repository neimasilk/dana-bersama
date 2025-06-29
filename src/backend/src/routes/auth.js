const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout
router.post('/logout', authenticateToken, authController.logout);

// POST /api/auth/refresh
router.post('/refresh', validateRefreshToken, authController.refreshToken);

// POST /api/auth/forgot-password
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// GET /api/auth/verify/:token
router.get('/verify/:token', authController.verifyEmail);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getCurrentUser);

// GET /api/auth/profile
router.get('/profile', authenticateToken, authController.getProfile);

// PUT /api/auth/profile
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;