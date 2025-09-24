const mongoose = require('mongoose');

const wishListItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Product details
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: String,
  description: String,
  brand: String,
  
  // Source information
  source: {
    type: String,
    enum: ['chat', 'manual', 'personalized-picks'],
    default: 'chat'
  },
  
  // User actions
  status: {
    type: String,
    enum: ['wishlist', 'purchased', 'removed'],
    default: 'wishlist'
  },
  
  // Optional notes from user
  notes: String,
  
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
wishListItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WishListItem', wishListItemSchema); 