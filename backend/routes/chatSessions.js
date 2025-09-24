const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');

// GET /api/chat - List chat sessions with search
router.get('/', auth, async (req, res) => {
  try {
    const { search, limit = 50, cursor } = req.query;
    const userId = req.user.id;

    let query = { userId };

    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Add cursor-based pagination
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const sessions = await ChatSession.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('title preview messageCount createdAt updatedAt');

    res.json({ 
      sessions,
      hasMore: sessions.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/chat/:sessionId - Get full chat session
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      userId 
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat - Create new chat session
router.post('/', auth, async (req, res) => {
  try {
    const { title, initialMessage } = req.body;
    const userId = req.user.id;

    const session = new ChatSession({
      userId,
      title: title || 'New Chat',
      messages: initialMessage ? [{
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      }] : []
    });

    await session.save();

    res.status(201).json({ 
      message: 'Chat session created',
      session 
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/chat/:sessionId - Update chat session (add messages)
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messages, title } = req.body;
    const userId = req.user.id;

    const update = {};
    if (messages) update.messages = messages;
    if (title) update.title = title;

    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: update },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ 
      message: 'Chat session updated',
      session 
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/chat/:sessionId - Delete single chat session
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await ChatSession.deleteOne({ 
      _id: sessionId, 
      userId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/cleanup - Bulk delete chat sessions
router.post('/cleanup', auth, async (req, res) => {
  try {
    const { sessionIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({ message: 'sessionIds array is required' });
    }

    const result = await ChatSession.deleteMany({
      _id: { $in: sessionIds },
      userId
    });

    res.json({ 
      message: `${result.deletedCount} chat sessions deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting chat sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 