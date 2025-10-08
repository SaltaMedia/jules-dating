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

    console.log('🔍 Auth middleware debug:');
    console.log('  Token:', token.substring(0, 50) + '...');
    console.log('  JWT Secret exists:', !!getJWTSecret());
    console.log('  JWT Secret length:', getJWTSecret().length);

    const decoded = jwt.verify(token, getJWTSecret());
    console.log('  Decoded userId:', decoded.userId);
    console.log('  Decoded userId type:', typeof decoded.userId);

    const user = await User.findById(decoded.userId).select('-password');
    console.log('  User found:', !!user);
    console.log('  User email:', user?.email);

    if (!user) {
      console.log('  ❌ User not found with ID:', decoded.userId);
      throw new AuthenticationError('Token is not valid');
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      isAdmin: user.isAdmin // Use database value, not JWT token value
    };
    req.userData = user;
    console.log('  ✅ Auth successful for:', user.email);
    next();
  } catch (error) {
    console.log('  ❌ Auth error:', error.message);
    logError('Auth middleware error', error);
    next(error);
  }
};

module.exports = auth; 