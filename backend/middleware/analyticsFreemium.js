const { logInfo, logWarn, logError } = require('../utils/logger');

// Free user limits
const FREE_LIMITS = {
  fitChecks: 1,
  chatMessages: 5
};

// Simple freemium middleware that works with analytics session system
const analyticsFreemium = async (req, res, next) => {
  try {
    // Skip for authenticated users
    if (req.user) {
      return next();
    }

    // Use analytics session system (already sets req.sessionId and req.userId = 'anonymous')
    const sessionId = req.sessionId;
    const userId = req.userId;

    if (!sessionId || userId !== 'anonymous') {
      logWarn('No valid anonymous session found');
      return res.status(400).json({
        error: 'Anonymous session required',
        message: 'Please refresh the page to start a new session'
      });
    }

    // Get usage data from request body
    const usageData = req.body?.usage || { fitChecks: 0, chatMessages: 0 };
    
    // Validate usage data
    const fitChecks = parseInt(usageData.fitChecks) || 0;
    const chatMessages = parseInt(usageData.chatMessages) || 0;

    // Attach usage info to request
    req.anonymousUsage = {
      fitChecks,
      chatMessages
    };
    req.freemiumLimits = FREE_LIMITS;

    // Add usage info to response headers
    res.set('X-Usage-Info', JSON.stringify({
      fitChecks: {
        current: fitChecks,
        limit: FREE_LIMITS.fitChecks,
        remaining: Math.max(0, FREE_LIMITS.fitChecks - fitChecks)
      },
      chatMessages: {
        current: chatMessages,
        limit: FREE_LIMITS.chatMessages,
        remaining: Math.max(0, FREE_LIMITS.chatMessages - chatMessages)
      }
    }));

    next();
  } catch (error) {
    logError('Analytics freemium middleware error:', error);
    res.status(500).json({ error: 'Session error' });
  }
};

// Rate limiter for specific feature
const rateLimitFeature = (featureType) => {
  return async (req, res, next) => {
    try {
      // Skip for authenticated users
      if (req.user) {
        return next();
      }

      const usage = req.anonymousUsage;
      const limit = FREE_LIMITS[featureType];

      if (!usage || !limit) {
        return res.status(400).json({
          error: 'Invalid feature type or session'
        });
      }

      // Check if limit would be exceeded
      const currentUsage = usage[featureType] || 0;
      if (currentUsage >= limit) {
        return res.status(429).json({
          error: 'Usage limit reached',
          featureType,
          currentUsage,
          limit,
          upgradeRequired: true,
          message: `You've reached your free limit of ${limit} ${featureType}. Please sign up to continue.`
        });
      }

      next();
    } catch (error) {
      logError('Rate limit feature error:', error);
      res.status(500).json({ error: 'Rate limiting error' });
    }
  };
};

// Increment usage for a feature (for response headers)
const incrementUsage = (featureType) => {
  return async (req, res, next) => {
    try {
      // Skip for authenticated users
      if (req.user) {
        return next();
      }

      const usage = req.anonymousUsage;
      if (usage && usage[featureType] !== undefined) {
        const newUsage = usage[featureType] + 1;
        
        // Add updated usage to response headers
        res.set('X-Usage-Updated', JSON.stringify({
          type: featureType,
          current: newUsage,
          limit: FREE_LIMITS[featureType],
          remaining: Math.max(0, FREE_LIMITS[featureType] - newUsage)
        }));
      }

      next();
    } catch (error) {
      logError('Increment usage error:', error);
      next(); // Don't block the request
    }
  };
};

module.exports = {
  analyticsFreemium,
  rateLimitFeature,
  incrementUsage,
  FREE_LIMITS
};


