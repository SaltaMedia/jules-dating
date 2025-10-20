// Frontend Segment analytics client using snippet method
declare global {
  interface Window {
    analytics: any;
  }
}

class SegmentClient {
  private isEnabled = false;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Check if analytics is enabled via environment variable
    this.isEnabled = !!(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY && 
                       (process.env.NODE_ENV === 'production' || 
                       process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'));
    
    // Initialize analytics only on client side
    if (typeof window !== 'undefined') {
      this.initPromise = this.initializeClient();
    }
  }

  private async initializeClient(): Promise<void> {
    if (this.initialized) return;
    
    if (this.isEnabled) {
      console.log('🔧 Initializing Segment client with write key:', process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY);
      
      try {
        const writeKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY!;
        
        // Load Segment snippet
        await this.loadSegmentSnippet(writeKey);
        
        console.log('📊 Segment analytics enabled, client:', !!window.analytics);
        this.initialized = true;
        
        console.log('✅ Segment client initialization completed');
      } catch (error) {
        console.error('❌ Segment client initialization failed:', error);
        this.initialized = false;
      }
    } else {
      console.log('📊 Segment analytics disabled');
      this.initialized = true;
    }
  }

  private loadSegmentSnippet(writeKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Segment is already loaded
      if (window.analytics) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://cdn.segment.com/analytics.js/v1/' + writeKey + '/analytics.min.js';
      
      script.onload = () => {
        // Initialize analytics
        window.analytics = window.analytics || [];
        
        // Define the analytics object
        const analytics = window.analytics;
        analytics.invoked = true;
        analytics.methods = [
          'trackSubmit',
          'trackClick',
          'trackLink',
          'trackForm',
          'pageview',
          'identify',
          'reset',
          'group',
          'track',
          'ready',
          'alias',
          'debug',
          'page',
          'once',
          'off',
          'on'
        ];
        
        analytics.factory = function(t: any) {
          return function() {
            const a = Array.prototype.slice.call(arguments);
            a.unshift(t);
            analytics.push(a);
            return analytics;
          };
        };
        
        for (let i = 0; i < analytics.methods.length; i++) {
          const key = analytics.methods[i];
          analytics[key] = analytics.factory(key);
        }
        
        analytics.load = function(key: string, options: any) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = 'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';
          const first = document.getElementsByTagName('script')[0];
          first.parentNode?.insertBefore(script, first);
          analytics._loadOptions = options;
        };
        
        analytics.SNIPPET_VERSION = '4.1.0';
        analytics.load(writeKey);
        
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Segment script'));
      };
      
      // Add script to document
      const first = document.getElementsByTagName('script')[0];
      first.parentNode?.insertBefore(script, first);
    });
  }

  // Get or create anonymous ID
  private getAnonymousId(): string {
    if (typeof window === 'undefined') return 'server-side';
    
    let anonymousId = localStorage.getItem('segment_anonymous_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('segment_anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  // Get user ID (from auth context or JWT)
  private getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get from localStorage (set by auth)
    const userId = localStorage.getItem('userId');
    return userId || null;
  }

  // Track events
  async track(event: string, properties: Record<string, any> = {}) {
    console.log(`🔍 Segment.track called: ${event}`, {
      isEnabled: this.isEnabled,
      initialized: this.initialized,
      hasAnalytics: !!window.analytics,
      windowExists: typeof window !== 'undefined'
    });
    
    // Wait for initialization to complete if it's still in progress
    if (this.initPromise && !this.initialized) {
      console.log('⏳ Waiting for Segment client initialization...');
      await this.initPromise;
    }
    
    return this.sendTrackEvent(event, properties);
  }

  // Separate method for actually sending the track event
  private async sendTrackEvent(event: string, properties: Record<string, any> = {}) {
    const userId = this.getUserId();
    const anonymousId = this.getAnonymousId();
    
    if (!this.isEnabled || !window.analytics) {
      console.log(`[SEGMENT] Would track: ${event}`, properties);
      return Promise.resolve();
    }

    console.log(`📤 Sending Segment event: ${event}`, {
      ...properties,
      app_name: 'jules-dating',
      app_environment: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      timestamp: new Date().toISOString(),
      app: 'jules-dating',
      platform: 'web',
      userId: userId || 'anonymous',
      anonymousId: anonymousId
    });

    try {
      // Use the snippet-based analytics object
      window.analytics.track(event, {
        ...properties,
        app_name: 'jules-dating',
        app_environment: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
        timestamp: new Date().toISOString(),
        app: 'jules-dating',
        platform: 'web'
      }, {
        userId: userId || undefined,
        anonymousId: userId ? undefined : anonymousId
      });

      console.log(`✅ Segment event sent successfully: ${event}`);
      return Promise.resolve();
    } catch (error) {
      console.error(`❌ Segment event failed: ${event}`, error);
      throw error;
    }
  }

  // Track page views
  page(pageName: string, properties: Record<string, any> = {}) {
    const userId = this.getUserId();
    const anonymousId = this.getAnonymousId();
    
    if (!this.isEnabled || !window.analytics) {
      console.log(`[SEGMENT] Would track page: ${pageName}`, properties);
      return Promise.resolve();
    }

    window.analytics.page(pageName, {
      ...properties,
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      app_name: 'jules-dating',
      app_environment: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      app: 'jules-dating',
      platform: 'web'
    }, {
      userId: userId || undefined,
      anonymousId: userId ? undefined : anonymousId
    });
    
    return Promise.resolve();
  }

  // Identify users
  identify(traits: Record<string, any> = {}) {
    const userId = this.getUserId();
    
    if (!userId) {
      console.warn('Cannot identify user without userId');
      return Promise.resolve();
    }

    if (!this.isEnabled || !window.analytics) {
      console.log(`[SEGMENT] Would identify user:`, traits);
      return Promise.resolve();
    }

    window.analytics.identify(userId, {
      ...traits,
      app_name: 'jules-dating',
      app_environment: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      app: 'jules-dating',
      platform: 'web'
    });
    
    return Promise.resolve();
  }

  // Jules-specific tracking methods
  trackLandingPageVisit(source?: string, properties: Record<string, any> = {}) {
    const urlParams = new URLSearchParams(window.location.search);
    
    return this.track('Landing Page Visited', {
      source: source || 'direct',
      referrer: document.referrer,
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      page: '/',
      category: 'landing',
      ...properties
    });
  }

  trackSignup(method: 'email' | 'google', properties: Record<string, any> = {}) {
    return this.track('User Signed Up', {
      method,
      ...properties
    });
  }

  trackOnboardingStep(step: string, stepNumber: number, totalSteps: number, properties: Record<string, any> = {}) {
    return this.track('Onboarding Step Completed', {
      step,
      stepNumber,
      totalSteps,
      completionRate: (stepNumber / totalSteps) * 100,
      ...properties
    });
  }

  trackOnboardingComplete(properties: Record<string, any> = {}) {
    return this.track('Onboarding Completed', properties);
  }

  trackFeatureUsage(feature: string, action: string, properties: Record<string, any> = {}) {
    return this.track(`${feature} ${action}`, {
      feature,
      action,
      ...properties
    });
  }

  trackCTAClick(buttonText: string, location: string, properties: Record<string, any> = {}) {
    return this.track('CTA Clicked', {
      buttonText,
      location,
      ...properties
    });
  }

  // Link anonymous user to identified user
  alias(userId: string) {
    const anonymousId = this.getAnonymousId();
    
    if (!this.isEnabled || !window.analytics) {
      console.log(`[SEGMENT] Would alias ${anonymousId} to ${userId}`);
      return Promise.resolve();
    }

    window.analytics.alias(userId, anonymousId);
    return Promise.resolve();
  }

  // Flush events
  flush() {
    if (this.isEnabled && window.analytics) {
      window.analytics.flush();
    }
    return Promise.resolve();
  }
}

// Export singleton instance
export const segment = new SegmentClient();

// React hook for easy usage
export const useSegment = () => {
  return segment;
};

export default segment;
