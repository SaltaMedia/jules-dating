const mongoose = require('mongoose');

const dailyTipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['style', 'confidence', 'dating', 'social'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one tip per user per day
dailyTipSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for efficient queries
dailyTipSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DailyTip', dailyTipSchema);
