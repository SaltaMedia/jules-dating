const analyticsService = require('../utils/analyticsService');

// Session management middleware
const sessionMiddleware = async (req, res, next) => {
  try {
    // Get or create session ID
    let sessionId = req.cookies?.jules_session_id;
    
    if (!sessionId) {
      sessionId = await analyticsService.startSession(req.user?.id, req);
      res.cookie('jules_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
    
    req.sessionId = sessionId;
    req.userId = req.user?.id || 'anonymous';
    
    next();
  } catch (error) {
    console.error('Analytics session middleware error:', error);
    next();
  }
};

// Page view tracking middleware
const pageViewMiddleware = async (req, res, next) => {
  try {
    // Skip tracking for static assets and API calls
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/_next/') || 
        req.path.startsWith('/static/') ||
        req.method !== 'GET') {
      return next();
    }
    
    // Track page view
    if (req.sessionId) {
      await analyticsService.trackPageView(req.userId, req.sessionId, req);
    }
    
    next();
  } catch (error) {
    console.error('Analytics page view middleware error:', error);
    next();
  }
};

// Error tracking middleware
const errorTrackingMiddleware = (error, req, res, next) => {
  try {
    if (req.sessionId) {
      analyticsService.trackError(req.userId, req.sessionId, error, req);
    }
  } catch (analyticsError) {
    console.error('Error tracking middleware error:', analyticsError);
  }
  
  next(error);
};

// Feature usage tracking helper
const trackFeatureUsage = (feature, action, properties = {}) => {
  return async (req, res, next) => {
    try {
      if (req.sessionId) {
        await analyticsService.trackFeatureUsage(
          req.userId, 
          req.sessionId, 
          feature, 
          action, 
          req, 
          properties
        );
      }
    } catch (error) {
      console.error('Feature usage tracking error:', error);
    }
    
    next();
  };
};

// Onboarding step tracking helper
const trackOnboardingStep = (step, properties = {}) => {
  return async (req, res, next) => {
    try {
      if (req.sessionId) {
        await analyticsService.trackOnboardingStep(
          req.userId, 
          req.sessionId, 
          step, 
          req, 
          properties
        );
      }
    } catch (error) {
      console.error('Onboarding step tracking error:', error);
    }
    
    next();
  };
};

// Chat message tracking helper
const trackChatMessage = (messageData) => {
  return async (req, res, next) => {
    try {
      if (req.sessionId) {
        await analyticsService.trackChatMessage(
          req.userId, 
          req.sessionId, 
          messageData, 
          req
        );
      }
    } catch (error) {
      console.error('Chat message tracking error:', error);
    }
    
    next();
  };
};

// Session cleanup on response end
const sessionCleanupMiddleware = (req, res, next) => {
  res.on('finish', async () => {
    try {
      // End session if user is leaving (status code indicates completion)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Don't end session immediately, just mark for potential cleanup
        // Sessions will be cleaned up by a background job
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  });
  
  next();
};

// Performance tracking middleware
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Track performance metrics
    if (req.sessionId) {
      analyticsService.trackEvent({
        userId: req.userId,
        sessionId: req.sessionId,
        eventType: 'feature_usage',
        category: 'performance',
        action: 'api_response_time',
        page: req.path,
        properties: {
          method: req.method,
          statusCode: res.statusCode,
          duration
        },
        duration,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      });
    }
  });
  
  next();
};

// User identification middleware
const userIdentificationMiddleware = (req, res, next) => {
  try {
    // Set user ID from authentication
    if (req.user) {
      req.userId = req.user.id;
    } else {
      req.userId = 'anonymous';
    }
    
    next();
  } catch (error) {
    console.error('User identification middleware error:', error);
    req.userId = 'anonymous';
    next();
  }
};

module.exports = {
  sessionMiddleware,
  pageViewMiddleware,
  errorTrackingMiddleware,
  trackFeatureUsage,
  trackOnboardingStep,
  trackChatMessage,
  sessionCleanupMiddleware,
  performanceMiddleware,
  userIdentificationMiddleware
}; 