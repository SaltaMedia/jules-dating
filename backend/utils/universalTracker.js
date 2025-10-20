const segment = require('./segment');

class UniversalTracker {
  constructor() {
    this.isEnabled = process.env.FEATURE_ANALYTICS === 'true';
  }

  // Track page views
  async trackPageView(userId, page, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track page view: ${page}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'Page View', {
        page,
        url: properties.url || page,
        referrer: properties.referrer,
        userAgent: properties.userAgent,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Page view tracked: ${page} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Page view tracking error:', error);
    }
  }

  // Track feature usage
  async trackFeatureUsage(userId, feature, action, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track feature: ${feature}.${action}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', `${feature} ${action}`, {
        feature,
        action,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Feature tracked: ${feature}.${action} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Feature tracking error:', error);
    }
  }

  // Track API calls
  async trackAPICall(userId, endpoint, method, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track API: ${method} ${endpoint}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'API Call', {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 API tracked: ${method} ${endpoint} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('API tracking error:', error);
    }
  }

  // Track user actions
  async trackUserAction(userId, action, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track action: ${action}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'User Action', {
        action,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Action tracked: ${action} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Action tracking error:', error);
    }
  }

  // Track errors
  async trackError(userId, error, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track error: ${error.message}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'Error Occurred', {
        errorType: error.name || 'Unknown',
        errorMessage: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Error tracked: ${error.message} for user ${userId || 'anonymous'}`);
    } catch (trackingError) {
      console.error('Error tracking error:', trackingError);
    }
  }

  // Track conversions
  async trackConversion(userId, conversionType, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track conversion: ${conversionType}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'Conversion', {
        conversionType,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Conversion tracked: ${conversionType} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Conversion tracking error:', error);
    }
  }

  // Track session events
  async trackSessionEvent(userId, eventType, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track session: ${eventType}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'Session Event', {
        eventType,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Session tracked: ${eventType} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }

  // Track performance metrics
  async trackPerformance(userId, metric, value, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[TRACKER] Would track performance: ${metric} = ${value}`, properties);
      return;
    }

    try {
      await segment.track(userId || 'anonymous', 'Performance Metric', {
        metric,
        value,
        timestamp: new Date().toISOString(),
        ...properties
      });
      console.log(`📊 Performance tracked: ${metric} = ${value} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Performance tracking error:', error);
    }
  }
}

module.exports = new UniversalTracker();
