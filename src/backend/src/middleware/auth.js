const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to verify user is verified
const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }
  next();
};

// Middleware to check if user has a couple relationship
const requireCouple = async (req, res, next) => {
  try {
    const { Couple } = require('../models');
    
    const couple = await Couple.findByUser(req.user.id);
    if (!couple) {
      return res.status(403).json({
        success: false,
        message: 'Couple relationship required for this action'
      });
    }

    req.couple = couple;
    next();

  } catch (error) {
    logger.error('Couple check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.resource ? req.resource[resourceField] : req.params.userId;
    
    if (resourceUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }
    
    next();
  };
};

// Middleware to check if user is part of the couple for the resource
const requireCoupleAccess = async (req, res, next) => {
  try {
    if (!req.couple) {
      return res.status(403).json({
        success: false,
        message: 'Couple relationship required'
      });
    }

    // Check if the resource belongs to the couple
    const resourceCoupleId = req.resource ? req.resource.couple_id : req.params.coupleId;
    
    if (resourceCoupleId && resourceCoupleId !== req.couple.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - resource belongs to different couple'
      });
    }

    next();

  } catch (error) {
    logger.error('Couple access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to load and check resource ownership
const loadResource = (Model, paramName = 'id', includeOptions = []) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      const resource = await Model.findByPk(resourceId, {
        include: includeOptions
      });
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      req.resource = resource;
      next();

    } catch (error) {
      logger.error('Load resource error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (user && user.status === 'active') {
      req.user = user;
    }

    next();

  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

// Rate limiting by user
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    requests.push(now);
    userRequests.set(userId, requests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireVerified,
  requireCouple,
  requireOwnership,
  requireCoupleAccess,
  loadResource,
  optionalAuth,
  rateLimitByUser
};