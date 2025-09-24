const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: String, // Can be user ID or 'anonymous' for non-authenticated users
    required: true,
    index: true
  },
  
  // Session tracking
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Event details
  eventType: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'chat_message',
      'feature_usage',
      'onboarding_step',
      'product_interaction',
      'error',
      'conversion',
      'session_start',
      'session_end'
    ],
    index: true
  },
  
  // Event category for better organization
  category: {
    type: String,
    required: true,
    enum: [
      'navigation',
      'chat',
      'onboarding',
      'products',
      'wardrobe',
      'fit_check',
      'wishlist',
      'errors',
      'engagement',
      'performance'
    ],
    index: true
  },
  
  // Specific action within the category
  action: {
    type: String,
    required: true,
    index: true
  },
  
  // Page or feature where event occurred
  page: {
    type: String,
    index: true
  },
  
  // Additional event data
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // User context
  userAgent: String,
  ipAddress: String,
  referrer: String,
  
  // Timing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Performance metrics
  duration: Number, // in milliseconds
  loadTime: Number, // in milliseconds
  
  // Error tracking
  error: {
    message: String,
    stack: String,
    code: String
  }
});

// Indexes for efficient querying
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ category: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema); 