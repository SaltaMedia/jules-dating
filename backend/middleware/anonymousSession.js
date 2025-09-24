const AnonymousSession = require('../models/AnonymousSession');
const { logInfo, logWarn, logError } = require('../utils/logger');
const crypto = require('crypto');

// Generate a secure random session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Get client IP address
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
}

// Get user agent
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

// Anonymous session middleware
const anonymousSession = async (req, res, next) => {
  try {
    console.log('DEBUG: Anonymous session middleware called');
    console.log('DEBUG: req.user:', req.user);
    console.log('DEBUG: req.userId:', req.userId);
    
    // Skip if user is already authenticated
    if (req.user) {
      logInfo('User is authenticated, skipping anonymous session');
      return next();
    }

    // Check if session ID exists in request
    let sessionId = req.headers['x-anonymous-session-id'] || 
                   req.body?.anonymousSessionId ||
                   req.query?.anonymousSessionId;

    let session = null;

    if (sessionId) {
      // Try to find existing session
      session = await AnonymousSession.getSession(sessionId);
      
      if (session) {
        // Check if session is expired
        if (session.expiresAt < new Date()) {
          logWarn(`Anonymous session ${sessionId} has expired, creating new one`);
          session = null;
        } else {
          logInfo(`Found existing anonymous session: ${sessionId}`);
        }
      } else {
        logWarn(`Anonymous session ${sessionId} not found, creating new one`);
      }
    }

    // Create new session if none exists
    if (!session) {
      sessionId = generateSessionId();
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);
      
      session = await AnonymousSession.createSession(sessionId, ipAddress, userAgent);
      logInfo(`Created new anonymous session: ${sessionId}`);
    }

    // Attach session to request
    req.anonymousSession = session;
    req.anonymousId = sessionId;

    // Add session ID to response headers for frontend
    res.set('X-Anonymous-Session-ID', sessionId);

    next();
  } catch (error) {
    logError('Anonymous session middleware error:', error);
    
    // Don't block the request if anonymous session fails
    // Just continue without anonymous session
    req.anonymousSession = null;
    req.anonymousId = null;
    next();
  }
};

// Optional anonymous session middleware (doesn't create session if none exists)
const optionalAnonymousSession = async (req, res, next) => {
  try {
    // Skip if user is already authenticated
    if (req.user) {
      return next();
    }

    // Check if session ID exists in request
    const sessionId = req.headers['x-anonymous-session-id'] || 
                     req.body?.anonymousSessionId ||
                     req.query?.anonymousSessionId;

    if (sessionId) {
      const session = await AnonymousSession.getSession(sessionId);
      
      if (session && session.expiresAt > new Date()) {
        req.anonymousSession = session;
        req.anonymousId = sessionId;
        logInfo(`Found valid anonymous session: ${sessionId}`);
      } else {
        logWarn(`Invalid or expired anonymous session: ${sessionId}`);
      }
    }

    next();
  } catch (error) {
    logError('Optional anonymous session middleware error:', error);
    next();
  }
};

// Middleware to ensure anonymous session exists
const requireAnonymousSession = (req, res, next) => {
  if (!req.anonymousSession) {
    return res.status(400).json({
      error: 'Anonymous session required',
      message: 'Please refresh the page to start a new session'
    });
  }
  next();
};

module.exports = {
  anonymousSession,
  optionalAnonymousSession,
  requireAnonymousSession
};
