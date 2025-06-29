const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUpdateProfile,
  validateChangePassword,
  validateInvitePartner,
  validateAcceptInvitation
} = require('../middleware/userValidation');

// User routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, userController.updateProfile);
router.put('/change-password', authenticateToken, validateChangePassword, userController.changePassword);
router.post('/invite-partner', authenticateToken, validateInvitePartner, userController.invitePartner);
router.post('/accept-invitation', authenticateToken, validateAcceptInvitation, userController.acceptInvitation);
router.get('/pending-invitations', authenticateToken, userController.getPendingInvitations);
router.delete('/leave-couple', authenticateToken, userController.leaveCouple);

module.exports = router;