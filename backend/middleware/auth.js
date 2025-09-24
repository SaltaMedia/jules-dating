const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logWarn, logError } = require('../utils/logger');
const { AuthenticationError } = require('../utils/errorHandler');

// Get JWT secret with proper error handling
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    logWarn('JWT_SECRET not set, using development fallback. This should not be used in production.');
    return 'dev-jwt-secret-only-for-development';
  }
  return secret;
}

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AuthenticationError('No token, authorization denied');
    }

    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new AuthenticationError('Token is not valid');
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      isAdmin: user.isAdmin // Use database value, not JWT token value
    };
    req.userData = user;
    next();
  } catch (error) {
    logError('Auth middleware error', error);
    next(error);
  }
};

module.exports = auth; 