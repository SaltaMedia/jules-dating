const mongoose = require('mongoose');

const WardrobeItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  itemId: {
    type: String,
    unique: true,
    index: true,
    default: () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Image data
  image: {
    url: {
      type: String,
      required: true
    },
    width: Number,
    height: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    storageProvider: {
      type: String,
      default: 'cloudinary'
    }
  },
  
  // Enhanced tags (auto + manual)
  tags: {
    category: {
      type: String,
      enum: ['top', 'outerwear', 'bottom', 'footwear', 'accessory', 'underlayer', 'other'],
      required: true
    },
    subcategory: String, // e.g., "t-shirt", "oxford", "chino", "blazer", "sneakers"
    colors: [String], // hex or names
    pattern: {
      type: String,
      enum: ['solid', 'stripe', 'check', 'print', 'texture', 'other'],
      default: 'solid'
    },
    material: [String], // ["cotton", "wool", "denim", "leather"]
    seasonality: [String], // ["spring", "summer", "fall", "winter", "all-season"]
    formality: {
      type: String,
      enum: ['casual', 'smart-casual', 'business-casual', 'formal', 'athleisure'],
      default: 'casual'
    },
    fit: {
      type: String,
      enum: ['slim', 'tailored', 'relaxed', 'oversized', 'unknown'],
      default: 'unknown'
    },
    brandGuess: String, // if vision finds logos
    condition: {
      type: String,
      enum: ['new', 'good', 'worn', 'retire'],
      default: 'good'
    },
    occasions: [String] // free-form: "date-night", "office", "travel"
  },
  
  // Size metadata (optional; from profile or manual)
  size: {
    top: String,
    bottom: String,
    shoe: String,
    numeric: String
  },
  
  // Legacy fields for backward compatibility
  name: String,
  brand: String,
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
  
  // Admin fields
  source: {
    type: String,
    enum: ['user-upload', 'manual-entry'],
    default: 'user-upload'
  },
  verified: {
    type: Boolean,
    default: false // user has confirmed tags
  },
  embeddings: {
    type: [Number],
    select: false // optional semantic vector for similarity
  },
  
  // Metadata
  meta: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastAutoTagAt: Date
  }
}, { collection: 'wardrobe_items' });

// Update timestamp on save
WardrobeItemSchema.pre('save', function(next) {
  this.meta = this.meta || {};
  this.meta.updatedAt = new Date();
  next();
});

// Indexes for performance
WardrobeItemSchema.index({ userId: 1, 'tags.category': 1 });
WardrobeItemSchema.index({ userId: 1, 'tags.formality': 1 });
WardrobeItemSchema.index({ userId: 1, 'tags.seasonality': 1 });
WardrobeItemSchema.index({ userId: 1, verified: 1 });

module.exports = mongoose.model('WardrobeItem', WardrobeItemSchema); 