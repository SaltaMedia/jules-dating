const mongoose = require('mongoose');

const chatAnalyticsSchema = new mongoose.Schema({
  // Conversation identification
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Conversation metrics
  messageCount: {
    user: { type: Number, default: 0 },
    assistant: { type: Number, default: 0 }
  },
  
  totalTokens: {
    user: { type: Number, default: 0 },
    assistant: { type: Number, default: 0 }
  },
  
  // Timing metrics
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  endTime: {
    type: Date,
    index: true
  },
  
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // Response time metrics
  averageResponseTime: Number, // in milliseconds
  responseTimes: [Number], // array of response times
  
  // Content analysis
  topics: [{
    topic: String,
    frequency: Number,
    firstMentioned: Date,
    lastMentioned: Date
  }],
  
  // Intent classification
  primaryIntent: {
    type: String,
    enum: [
      'style_advice',
      'outfit_help',
      'product_recommendation',
      'dating_advice',
      'confidence_help',
      'general_chat',
      'complaint',
      'question',
      'other'
    ],
    index: true
  },
  
  intents: [{
    intent: String,
    confidence: Number,
    timestamp: Date
  }],
  
  // Sentiment analysis
  sentiment: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    scores: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 }
    },
    changes: [{
      sentiment: String,
      timestamp: Date,
      trigger: String
    }]
  },
  
  // User engagement
  engagement: {
    messageLength: {
      average: Number,
      total: Number
    },
    responseRate: Number, // percentage of messages user responds to
    timeBetweenMessages: {
      average: Number,
      min: Number,
      max: Number
    }
  },
  
  // Feature usage within chat
  featuresUsed: [{
    feature: String,
    timestamp: Date,
    success: Boolean
  }],
  
  // Product interactions
  productsMentioned: [{
    productId: String,
    productName: String,
    action: String, // 'viewed', 'liked', 'disliked', 'purchased'
    timestamp: Date
  }],
  
  // Error tracking
  errors: [{
    type: String,
    message: String,
    timestamp: Date,
    resolved: Boolean
  }],
  
  // User satisfaction
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    timestamp: Date
  },
  
  // Conversation outcome
  outcome: {
    type: String,
    enum: [
      'completed_successfully',
      'user_abandoned',
      'error_occurred',
      'timeout',
      'redirected'
    ],
    default: 'completed_successfully'
  },
  
  // Metadata
  userAgent: String,
  ipAddress: String,
  
  // Performance metrics
  apiCalls: [{
    endpoint: String,
    duration: Number,
    success: Boolean,
    timestamp: Date
  }]
});

// Indexes for efficient querying
chatAnalyticsSchema.index({ userId: 1, startTime: -1 });
chatAnalyticsSchema.index({ primaryIntent: 1, startTime: -1 });
chatAnalyticsSchema.index({ 'sentiment.overall': 1, startTime: -1 });
chatAnalyticsSchema.index({ outcome: 1, startTime: -1 });

// Calculate conversation duration
chatAnalyticsSchema.methods.endConversation = function() {
  this.endTime = new Date();
  this.duration = this.endTime.getTime() - this.startTime.getTime();
  return this.save();
};

// Add response time
chatAnalyticsSchema.methods.addResponseTime = function(responseTime) {
  this.responseTimes.push(responseTime);
  this.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  return this.save();
};

// Update sentiment
chatAnalyticsSchema.methods.updateSentiment = function(sentiment, trigger = null) {
  this.sentiment.overall = sentiment;
  this.sentiment.changes.push({
    sentiment,
    timestamp: new Date(),
    trigger
  });
  return this.save();
};

module.exports = mongoose.model('ChatAnalytics', chatAnalyticsSchema); 