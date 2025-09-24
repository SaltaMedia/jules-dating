const { logInfo, logWarn, logError } = require('../utils/logger');

// Free user limits
const FREE_LIMITS = {
  fitChecks: 1,
  chatMessages: 5
};

// In-memory storage for anonymous session usage (for development)
// In production, this could be Redis or database-backed
const anonymousUsage = new Map();

// Freemium session middleware that works with analytics session system
const freemiumSession = async (req, res, next) => {
  try {
    console.log('DEBUG: Freemium session middleware called');
    console.log('DEBUG: req.user:', req.user);
    console.log('DEBUG: req.sessionId:', req.sessionId);
    console.log('DEBUG: req.userId:', req.userId);
    
    // Skip if user is authenticated
    if (req.user) {
      console.log('DEBUG: User is authenticated, skipping freemium session');
      return next();
    }

    // Use analytics session ID for anonymous users
    const sessionId = req.sessionId;
    const userId = req.userId; // Should be 'anonymous' for unauthenticated users

    if (!sessionId || userId !== 'anonymous') {
      logWarn('No valid anonymous session found');
      return res.status(400).json({
        error: 'Anonymous session required',
        message: 'Please refresh the page to start a new session'
      });
    }

    // Initialize usage tracking for this session if not exists
    if (!anonymousUsage.has(sessionId)) {
      anonymousUsage.set(sessionId, {
        fitChecks: 0,
        chatMessages: 0,
        createdAt: new Date(),
        lastUsed: new Date()
      });
      logInfo(`Created freemium session tracking for: ${sessionId}`);
    }

    // Update last used timestamp
    const usage = anonymousUsage.get(sessionId);
    usage.lastUsed = new Date();

    // Attach usage info to request
    req.freemiumUsage = usage;
    req.freemiumLimits = FREE_LIMITS;

    // Add usage info to response headers
    res.set('X-Usage-Info', JSON.stringify({
      fitChecks: {
        current: usage.fitChecks,
        limit: FREE_LIMITS.fitChecks,
        remaining: FREE_LIMITS.fitChecks - usage.fitChecks
      },
      chatMessages: {
        current: usage.chatMessages,
        limit: FREE_LIMITS.chatMessages,
        remaining: FREE_LIMITS.chatMessages - usage.chatMessages
      }
    }));

    next();
  } catch (error) {
    logError('Freemium session middleware error:', error);
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

      const usage = req.freemiumUsage;
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

// Increment usage for a feature
const incrementUsage = (featureType) => {
  return async (req, res, next) => {
    try {
      // Skip for authenticated users
      if (req.user) {
        return next();
      }

      const usage = req.freemiumUsage;
      if (usage && usage[featureType] !== undefined) {
        usage[featureType]++;
        logInfo(`Incremented ${featureType} usage for session: ${req.sessionId}`);
        
        // Add updated usage to response headers
        res.set('X-Usage-Updated', JSON.stringify({
          type: featureType,
          current: usage[featureType],
          limit: FREE_LIMITS[featureType],
          remaining: FREE_LIMITS[featureType] - usage[featureType]
        }));
      }

      next();
    } catch (error) {
      logError('Increment usage error:', error);
      next(); // Don't block the request
    }
  };
};

// Get remaining usage for a feature
const getRemainingUsage = (sessionId, featureType) => {
  const usage = anonymousUsage.get(sessionId);
  if (!usage) return 0;
  
  const currentUsage = usage[featureType] || 0;
  const limit = FREE_LIMITS[featureType];
  return Math.max(0, limit - currentUsage);
};

// Get usage info for a session
const getUsageInfo = async (req, res) => {
  try {
    const usage = req.freemiumUsage;
    if (!usage) {
      return res.status(400).json({
        error: 'No usage information available',
        message: 'Please refresh the page to start a new session'
      });
    }

    const usageInfo = {};
    for (const [type, limit] of Object.entries(FREE_LIMITS)) {
      const currentUsage = usage[type] || 0;
      usageInfo[type] = {
        current: currentUsage,
        limit,
        remaining: limit - currentUsage,
        isLimitReached: currentUsage >= limit
      };
    }

    res.json({
      sessionId: req.sessionId,
      usage: usageInfo,
      limits: FREE_LIMITS
    });
  } catch (error) {
    logError('Get usage info error:', error);
    res.status(500).json({ error: 'Failed to get usage information' });
  }
};

// Cleanup old sessions (call this periodically)
const cleanupOldSessions = () => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [sessionId, usage] of anonymousUsage.entries()) {
    if (now - usage.lastUsed > maxAge) {
      anonymousUsage.delete(sessionId);
      logInfo(`Cleaned up old freemium session: ${sessionId}`);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

module.exports = {
  freemiumSession,
  rateLimitFeature,
  incrementUsage,
  getRemainingUsage,
  getUsageInfo,
  FREE_LIMITS
};
