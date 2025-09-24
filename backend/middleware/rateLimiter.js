const AnonymousSession = require('../models/AnonymousSession');
const { logInfo, logWarn, logError } = require('../utils/logger');

// Free user limits
const FREE_LIMITS = {
  fitChecks: 1,
  profilePicReviews: 1,
  chatMessages: 5
};

// Rate limiter middleware factory
const rateLimiter = (limits) => {
  return async (req, res, next) => {
    try {
      // Skip rate limiting for authenticated users
      if (req.user) {
        logInfo('User is authenticated, skipping rate limiting');
        return next();
      }

      // Check if anonymous session exists
      if (!req.anonymousSession) {
        return res.status(400).json({
          error: 'Anonymous session required',
          message: 'Please refresh the page to start a new session'
        });
      }

      const session = req.anonymousSession;
      const sessionId = req.anonymousId;

      // Check each limit
      for (const [type, limit] of Object.entries(limits)) {
        const currentUsage = session.usageCounts[type] || 0;
        
        if (currentUsage >= limit) {
          logWarn(`Rate limit exceeded for ${type}: ${currentUsage}/${limit} (session: ${sessionId})`);
          
          return res.status(429).json({
            error: 'Usage limit reached',
            limitType: type,
            currentUsage,
            limit,
            upgradeRequired: true,
            message: getUpgradeMessage(type, limit),
            remainingUsage: 0
          });
        }
      }

      // Add usage info to response headers
      const usageInfo = {};
      for (const [type, limit] of Object.entries(limits)) {
        const currentUsage = session.usageCounts[type] || 0;
        usageInfo[type] = {
          current: currentUsage,
          limit,
          remaining: Math.max(0, limit - currentUsage)
        };
      }

      res.set('X-Usage-Info', JSON.stringify(usageInfo));

      next();
    } catch (error) {
      logError('Rate limiter error:', error);
      
      // Don't block the request if rate limiting fails
      // Log the error and continue
      next();
    }
  };
};

// Increment usage counter middleware
const incrementUsage = (type) => {
  return async (req, res, next) => {
    try {
      // Skip for authenticated users
      if (req.user) {
        return next();
      }

      // Check if anonymous session exists
      if (!req.anonymousSession) {
        return res.status(400).json({
          error: 'Anonymous session required',
          message: 'Please refresh the page to start a new session'
        });
      }

      const session = req.anonymousSession;
      const limit = FREE_LIMITS[type];

      // Check if limit would be exceeded
      const currentUsage = session.usageCounts[type] || 0;
      if (currentUsage >= limit) {
        return res.status(429).json({
          error: 'Usage limit reached',
          limitType: type,
          currentUsage,
          limit,
          upgradeRequired: true,
          message: getUpgradeMessage(type, limit),
          remainingUsage: 0
        });
      }

      // Increment usage
      await session.incrementUsage(type);
      
      logInfo(`Incremented ${type} usage for session ${req.anonymousId}: ${currentUsage + 1}/${limit}`);

      // Add updated usage info to response
      const updatedUsage = session.usageCounts[type];
      res.set('X-Usage-Updated', JSON.stringify({
        type,
        current: updatedUsage,
        limit,
        remaining: limit - updatedUsage
      }));

      next();
    } catch (error) {
      logError('Increment usage error:', error);
      next();
    }
  };
};

// Get upgrade message based on limit type
function getUpgradeMessage(type, limit) {
  const messages = {
    fitChecks: `You've used your free fit check (${limit} per session). Sign up to get unlimited fit checks and save your results!`,
    profilePicReviews: `You've used your free profile pic review (${limit} per session). Sign up to get unlimited profile pic reviews and dating advice!`,
    chatMessages: `You've used your free chat messages (${limit} per session). Sign up to continue chatting with Jules and get unlimited dating advice!`
  };
  
  return messages[type] || 'You\'ve reached the free usage limit. Sign up to continue!';
}

// Check usage without incrementing
const checkUsage = async (req, res, next) => {
  try {
    // Skip for authenticated users
    if (req.user) {
      return next();
    }

    if (!req.anonymousSession) {
      return res.status(400).json({
        error: 'Anonymous session required',
        message: 'Please refresh the page to start a new session'
      });
    }

    const session = req.anonymousSession;
    const usageInfo = {};

    for (const [type, limit] of Object.entries(FREE_LIMITS)) {
      const currentUsage = session.usageCounts[type] || 0;
      usageInfo[type] = {
        current: currentUsage,
        limit,
        remaining: limit - currentUsage,
        isLimitReached: currentUsage >= limit
      };
    }

    req.usageInfo = usageInfo;
    next();
  } catch (error) {
    logError('Check usage error:', error);
    next();
  }
};

// Get usage info endpoint
const getUsageInfo = async (req, res) => {
  try {
    // For authenticated users, return unlimited
    if (req.user) {
      return res.json({
        authenticated: true,
        usage: {
          fitChecks: { current: 0, limit: -1, remaining: 0, isLimitReached: false },
          chatMessages: { current: 0, limit: -1, remaining: 0, isLimitReached: false }
        }
      });
    }

    // For anonymous users, return current usage
    if (!req.anonymousSession) {
      return res.status(400).json({
        error: 'Anonymous session required',
        message: 'You\'ve used your free fit check! Sign up to get unlimited fit checks and save your results!',
        upgradeRequired: true
      });
    }

    const session = req.anonymousSession;
    const usageInfo = {};

    for (const [type, limit] of Object.entries(FREE_LIMITS)) {
      const currentUsage = session.usageCounts[type] || 0;
      usageInfo[type] = {
        current: currentUsage,
        limit,
        remaining: limit - currentUsage,
        isLimitReached: currentUsage >= limit
      };
    }

    // Set session ID in response header
    res.set('X-Anonymous-Session-ID', req.anonymousId);
    
    res.json({
      authenticated: false,
      sessionId: req.anonymousId,
      usage: usageInfo
    });
  } catch (error) {
    logError('Get usage info error:', error);
    res.status(500).json({
      error: 'Failed to get usage information',
      message: 'Please try again later'
    });
  }
};

// Middleware to require anonymous session
const requireAnonymousSession = (req, res, next) => {
  if (!req.anonymousSessionId) {
    return res.status(400).json({
      error: 'Anonymous session required',
      message: 'Please provide a valid anonymous session'
    });
  }
  next();
};

// Get remaining usage for a specific type
const getRemainingUsage = (type, currentUsage, limit) => {
  return Math.max(0, limit - currentUsage);
};

// Check free limits middleware
const checkFreeLimits = async (req, res, next) => {
  try {
    // Skip for authenticated users
    if (req.user) {
      return next();
    }

    if (!req.anonymousSession) {
      return res.status(400).json({
        error: 'Anonymous session required',
        message: 'Please refresh the page to start a new session'
      });
    }

    const session = req.anonymousSession;
    const limits = {};

    for (const [type, limit] of Object.entries(FREE_LIMITS)) {
      const currentUsage = session.usageCounts[type] || 0;
      limits[type] = {
        current: currentUsage,
        limit,
        remaining: getRemainingUsage(type, currentUsage, limit),
        isLimitReached: currentUsage >= limit
      };
    }

    req.freeLimits = limits;
    next();
  } catch (error) {
    logError('Check free limits error:', error);
    next();
  }
};

module.exports = {
  rateLimiter,
  incrementUsage,
  checkUsage,
  checkFreeLimits,
  getUsageInfo,
  getRemainingUsage,
  FREE_LIMITS
};
