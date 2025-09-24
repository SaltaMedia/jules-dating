const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { chat } = require('../controllers/chatController');

// POST /api/style/feedback - Handle style feedback requests
router.post('/feedback', auth, async (req, res) => {
  try {
    const { message, imageUrl, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add style feedback context to the message
    const enhancedMessage = `[STYLE FEEDBACK REQUEST] ${message}${imageUrl ? ' [IMAGE PROVIDED]' : ''}`;
    
    // Use the existing chat controller with enhanced message
    const chatReq = {
      ...req,
      body: {
        message: enhancedMessage,
        userId
      }
    };

    await chat(chatReq, res);
    
  } catch (error) {
    console.error('Style feedback error:', error);
    res.status(500).json({ error: 'Style feedback failed' });
  }
});

// POST /api/style/closet-matching - Handle closet matching requests
router.post('/closet-matching', auth, async (req, res) => {
  try {
    const { message, closetImages, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add closet matching context to the message
    const enhancedMessage = `[CLOSET MATCHING REQUEST] ${message}${closetImages ? ' [CLOSET IMAGES PROVIDED]' : ''}`;
    
    // Use the existing chat controller with enhanced message
    const chatReq = {
      ...req,
      body: {
        message: enhancedMessage,
        userId
      }
    };

    await chat(chatReq, res);
    
  } catch (error) {
    console.error('Closet matching error:', error);
    res.status(500).json({ error: 'Closet matching failed' });
  }
});

// POST /api/style/dating-style - Handle dating style requests
router.post('/dating-style', auth, async (req, res) => {
  try {
    const { message, dateType, venue, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add dating style context to the message
    const enhancedMessage = `[DATING STYLE REQUEST] ${message}${dateType ? ` [DATE TYPE: ${dateType}]` : ''}${venue ? ` [VENUE: ${venue}]` : ''}`;
    
    // Use the existing chat controller with enhanced message
    const chatReq = {
      ...req,
      body: {
        message: enhancedMessage,
        userId
      }
    };

    await chat(chatReq, res);
    
  } catch (error) {
    console.error('Dating style error:', error);
    res.status(500).json({ error: 'Dating style advice failed' });
  }
});

module.exports = router; 