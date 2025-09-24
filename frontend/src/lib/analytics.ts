// Analytics tracking utility for Jules Style app
interface AnalyticsEvent {
  eventType: string;
  category: string;
  action: string;
  page?: string;
  properties?: Record<string, any>;
}

class AnalyticsTracker {
  private sessionId: string | null = null;
  private userId: string | null = null;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeSession();
    }
  }

  private initializeSession() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Get or create session ID
    this.sessionId = localStorage.getItem('jules_session_id') || this.generateSessionId();
    localStorage.setItem('jules_session_id', this.sessionId);
    
    // Get user ID if available
    this.userId = localStorage.getItem('jules_user_id') || 'anonymous';
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async trackEvent(event: AnalyticsEvent) {
    // Only track on client side
    if (typeof window === 'undefined') return;
    
    try {
      const payload = {
        ...event,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        page: event.page || window.location.pathname,
        referrer: document.referrer
      };

      // Send to backend analytics endpoint
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Page view tracking
  trackPageView(page?: string, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'page_view',
      category: 'navigation',
      action: 'page_visited',
      page,
      properties: {
        ...properties,
        url: window.location.href,
        title: document.title
      }
    });
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'feature_usage',
      category: 'engagement',
      action,
      properties: {
        feature,
        ...properties
      }
    });
  }

  // Onboarding step tracking
  trackOnboardingStep(step: string, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'onboarding_step',
      category: 'onboarding',
      action: step,
      properties
    });
  }

  // Chat interaction tracking
  trackChatInteraction(action: string, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'chat_message',
      category: 'chat',
      action,
      properties
    });
  }

  // Conversion tracking
  trackConversion(type: string, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'conversion',
      category: 'engagement',
      action: type,
      properties
    });
  }

  // Error tracking
  trackError(error: Error, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'error',
      category: 'errors',
      action: 'error_occurred',
      properties: {
        message: error.message,
        stack: error.stack,
        ...properties
      }
    });
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, properties?: Record<string, any>) {
    this.trackEvent({
      eventType: 'feature_usage',
      category: 'performance',
      action: metric,
      properties: {
        value,
        ...properties
      }
    });
  }

  // Set user ID when user logs in
  setUserId(userId: string) {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jules_user_id', userId);
    }
  }

  // Clear user ID when user logs out
  clearUserId() {
    this.userId = 'anonymous';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jules_user_id');
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsTracker();

// React hook for easy usage in components
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackOnboardingStep: analytics.trackOnboardingStep.bind(analytics),
    trackChatInteraction: analytics.trackChatInteraction.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    clearUserId: analytics.clearUserId.bind(analytics)
  };
};

// Auto-track page views
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.trackPageView();
  
  // Track navigation changes
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      analytics.trackPageView();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

