const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    unique: true,
    index: true,
    default: () => `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const communityPostSchema = new mongoose.Schema({
  postId: {
    type: String,
    unique: true,
    index: true,
    default: () => `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  username: {
    type: String,
    required: true
  },
  
  // Image data
  imageUrl: {
    type: String,
    required: true
  },
  
  // Post content
  caption: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    enum: [
      'streetwear', 'office', 'casual', 'formal', 'date-night', 
      'weekend', 'gym', 'travel', 'wedding', 'party', 'business',
      'smart-casual', 'athletic', 'minimal', 'vintage', 'trendy', 'fit-check'
    ]
  }],
  
  // Source of the post
  source: {
    type: String,
    enum: ['fit_check', 'manual'],
    required: true,
    default: 'manual'
  },
  
  // Jules feedback (if from fit check)
  julesFeedback: {
    type: String,
    default: ''
  },
  
  
  // Engagement data
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  comments: [commentSchema],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Admin/moderation flags
  isPinned: {
    type: Boolean,
    default: false
  },
  
  isJulesPost: {
    type: Boolean,
    default: false
  }
}, { 
  collection: 'community_posts',
  timestamps: true 
});

// Update timestamp on save
communityPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for likes count
communityPostSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
communityPostSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Indexes for performance
communityPostSchema.index({ userId: 1, createdAt: -1 });
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ source: 1 });
communityPostSchema.index({ isDeleted: 1, createdAt: -1 });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });

// Ensure virtual fields are serialized
communityPostSchema.set('toJSON', { virtuals: true });
communityPostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
