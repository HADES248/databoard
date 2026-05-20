const { verifyAccessToken } = require('../utils/jwt.js');
const { sendError } = require('../utils/response');
const User = require('../models/User');

// Verify JWT access token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token expired', 401);
      }
      return sendError(res, 'Invalid access token', 401);
    }

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      return sendError(res, 'User not found or deactivated', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Authentication failed', 500);
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}`,
        403
      );
    }
    next();
  };
};

// Optional auth - attaches user if token present, doesn't fail if not
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (user && user.isActive) req.user = user;
  } catch {
    // Silently ignore token errors for optional auth
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };