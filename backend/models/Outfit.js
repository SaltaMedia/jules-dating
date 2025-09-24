const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  outfitId: {
    type: String,
    unique: true,
    index: true,
    default: () => `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  name: String, // optional user title
  
  items: [{
    itemId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['top', 'bottom', 'outerwear', 'footwear', 'accessory'],
      required: true
    }
  }],
  
  context: {
    event: String, // "first-date", "office", "wedding-guest", "weekend"
    vibe: [String], // ["minimal", "bold", "rugged"]
    weather: {
      tempC: Number,
      precip: Boolean
    },
    season: String,
    formality: String
  },
  
  score: Number, // model's confidence/ranking
  
  gaps: [String], // e.g., "needs belt", "no weather-appropriate outerwear"
  
  createdFrom: {
    type: String,
    enum: ['auto', 'manual', 'edited-auto'],
    default: 'auto'
  },
  
  feedback: {
    likes: {
      type: Number,
      default: 0
    },
    dislikes: {
      type: Number,
      default: 0
    },
    notes: [String]
  },
  
  // Legacy fields for backward compatibility
  occasion: String,
  season: String,
  style: String,
  budget: String,
  
  // Metadata
  meta: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { collection: 'outfits' });

// Update timestamp on save
OutfitSchema.pre('save', function(next) {
  this.meta = this.meta || {};
  this.meta.updatedAt = new Date();
  next();
});

// Indexes for performance
OutfitSchema.index({ userId: 1, 'context.event': 1 });
OutfitSchema.index({ userId: 1, 'context.formality': 1 });
OutfitSchema.index({ userId: 1, 'meta.createdAt': -1 });

module.exports = mongoose.model('Outfit', OutfitSchema); 