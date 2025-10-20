const universalTracker = require('../utils/universalTracker');

// Middleware to track all API calls
const trackAPICalls = (req, res, next) => {
  const startTime = Date.now();
  const userId = req.user?.id || 'anonymous';
  
  // Track the API call
  universalTracker.trackAPICall(userId, req.path, req.method, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    referrer: req.get('Referer'),
    query: req.query,
    bodySize: JSON.stringify(req.body).length
  });

  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    universalTracker.trackPerformance(userId, 'api_response_time', responseTime, {
      endpoint: req.path,
      method: req.method,
      statusCode,
      success: statusCode < 400
    });

    // Track errors
    if (statusCode >= 400) {
      universalTracker.trackError(userId, new Error(`HTTP ${statusCode}`), {
        endpoint: req.path,
        method: req.method,
        statusCode,
        userAgent: req.get('User-Agent')
      });
    }
  });

  next();
};

// Middleware to track page views (for frontend tracking)
const trackPageViews = (req, res, next) => {
  // This will be called by frontend, but we can also track server-side page requests
  if (req.path.startsWith('/api/')) {
    return next(); // Skip API calls
  }

  const userId = req.user?.id || 'anonymous';
  
  universalTracker.trackPageView(userId, req.path, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    referrer: req.get('Referer'),
    method: req.method
  });

  next();
};

// Middleware to track user sessions
const trackUserSessions = (req, res, next) => {
  const userId = req.user?.id || 'anonymous';
  const sessionId = req.sessionID || req.headers['x-session-id'];
  
  // Track session start for new sessions
  if (!req.session.tracked) {
    universalTracker.trackSessionEvent(userId, 'session_start', {
      sessionId,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      referrer: req.get('Referer')
    });
    req.session.tracked = true;
  }

  // Track session activity
  universalTracker.trackSessionEvent(userId, 'session_activity', {
    sessionId,
    endpoint: req.path,
    method: req.method
  });

  next();
};

// Middleware to track feature usage
const trackFeatureUsage = (feature, action) => {
  return (req, res, next) => {
    const userId = req.user?.id || 'anonymous';
    
    universalTracker.trackFeatureUsage(userId, feature, action, {
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    next();
  };
};

// Middleware to track conversions
const trackConversion = (conversionType) => {
  return (req, res, next) => {
    const userId = req.user?.id || 'anonymous';
    
    universalTracker.trackConversion(userId, conversionType, {
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    next();
  };
};

module.exports = {
  trackAPICalls,
  trackPageViews,
  trackUserSessions,
  trackFeatureUsage,
  trackConversion
};
