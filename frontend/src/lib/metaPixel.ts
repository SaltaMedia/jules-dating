/**
 * Meta Pixel Event Tracking Helper
 * Provides standardized Meta Pixel event tracking for Jules Dating
 */

// Standard Facebook Pixel events
export const META_EVENTS = {
  // Standard events
  PAGE_VIEW: 'PageView',
  LEAD: 'Lead',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  PURCHASE: 'Purchase',
  ADD_TO_CART: 'AddToCart',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  
  // Custom events (will be sent as Lead events with custom parameters)
  FREE_PIC_REVIEW: 'FreePicReview',
  PROFILE_PIC_REVIEW: 'ProfilePicReview', 
  FIT_CHECK: 'FitCheck',
  CHAT_MESSAGE: 'ChatMessage',
  SIGNUP_CLICK: 'SignupClick',
  CONVERSION_PROMPT_SHOWN: 'ConversionPromptShown'
} as const;

interface MetaPixelEvent {
  eventName: string;
  parameters?: Record<string, any>;
  eventId?: string;
}

/**
 * Track Meta Pixel events with proper deduplication
 */
export function trackMetaPixelEvent(event: MetaPixelEvent) {
  if (typeof window === 'undefined' || !window.fbq) {
    console.warn('Meta Pixel (fbq) not available');
    return;
  }

  try {
    // Generate unique event ID for deduplication (when using Conversions API)
    const eventId = event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track the event
    window.fbq('track', event.eventName, {
      ...event.parameters,
      event_id: eventId,
      // Standard parameters
      content_category: 'dating',
      content_name: event.eventName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase(),
    });

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Meta Pixel Event: ${event.eventName}`, event.parameters);
    }
  } catch (error) {
    console.error('Error tracking Meta Pixel event:', error);
  }
}

/**
 * Track user registration completion
 */
export function trackRegistration(userData: {
  email?: string;
  name?: string;
  source?: string;
  landingSource?: string;
}) {
  trackMetaPixelEvent({
    eventName: META_EVENTS.COMPLETE_REGISTRATION,
    parameters: {
      value: 0, // Free registration
      currency: 'USD',
      registration_source: userData.source || 'register_page',
      landing_source: userData.landingSource || 'direct',
      has_name: !!userData.name,
      has_email: !!userData.email,
    }
  });
}

/**
 * Track free profile pic review completion
 */
export function trackFreePicReview(reviewData: {
  sessionId?: string;
  hasSpecificQuestion?: boolean;
  rating?: number;
  source?: string;
}) {
  trackMetaPixelEvent({
    eventName: META_EVENTS.LEAD, // Use Lead event for free reviews
    parameters: {
      content_name: 'free_pic_review',
      content_category: 'profile_review',
      value: 0, // Free service
      currency: 'USD',
      review_type: 'anonymous',
      has_specific_question: reviewData.hasSpecificQuestion || false,
      rating: reviewData.rating || null,
      source: reviewData.source || 'free_experience',
      session_id: reviewData.sessionId,
    }
  });
}

/**
 * Track profile pic review (paid/premium)
 */
export function trackProfilePicReview(reviewData: {
  userId?: string;
  hasSpecificQuestion?: boolean;
  rating?: number;
  isFirstReview?: boolean;
}) {
  trackMetaPixelEvent({
    eventName: META_EVENTS.LEAD,
    parameters: {
      content_name: 'profile_pic_review',
      content_category: 'profile_review',
      value: 0, // Assuming free during beta
      currency: 'USD',
      review_type: 'premium',
      has_specific_question: reviewData.hasSpecificQuestion || false,
      rating: reviewData.rating || null,
      is_first_review: reviewData.isFirstReview || false,
      user_id: reviewData.userId,
    }
  });
}

/**
 * Track signup button clicks
 */
export function trackSignupClick(source: string, context?: Record<string, any>) {
  trackMetaPixelEvent({
    eventName: META_EVENTS.LEAD,
    parameters: {
      content_name: 'signup_click',
      content_category: 'conversion_intent',
      source: source,
      ...context,
    }
  });
}

/**
 * Track conversion prompt shown
 */
export function trackConversionPromptShown(context: {
  feature?: string;
  usageCount?: number;
  sessionId?: string;
}) {
  trackMetaPixelEvent({
    eventName: META_EVENTS.LEAD,
    parameters: {
      content_name: 'conversion_prompt_shown',
      content_category: 'conversion_funnel',
      feature: context.feature || 'unknown',
      usage_count: context.usageCount || 0,
      session_id: context.sessionId,
    }
  });
}

/**
 * Track fit check completion
 */
export function trackFitCheck(fitCheckData: {
  userId?: string;
  hasSpecificQuestion?: boolean;
  isFirstFitCheck?: boolean;
}) {
  trackMetaPixelEvent({
    eventName: META_EVENTS.LEAD,
    parameters: {
      content_name: 'fit_check',
      content_category: 'style_advice',
      value: 0, // Free during beta
      currency: 'USD',
      has_specific_question: fitCheckData.hasSpecificQuestion || false,
      is_first_fit_check: fitCheckData.isFirstFitCheck || false,
      user_id: fitCheckData.userId,
    }
  });
}
