const mongoose = require('mongoose');

const closetItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['outfit', 'item', 'accessory'],
    default: 'outfit'
  },
  imageUrl: {
    type: String,
    required: true
  },
  liked: {
    type: Boolean,
    default: null
  },
  julesFeedback: {
    content: String,
    tone: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  userNotes: {
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  fitCheck: {
    eventContext: String,
    originalImageUrl: String,
    advice: String,
    rating: Number
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
closetItemSchema.index({ userId: 1, createdAt: -1 });
closetItemSchema.index({ type: 1 });

module.exports = mongoose.model('ClosetItem', closetItemSchema);
