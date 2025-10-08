const { logInfo, logError, logWarn } = require('../utils/logger');

/**
 * Session Manager Middleware
 * Handles session management for API requests
 */
const sessionManagerMiddleware = (req, res, next) => {
  try {
    // Add session ID to request if not present
    if (!req.sessionID) {
      req.sessionID = req.session?.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Log session activity for debugging
    if (process.env.NODE_ENV === 'development') {
      logInfo(`Session Manager: ${req.method} ${req.path} - Session ID: ${req.sessionID}`);
    }

    // Add session info to request object
    req.sessionInfo = {
      id: req.sessionID,
      isNew: req.session?.isNew || false,
      timestamp: new Date().toISOString()
    };

    next();
  } catch (error) {
    logError('Session Manager middleware error', error);
    next(error);
  }
};

module.exports = {
  sessionManagerMiddleware
};