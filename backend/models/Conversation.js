const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Lightweight image context - stores image URL + thumbnail + analysis
  imageContext: {
    hasImage: { type: Boolean, default: false },
    imageUrl: { type: String, default: null }, // Full resolution image URL for vision model
    thumbnailUrl: { type: String, default: null }, // Small thumbnail (~15KB)
    analysis: { type: String, default: null } // Jules's visual analysis summary
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String to handle 'anonymous' users
    required: true
  },
  messages: [messageSchema],
  // State flags for context tracking
  state: {
    offeredImagesAt: { type: Date, default: null },
    offeredLinksAt: { type: Date, default: null },
    lastIntent: { type: String, default: 'style_feedback' },
    lastStyleAdviceAt: { type: Date, default: null },
    lastOutfitPieces: [String],
    rollingSummary: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add index for faster userId queries
conversationSchema.index({ userId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);