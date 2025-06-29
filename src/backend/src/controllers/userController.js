const { User, Couple } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'full_name', 'phone', 'date_of_birth', 'profile_picture', 'couple_id', 'created_at', 'updated_at'],
      include: [
        {
          model: Couple,
          as: 'couple',
          attributes: ['id', 'couple_name', 'created_at'],
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['id', 'username', 'full_name', 'email']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          date_of_birth: user.date_of_birth,
          profile_picture: user.profile_picture,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        couple: user.couple ? {
          id: user.couple.id,
          couple_name: user.couple.couple_name,
          created_at: user.couple.created_at,
          partner: user.couple.users ? user.couple.users.find(u => u.id !== userId) : null
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { full_name, phone, date_of_birth, profile_picture } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user profile
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture;

    await user.update(updateData);

    // Get updated user data
    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'full_name', 'phone', 'date_of_birth', 'profile_picture', 'updated_at']
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await user.update({ password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Invite partner to create couple
 */
const invitePartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { partner_email, couple_name } = req.body;
    
    // Check if user already has a couple
    const currentUser = await User.findByPk(userId);
    if (currentUser.couple_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a couple relationship'
      });
    }

    // Check if partner exists
    const partner = await User.findOne({ where: { email: partner_email } });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found with this email address'
      });
    }

    // Check if partner already has a couple
    if (partner.couple_id) {
      return res.status(400).json({
        success: false,
        message: 'Partner is already in a couple relationship'
      });
    }

    // Check if user is trying to invite themselves
    if (partner.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself'
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create couple with pending status
    const couple = await Couple.create({
      couple_name: couple_name || `${currentUser.full_name || currentUser.username} & ${partner.full_name || partner.username}`,
      user1_id: userId,
      user2_id: partner.id,
      status: 'pending',
      invitation_token: invitationToken,
      invitation_expiry: invitationExpiry,
      invited_by: userId
    });

    res.status(201).json({
      success: true,
      message: 'Partner invitation sent successfully',
      data: {
        couple_id: couple.id,
        couple_name: couple.couple_name,
        partner: {
          id: partner.id,
          username: partner.username,
          email: partner.email,
          full_name: partner.full_name
        },
        invitation_token: invitationToken,
        invitation_expiry: invitationExpiry,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error inviting partner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Accept partner invitation
 */
const acceptInvitation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { invitation_token } = req.body;
    
    // Check if user already has a couple
    const currentUser = await User.findByPk(userId);
    if (currentUser.couple_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a couple relationship'
      });
    }

    // Find couple invitation
    const couple = await Couple.findOne({
      where: {
        invitation_token: invitation_token,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'username', 'email', 'full_name']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'username', 'email', 'full_name']
        }
      ]
    });

    if (!couple) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Check if invitation has expired
    if (new Date() > couple.invitation_expiry) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Check if current user is the invited partner
    if (couple.user2_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this invitation'
      });
    }

    // Update couple status to active
    await couple.update({
      status: 'active',
      invitation_token: null,
      invitation_expiry: null
    });

    // Update both users' couple_id
    await User.update(
      { couple_id: couple.id },
      { where: { id: [couple.user1_id, couple.user2_id] } }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        couple: {
          id: couple.id,
          couple_name: couple.couple_name,
          status: 'active',
          created_at: couple.created_at,
          partner: couple.user1_id === userId ? couple.user1 : couple.user2
        }
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get pending invitations for current user
 */
const getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find pending invitations where current user is the invited partner
    const pendingInvitations = await Couple.findAll({
      where: {
        user2_id: userId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'username', 'email', 'full_name', 'profile_picture']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Pending invitations retrieved successfully',
      data: {
        invitations: pendingInvitations.map(invitation => ({
          id: invitation.id,
          couple_name: invitation.couple_name,
          invitation_token: invitation.invitation_token,
          invitation_expiry: invitation.invitation_expiry,
          created_at: invitation.created_at,
          inviter: invitation.user1
        }))
      }
    });
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Leave couple relationship
 */
const leaveCouple = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user.couple_id) {
      return res.status(400).json({
        success: false,
        message: 'You are not in a couple relationship'
      });
    }

    const couple = await Couple.findByPk(user.couple_id);
    if (!couple) {
      return res.status(404).json({
        success: false,
        message: 'Couple not found'
      });
    }

    // Remove couple_id from both users
    await User.update(
      { couple_id: null },
      { where: { couple_id: couple.id } }
    );

    // Delete the couple record
    await couple.destroy();

    res.status(200).json({
      success: true,
      message: 'Successfully left couple relationship'
    });
  } catch (error) {
    console.error('Error leaving couple:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  invitePartner,
  acceptInvitation,
  getPendingInvitations,
  leaveCouple
};