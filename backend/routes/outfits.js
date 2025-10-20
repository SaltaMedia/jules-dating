const express = require('express');
const router = express.Router();
const ClosetItem = require('../models/ClosetItem');
const { logInfo, logError } = require('../utils/logger');

// Get user's outfits (closet items)
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const outfits = await ClosetItem.find({ 
      userId,
      type: 'outfit' // Only return outfit-type items
    })
    .sort({ createdAt: -1 })
    .limit(50);

    logInfo(`Retrieved ${outfits.length} outfits for user ${userId}`);
    
    res.json({
      success: true,
      outfits: outfits
    });
  } catch (error) {
    logError('Error fetching outfits:', error);
    res.status(500).json({ 
      error: 'Failed to fetch outfits',
      message: error.message 
    });
  }
});

module.exports = router;
