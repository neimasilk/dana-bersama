const { body, param } = require('express-validator');

/**
 * Validation for updating user profile
 */
const validateUpdateProfile = [
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim(),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      
      return true;
    }),
  body('profile_picture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')
];

/**
 * Validation for changing password
 */
const validateChangePassword = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'g')
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation for inviting partner
 */
const validateInvitePartner = [
  body('partner_email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('couple_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Couple name must be between 2 and 100 characters')
    .trim()
];

/**
 * Validation for accepting invitation
 */
const validateAcceptInvitation = [
  body('invitation_token')
    .notEmpty()
    .withMessage('Invitation token is required')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid invitation token format')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Invitation token must be a valid hexadecimal string')
];

module.exports = {
  validateUpdateProfile,
  validateChangePassword,
  validateInvitePartner,
  validateAcceptInvitation
};