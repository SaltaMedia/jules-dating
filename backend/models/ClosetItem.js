const mongoose = require('mongoose');

const closetItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Item details
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['top', 'bottom', 'outerwear', 'shoes', 'accessory', 'outfit'],
    required: true
  },
  brand: String,
  imageUrl: {
    type: String,
    required: true
  },
  
  // Tags for organization
  tags: [{
    eventType: String, // e.g., 'casual', 'formal', 'date'
    season: String,    // e.g., 'summer', 'winter', 'fall', 'spring'
    color: String,     // e.g., 'navy', 'black', 'white'
    brand: String
  }],
  
  // User interaction
  liked: {
    type: Boolean,
    default: null // null = not rated, true = liked, false = disliked
  },
  
  // Jules feedback (for fit checks and outfits)
  julesFeedback: {
    content: String,
    tone: Number, // 1-3 scale
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // User notes
  userNotes: {
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Fit check specific data
  fitCheck: {
    eventContext: String, // "Where are you going?"
    originalImageUrl: String,
    advice: String,
    rating: Number // 1-5 scale
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

// Update timestamp on save
closetItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ClosetItem', closetItemSchema); 