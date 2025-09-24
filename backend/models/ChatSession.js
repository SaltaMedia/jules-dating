const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
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
  }
}, { _id: false });

const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [MessageSchema],
  preview: {
    type: String,
    default: ''
  },
  messageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: "chat_sessions" });

// Update the preview and messageCount when messages change
ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.messageCount = this.messages.length;
  
  // Generate preview from first user message
  if (this.messages.length > 0) {
    const firstUserMessage = this.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      this.preview = firstUserMessage.content.substring(0, 100) + 
        (firstUserMessage.content.length > 100 ? '...' : '');
    }
  }
  
  next();
});

// Create text index for search functionality
ChatSessionSchema.index({ 
  'messages.content': 'text',
  preview: 'text',
  title: 'text'
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema); 