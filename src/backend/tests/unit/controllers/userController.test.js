const request = require('supertest');
const express = require('express');
const userController = require('../../../src/controllers/userController');
const { User, Couple } = require('../../../src/models');
const { authenticateToken } = require('../../../src/middleware/auth');
const {
  validateUpdateProfile,
  validateChangePassword,
  validateInvitePartner,
  validateAcceptInvitation
} = require('../../../src/middleware/userValidation');
const bcrypt = require('bcryptjs');

// Mock the models
jest.mock('../../../src/models');
jest.mock('bcryptjs');

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1 };
    next();
  }
}));

// Mock validation middleware
jest.mock('../../../src/middleware/userValidation', () => ({
  validateUpdateProfile: (req, res, next) => {
    const errors = [];
    if (req.body.full_name && req.body.full_name.length < 2) {
      errors.push({ msg: 'Full name must be at least 2 characters long' });
    }
    if (req.body.phone && !/^\+?[1-9]\d{1,14}$/.test(req.body.phone)) {
      errors.push({ msg: 'Invalid phone number format' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  },
  validateChangePassword: (req, res, next) => {
    const errors = [];
    if (!req.body.new_password || req.body.new_password.length < 8) {
      errors.push({ msg: 'Password must be at least 8 characters long' });
    }
    if (req.body.new_password !== req.body.confirm_password) {
      errors.push({ msg: 'Passwords do not match' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  },
  validateInvitePartner: (req, res, next) => {
    const errors = [];
    if (!req.body.partner_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.partner_email)) {
      errors.push({ msg: 'Valid email is required' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  },
  validateAcceptInvitation: (req, res, next) => {
    const errors = [];
    if (!req.body.invitation_token) {
      errors.push({ msg: 'Invitation token is required' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  }
}));

const app = express();
app.use(express.json());

// Setup routes
app.get('/users/profile', authenticateToken, userController.getProfile);
app.put('/users/profile', authenticateToken, validateUpdateProfile, userController.updateProfile);
app.put('/users/change-password', authenticateToken, validateChangePassword, userController.changePassword);
app.post('/users/invite-partner', authenticateToken, validateInvitePartner, userController.invitePartner);
app.post('/users/accept-invitation', authenticateToken, validateAcceptInvitation, userController.acceptInvitation);
app.get('/users/pending-invitations', authenticateToken, userController.getPendingInvitations);
app.delete('/users/leave-couple', authenticateToken, userController.leaveCouple);

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mocks to default behavior
    User.findByPk.mockResolvedValue(null);
    User.findOne.mockResolvedValue(null);
    User.update.mockResolvedValue([0]);
    Couple.findByPk.mockResolvedValue(null);
    Couple.findOne.mockResolvedValue(null);
    Couple.findAll.mockResolvedValue([]);
    Couple.create.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hashedPassword');
  });

  describe('GET /users/profile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        profile_picture: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        couple: null
      };

      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        profile_picture: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      });
      expect(response.body.data.couple).toBeNull();
    });

    it('should get user profile with couple information', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        profile_picture: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        couple: {
          id: 1,
          couple_name: 'Test Couple',
          created_at: '2024-01-01T00:00:00.000Z',
          users: [
            { id: 1, username: 'testuser', full_name: 'Test User', email: 'test@example.com' },
            { id: 2, username: 'partner', full_name: 'Partner User', email: 'partner@example.com' }
          ]
        }
      };

      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.couple).toEqual({
        id: 1,
        couple_name: 'Test Couple',
        created_at: '2024-01-01T00:00:00.000Z',
        partner: { id: 2, username: 'partner', full_name: 'Partner User', email: 'partner@example.com' }
      });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/profile')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const updatedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Updated Name',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        profile_picture: 'https://example.com/new-avatar.jpg',
        updated_at: '2024-01-02T00:00:00.000Z'
      };

      User.findByPk
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);

      const response = await request(app)
        .put('/users/profile')
        .send({
          full_name: 'Updated Name',
          profile_picture: 'https://example.com/new-avatar.jpg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.full_name).toBe('Updated Name');
      expect(mockUser.update).toHaveBeenCalledWith({
        full_name: 'Updated Name',
        profile_picture: 'https://example.com/new-avatar.jpg'
      });
    });

    it('should return validation error for invalid data', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({
          full_name: 'A', // Too short
          phone: 'invalid-phone'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/users/profile')
        .send({ full_name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /users/change-password', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 1,
        password: 'hashedCurrentPassword',
        update: jest.fn().mockResolvedValue(true)
      };

      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      const response = await request(app)
        .put('/users/change-password')
        .send({
          current_password: 'currentPassword123!',
          new_password: 'newPassword123!',
          confirm_password: 'newPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
      expect(bcrypt.compare).toHaveBeenCalledWith('currentPassword123!', 'hashedCurrentPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123!', 12);
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'hashedNewPassword' });
    });

    it('should return error for incorrect current password', async () => {
      const mockUser = {
        id: 1,
        password: 'hashedCurrentPassword'
      };

      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .put('/users/change-password')
        .send({
          current_password: 'wrongPassword',
          new_password: 'newPassword123!',
          confirm_password: 'newPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should return validation error for weak password', async () => {
      const response = await request(app)
        .put('/users/change-password')
        .send({
          current_password: 'currentPassword123!',
          new_password: 'weak',
          confirm_password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /users/invite-partner', () => {
    it('should invite partner successfully', async () => {
      const currentUser = { id: 1, couple_id: null, full_name: 'Test User' };
      const partner = { id: 2, email: 'partner@example.com', couple_id: null, full_name: 'Partner User' };
      const mockCouple = {
        id: 1,
        couple_name: 'Test User & Partner User',
        user1_id: 1,
        user2_id: 2,
        status: 'pending',
        invitation_token: 'abc123',
        invitation_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        invited_by: 1
      };

      User.findByPk.mockResolvedValue(currentUser);
      User.findOne.mockResolvedValue(partner);
      Couple.create.mockResolvedValue(mockCouple);

      const response = await request(app)
        .post('/users/invite-partner')
        .send({
          partner_email: 'partner@example.com',
          couple_name: 'Our Couple'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Partner invitation sent successfully');
      expect(response.body.data.couple_id).toBe(1);
      expect(response.body.data.status).toBe('pending');
    });

    it('should return error if user already has couple', async () => {
      const currentUser = { id: 1, couple_id: 1 };
      User.findByPk.mockResolvedValue(currentUser);

      const response = await request(app)
        .post('/users/invite-partner')
        .send({ partner_email: 'partner@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are already in a couple relationship');
    });

    it('should return error if partner not found', async () => {
      const currentUser = { id: 1, couple_id: null };
      User.findByPk.mockResolvedValue(currentUser);
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/invite-partner')
        .send({ partner_email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Partner not found with this email address');
    });

    it('should return error if trying to invite self', async () => {
      const currentUser = { id: 1, couple_id: null };
      const partner = { id: 1, email: 'test@example.com', couple_id: null };
      
      User.findByPk.mockResolvedValue(currentUser);
      User.findOne.mockResolvedValue(partner);

      const response = await request(app)
        .post('/users/invite-partner')
        .send({ partner_email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You cannot invite yourself');
    });
  });

  describe('POST /users/accept-invitation', () => {
    it('should return error for invalid token', async () => {
      const currentUser = { id: 2, couple_id: null };
      User.findByPk.mockResolvedValueOnce(currentUser);
      Couple.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/users/accept-invitation')
        .send({ invitation_token: 'invalidtoken' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired invitation token');
    });

    it('should return error for expired invitation', async () => {
      const currentUser = { id: 2, couple_id: null };
      const expiredCouple = {
        id: 1,
        user2_id: 2,
        invitation_expiry: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };

      User.findByPk.mockResolvedValueOnce(currentUser);
      Couple.findOne.mockResolvedValueOnce(expiredCouple);

      const response = await request(app)
        .post('/users/accept-invitation')
        .send({ invitation_token: 'expiredtoken' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invitation has expired');
    });
  });

  describe('GET /users/pending-invitations', () => {
    it('should get pending invitations successfully', async () => {
      const mockInvitations = [
        {
          id: 1,
          couple_name: 'Test Couple',
          invitation_token: 'token123',
          invitation_expiry: '2024-12-31T23:59:59.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          user1: {
            id: 2,
            username: 'inviter',
            email: 'inviter@example.com',
            full_name: 'Inviter User',
            profile_picture: 'https://example.com/avatar.jpg'
          }
        }
      ];

      Couple.findAll.mockResolvedValue(mockInvitations);

      const response = await request(app)
        .get('/users/pending-invitations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitations).toHaveLength(1);
      expect(response.body.data.invitations[0]).toEqual({
        id: 1,
        couple_name: 'Test Couple',
        invitation_token: 'token123',
        invitation_expiry: '2024-12-31T23:59:59.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        inviter: {
          id: 2,
          username: 'inviter',
          email: 'inviter@example.com',
          full_name: 'Inviter User',
          profile_picture: 'https://example.com/avatar.jpg'
        }
      });
    });

    it('should return empty array when no pending invitations', async () => {
      Couple.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/users/pending-invitations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitations).toHaveLength(0);
    });
  });

  describe('DELETE /users/leave-couple', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should leave couple successfully', async () => {
      const user = { id: 1, couple_id: 1 };
      const couple = { id: 1, destroy: jest.fn().mockResolvedValue(true) };

      // Mock the sequence of calls with specific order
      User.findByPk.mockResolvedValueOnce(user);
      Couple.findByPk.mockResolvedValueOnce(couple);
      User.update.mockResolvedValueOnce([2]); // Mock affected rows

      const response = await request(app)
        .delete('/users/leave-couple')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully left couple relationship');
      expect(User.update).toHaveBeenCalledWith(
        { couple_id: null },
        { where: { couple_id: 1 } }
      );
      expect(couple.destroy).toHaveBeenCalled();
    });

    it('should return error if user not in couple', async () => {
      const user = { id: 1, couple_id: null };
      User.findByPk.mockResolvedValueOnce(user);

      const response = await request(app)
        .delete('/users/leave-couple')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not in a couple relationship');
    });

    it('should handle database errors', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/users/leave-couple')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in getProfile', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/users/profile')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle database errors in updateProfile', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/users/profile')
        .send({ full_name: 'Test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });
});