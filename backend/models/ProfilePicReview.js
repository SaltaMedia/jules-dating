const mongoose = require('mongoose');

const profilePicReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for anonymous users
  },
  
  // Anonymous user support
  sessionId: {
    type: String,
    required: false // For anonymous users
  },
  
  // Profile pic details
  originalImageUrl: {
    type: String,
    required: true
  },
  
  // Specific question (optional - for targeted feedback)
  specificQuestion: {
    type: String,
    default: null
  },
  
  // Jules analysis
  analysis: {
    overallRating: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    feedback: {
      type: String,
      required: true
    },
    lighting: {
      type: Number,
      min: 1,
      max: 10,
      required: false
    },
    grooming: {
      type: Number,
      min: 1,
      max: 10,
      required: false
    },
    eyeContact: {
      type: Number,
      min: 1,
      max: 10,
      required: false
    },
    smile: {
      type: Number,
      min: 1,
      max: 10,
      required: false
    },
    overallAppeal: {
      type: Number,
      min: 1,
      max: 10,
      required: false
    }
  },
  
  // Legacy field for compatibility
  advice: {
    type: String,
    required: true
  },
  
  // Legacy field for compatibility
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  
  // User response
  userResponse: {
    liked: Boolean,
    notes: String,
    implemented: Boolean, // Did they follow the advice?
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Save status
  saved: {
    type: Boolean,
    default: false
  },
  savedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Validation: Either userId or sessionId must be provided
profilePicReviewSchema.pre('save', function(next) {
  if (!this.userId && !this.sessionId) {
    return next(new Error('Either userId or sessionId must be provided'));
  }
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
profilePicReviewSchema.index({ userId: 1, createdAt: -1 });
profilePicReviewSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ProfilePicReview', profilePicReviewSchema);

