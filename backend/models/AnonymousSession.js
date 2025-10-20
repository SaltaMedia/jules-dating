const mongoose = require('mongoose');

const anonymousSessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  
  // Track fit checks for this session
  fitChecks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitCheck'
  }],
  
  // Note: Chat messages are stored in Conversation model with userId = sessionId
  
  // Usage counters for rate limiting
  usageCounts: {
    fitChecks: { 
      type: Number, 
      default: 0,
      min: 0
    },
    chatMessages: { 
      type: Number, 
      default: 0,
      min: 0
    },
    profilePicReviews: { 
      type: Number, 
      default: 0,
      min: 0
    }
  },
  
  // Session metadata
  ipAddress: {
    type: String,
    required: false
  },
  
  userAgent: {
    type: String,
    required: false
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  
  // Session expires after 24 hours
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  }
});

// Update lastActivityAt on save
anonymousSessionSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

// Static method to create a new anonymous session
anonymousSessionSchema.statics.createSession = function(sessionId, ipAddress = null, userAgent = null) {
  return this.create({
    sessionId,
    ipAddress,
    userAgent
  });
};

// Instance method to increment usage count
anonymousSessionSchema.methods.incrementUsage = function(type) {
  // Ensure usageCounts exists
  if (!this.usageCounts) {
    this.usageCounts = {};
  }
  
  if (this.usageCounts[type] !== undefined) {
    this.usageCounts[type] += 1;
    this.lastActivityAt = new Date();
    return this.save();
  }
  throw new Error(`Invalid usage type: ${type}`);
};

// Instance method to check if usage limit is reached
anonymousSessionSchema.methods.isLimitReached = function(type, limit) {
  if (!this.usageCounts) {
    return false; // No usage counts means no limit reached
  }
  return this.usageCounts[type] >= limit;
};

// Instance method to get remaining usage
anonymousSessionSchema.methods.getRemainingUsage = function(type, limit) {
  if (!this.usageCounts) {
    return limit; // No usage counts means full limit available
  }
  return Math.max(0, limit - (this.usageCounts[type] || 0));
};

// Instance method to add fit check reference
anonymousSessionSchema.methods.addFitCheck = function(fitCheckId) {
  this.fitChecks.push(fitCheckId);
  return this.save();
};

  // Note: Chat messages are handled through Conversation model

// Static method to clean up expired sessions
anonymousSessionSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to get session by ID
anonymousSessionSchema.statics.getSession = function(sessionId) {
  return this.findOne({ sessionId });
};

module.exports = mongoose.model('AnonymousSession', anonymousSessionSchema);
