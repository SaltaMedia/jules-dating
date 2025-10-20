const { Analytics } = require('@segment/analytics-node');

class SegmentService {
  constructor() {
    // Check if analytics is enabled via environment variable
    this.isEnabled = process.env.FEATURE_ANALYTICS === 'true' && process.env.SEGMENT_WRITE_KEY;
    
    if (this.isEnabled) {
      this.analytics = new Analytics({
        writeKey: process.env.SEGMENT_WRITE_KEY,
        flushAt: 20, // Flush after 20 events
        flushInterval: 10000 // Flush every 10 seconds
      });
      console.log('📊 Segment analytics enabled');
    } else {
      console.log('📊 Segment analytics disabled');
    }
  }

  // Track any event
  track(userId, event, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[SEGMENT] Would track: ${event} for user ${userId}`, properties);
      return Promise.resolve();
    }

    try {
      this.analytics.track({
        userId: userId || 'anonymous',
        event: event,
        properties: {
          ...properties,
          app_name: 'jules-dating',
          app_environment: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
          timestamp: new Date().toISOString(),
          app: 'jules-dating'
        }
      });
      return Promise.resolve();
    } catch (error) {
      console.error('Segment track error:', error);
      return Promise.resolve(); // Don't fail the app
    }
  }

  // Identify users
  identify(userId, traits = {}) {
    if (!this.isEnabled) {
      console.log(`[SEGMENT] Would identify: ${userId}`, traits);
      return Promise.resolve();
    }

    try {
      this.analytics.identify({
        userId: userId,
        traits: {
          ...traits,
          app: 'jules-dating'
        }
      });
      return Promise.resolve();
    } catch (error) {
      console.error('Segment identify error:', error);
      return Promise.resolve(); // Don't fail the app
    }
  }

  // Track page views
  page(userId, page, properties = {}) {
    if (!this.isEnabled) {
      console.log(`[SEGMENT] Would track page: ${page} for user ${userId}`, properties);
      return Promise.resolve();
    }

    return this.analytics.page({
      userId: userId || 'anonymous',
      name: page,
      properties: {
        ...properties,
        app: 'jules-dating'
      }
    });
  }

  // Jules-specific tracking methods
  trackLandingPageVisit(userId, source = 'direct', properties = {}) {
    return this.track(userId, 'Landing Page Visited', {
      source,
      referrer: properties.referrer,
      utm_source: properties.utm_source,
      utm_medium: properties.utm_medium,
      utm_campaign: properties.utm_campaign,
      ...properties
    });
  }

  trackSignup(userId, method = 'email', properties = {}) {
    return Promise.all([
      this.identify(userId, {
        email: properties.email,
        name: properties.name,
        signupMethod: method,
        signupDate: new Date(),
        ...properties.traits
      }),
      this.track(userId, 'User Signed Up', {
        method,
        source: properties.source,
        ...properties
      })
    ]);
  }

  trackOnboardingStep(userId, step, stepNumber, totalSteps, properties = {}) {
    return this.track(userId, 'Onboarding Step Completed', {
      step,
      stepNumber,
      totalSteps,
      completionRate: (stepNumber / totalSteps) * 100,
      ...properties
    });
  }

  trackOnboardingComplete(userId, properties = {}) {
    return this.track(userId, 'Onboarding Completed', {
      ...properties
    });
  }

  trackChatMessage(userId, messageType = 'user', properties = {}) {
    return this.track(userId, 'Chat Message Sent', {
      messageType, // 'user' or 'assistant'
      intent: properties.intent,
      messageLength: properties.messageLength,
      conversationId: properties.conversationId,
      hasImage: properties.hasImage,
      responseTime: properties.responseTime,
      ...properties
    });
  }

  trackFitCheckSubmitted(userId, properties = {}) {
    return this.track(userId, 'Fit Check Submitted', {
      eventContext: properties.eventContext,
      rating: properties.rating,
      hasSpecificQuestion: properties.hasSpecificQuestion,
      anonymous: !userId || userId === 'anonymous',
      ...properties
    });
  }

  trackWardrobeItemAdded(userId, properties = {}) {
    return this.track(userId, 'Fit Check Item Added', {
      itemType: properties.itemType,
      category: properties.category,
      brand: properties.brand,
      source: properties.source, // 'manual', 'fit_check', 'ai_analysis'
      ...properties
    });
  }

  trackProfilePicReview(userId, properties = {}) {
    return this.track(userId, 'Profile Pic Review Submitted', {
      rating: properties.rating,
      hasSpecificQuestion: properties.hasSpecificQuestion,
      anonymous: !userId || userId === 'anonymous',
      ...properties
    });
  }

  trackFeatureUsage(userId, feature, action, properties = {}) {
    return this.track(userId, `${feature} ${action}`, {
      feature,
      action,
      ...properties
    });
  }

  trackConversion(userId, conversionType, properties = {}) {
    return this.track(userId, 'Conversion', {
      conversionType,
      ...properties
    });
  }

  // Link anonymous user to identified user
  alias(anonymousId, userId) {
    if (!this.isEnabled) {
      console.log(`[SEGMENT] Would alias ${anonymousId} to ${userId}`);
      return Promise.resolve();
    }

    return this.analytics.alias({
      previousId: anonymousId,
      userId: userId
    });
  }

  // Track errors
  trackError(userId, error, properties = {}) {
    return this.track(userId, 'Error Occurred', {
      errorType: error.name || 'Unknown',
      errorMessage: error.message,
      stack: error.stack,
      ...properties
    });
  }

  // Flush events (call before app shutdown)
  flush() {
    if (this.isEnabled) {
      return this.analytics.flush();
    }
    return Promise.resolve();
  }
}

module.exports = new SegmentService();
