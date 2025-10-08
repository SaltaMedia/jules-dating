const mongoose = require('mongoose');

const fitCheckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Now optional for anonymous users
  },
  
  // Anonymous user support
  anonymousId: {
    type: String,
    required: false // For anonymous users
  },
  
  // Fit check details
  eventContext: {
    type: String,
    required: true
  },
  
  // Specific question (optional - for targeted feedback)
  specificQuestion: {
    type: String,
    default: null
  },
  
  // Images
  originalImageUrl: {
    type: String,
    required: true
  },
  
  // Suggested outfit items
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClosetItem'
    },
    name: {
      type: String,
      required: true
    },
    imageUrl: String,
    category: String,
    role: String
  }],
  
  // Overall rating (for frontend compatibility)
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true
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
    tone: {
      type: Number,
      min: 1,
      max: 3,
      required: true
    },
    suggestions: [String],
    compliments: [String],
    improvements: [String]
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

// Validation: Either userId or anonymousId must be provided
fitCheckSchema.pre('save', function(next) {
  if (!this.userId && !this.anonymousId) {
    return next(new Error('Either userId or anonymousId must be provided'));
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('FitCheck', fitCheckSchema); 