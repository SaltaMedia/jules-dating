const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { chat } = require('../controllers/chatController');

// POST /api/grooming/advice - Get grooming advice
router.post('/advice', auth, async (req, res) => {
  try {
    const { concern, skinType, budget, userId } = req.body;
    
    if (!concern) {
      return res.status(400).json({ error: 'Grooming concern is required' });
    }

    // Add grooming advice context to the message
    const enhancedMessage = `[GROOMING ADVICE REQUEST] Help with ${concern}${skinType ? ` for ${skinType} skin` : ''}${budget ? ` within ${budget} budget` : ''}`;
    
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
    console.error('Grooming advice error:', error);
    res.status(500).json({ error: 'Grooming advice failed' });
  }
});

// POST /api/grooming/routine - Create grooming routine
router.post('/routine', auth, async (req, res) => {
  try {
    const { skinType, concerns, timeAvailable, budget, userId } = req.body;
    
    if (!skinType) {
      return res.status(400).json({ error: 'Skin type is required' });
    }

    // Add grooming routine context to the message
    const enhancedMessage = `[GROOMING ROUTINE REQUEST] Create a grooming routine for ${skinType} skin${concerns ? ` addressing ${concerns}` : ''}${timeAvailable ? ` with ${timeAvailable} time available` : ''}${budget ? ` within ${budget} budget` : ''}`;
    
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
    console.error('Grooming routine error:', error);
    res.status(500).json({ error: 'Grooming routine creation failed' });
  }
});

// POST /api/grooming/products - Get grooming product recommendations
router.post('/products', auth, async (req, res) => {
  try {
    const { category, skinType, budget, userId } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Product category is required' });
    }

    // Add grooming products context to the message
    const enhancedMessage = `[GROOMING PRODUCTS REQUEST] Recommend ${category} products${skinType ? ` for ${skinType} skin` : ''}${budget ? ` within ${budget} budget` : ''}`;
    
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
    console.error('Grooming products error:', error);
    res.status(500).json({ error: 'Grooming product recommendations failed' });
  }
});

module.exports = router; 