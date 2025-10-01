const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User identification
  userId: {
    type: String, // Can be user ID or 'anonymous' for non-authenticated users
    required: true,
    index: true
  },
  
  // Session details
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
  
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // User context
  userAgent: String,
  ipAddress: String,
  referrer: String,
  
  // Device and browser info
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  
  browser: String,
  os: String,
  
  // Session metrics
  pageViews: {
    type: Number,
    default: 0
  },
  
  chatMessages: {
    type: Number,
    default: 0
  },
  
  featuresUsed: [{
    feature: String,
    count: Number,
    firstUsed: Date,
    lastUsed: Date
  }],
  
  // Bounce rate calculation
  isBounce: {
    type: Boolean,
    default: true
  },
  
  // Conversion tracking
  conversions: [{
    type: String,
    timestamp: Date,
    value: Number
  }],
  
  // Error tracking
  errorEvents: [{
    message: String,
    timestamp: Date,
    page: String
  }],
  
  // Performance metrics
  averageLoadTime: Number,
  totalLoadTime: Number,
  
  // Session status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

// Indexes for efficient querying
userSessionSchema.index({ userId: 1, startTime: -1 });
userSessionSchema.index({ startTime: 1, endTime: 1 });
userSessionSchema.index({ isActive: 1, startTime: -1 });

// Calculate duration when session ends
userSessionSchema.methods.endSession = function() {
  this.endTime = new Date();
  this.duration = this.endTime.getTime() - this.startTime.getTime();
  this.isActive = false;
  return this.save();
};

// Update bounce status
userSessionSchema.methods.updateBounceStatus = function() {
  if (this.pageViews > 1) {
    this.isBounce = false;
  }
  return this.save();
};

module.exports = mongoose.model('UserSession', userSessionSchema); 