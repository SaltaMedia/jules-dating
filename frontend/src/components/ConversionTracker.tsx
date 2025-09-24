'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/lib/analytics';

interface ConversionTrackerProps {
  conversionType: 'landing_page' | 'signup' | 'onboarding_complete' | 'first_chat' | 'feature_usage';
  userId?: string;
  properties?: Record<string, any>;
}

export const ConversionTracker: React.FC<ConversionTrackerProps> = ({
  conversionType,
  userId,
  properties = {}
}) => {
  const { trackConversion, trackFeatureUsage } = useAnalytics();
  const hasTracked = useRef<boolean>(false);

  useEffect(() => {
    if (!hasTracked.current) {
      trackConversion(conversionType, {
        userId,
        timestamp: new Date().toISOString(),
        ...properties
      });
      hasTracked.current = true;
    }
  }, [conversionType, userId, properties, trackConversion]);

  return null;
};

// Hook for tracking conversions
export const useConversionTracker = () => {
  const { trackConversion, trackFeatureUsage } = useAnalytics();

  const trackLandingPageConversion = (source?: string, properties?: Record<string, any>) => {
    trackConversion('landing_page_visit', {
      source,
      referrer: document.referrer,
      utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      ...properties
    });
  };

  const trackSignupConversion = (method: 'email' | 'google' | 'facebook', properties?: Record<string, any>) => {
    trackConversion('signup', {
      method,
      ...properties
    });
  };

  const trackOnboardingConversion = (completedSteps: number, totalSteps: number, properties?: Record<string, any>) => {
    trackConversion('onboarding_complete', {
      completedSteps,
      totalSteps,
      completionRate: (completedSteps / totalSteps) * 100,
      ...properties
    });
  };

  const trackFirstChatConversion = (chatType: string, properties?: Record<string, any>) => {
    trackConversion('first_chat', {
      chatType,
      ...properties
    });
  };

  const trackFeatureAdoption = (feature: string, properties?: Record<string, any>) => {
    trackConversion('feature_adoption', {
      feature,
      ...properties
    });
  };

  const trackRetentionEvent = (daysSinceSignup: number, properties?: Record<string, any>) => {
    trackConversion('retention', {
      daysSinceSignup,
      ...properties
    });
  };

  return {
    trackLandingPageConversion,
    trackSignupConversion,
    trackOnboardingConversion,
    trackFirstChatConversion,
    trackFeatureAdoption,
    trackRetentionEvent
  };
};

// Landing page specific tracking
export const LandingPageTracker: React.FC<{ userId?: string }> = ({ userId }) => {
  const { trackLandingPageConversion } = useConversionTracker();
  const hasTracked = useRef<boolean>(false);

  useEffect(() => {
    if (!hasTracked.current) {
      // Track landing page visit
      trackLandingPageConversion();
      hasTracked.current = true;
    }
  }, [trackLandingPageConversion]);

  return null;
};

// Signup flow tracker
export const SignupTracker: React.FC<{ 
  method: 'email' | 'google' | 'facebook';
  userId?: string;
  properties?: Record<string, any>;
}> = ({ method, userId, properties }) => {
  const { trackSignupConversion } = useConversionTracker();
  const hasTracked = useRef<boolean>(false);

  useEffect(() => {
    if (!hasTracked.current && userId) {
      trackSignupConversion(method, {
        userId,
        ...properties
      });
      hasTracked.current = true;
    }
  }, [method, userId, properties, trackSignupConversion]);

  return null;
};

