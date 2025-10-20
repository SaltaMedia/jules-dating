const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../utils/analyticsService');
const { 
  getTodaysTip, 
  markTipAsRead, 
  getTipHistory,
  generateDailyTip 
} = require('../controllers/dailyTipsController');

// GET /api/daily-tips/today - Get today's tip for the user
router.get('/today', auth, async (req, res) => {
  try {
    const tip = await getTodaysTip(req.user.userId);
    
    if (!tip) {
      return res.status(404).json({ error: 'No tip available for today' });
    }
    
    // Track analytics with Segment
    try {
      const segment = require('../utils/segment');
      await segment.track(req.user.userId, 'Daily Tip Viewed', {
        sessionId: req.sessionId || 'authenticated',
        category: 'tips',
        action: 'daily_tip_viewed',
        tipId: tip._id,
        tipCategory: tip.category
      });
    } catch (analyticsError) {
      console.error('❌ Failed to track daily tip analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }
    
    res.json({ tip });
  } catch (error) {
    console.error('Error getting today\'s tip:', error);
    res.status(500).json({ error: 'Failed to get today\'s tip' });
  }
});

// POST /api/daily-tips/:tipId/read - Mark tip as read
router.post('/:tipId/read', auth, async (req, res) => {
  try {
    const { tipId } = req.params;
    const success = await markTipAsRead(req.user.userId, tipId);
    
    if (!success) {
      return res.status(404).json({ error: 'Tip not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking tip as read:', error);
    res.status(500).json({ error: 'Failed to mark tip as read' });
  }
});

// GET /api/daily-tips/history - Get tip history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 7 } = req.query;
    const tips = await getTipHistory(req.user.userId, parseInt(limit));
    
    res.json({ tips });
  } catch (error) {
    console.error('Error getting tip history:', error);
    res.status(500).json({ error: 'Failed to get tip history' });
  }
});

// POST /api/daily-tips/generate - Manually generate a new tip (for testing)
router.post('/generate', auth, async (req, res) => {
  try {
    const tip = await generateDailyTip(req.user.userId, req.body.preferences);
    
    if (!tip) {
      return res.status(500).json({ error: 'Failed to generate tip' });
    }
    
    res.json({ tip });
  } catch (error) {
    console.error('Error generating tip:', error);
    res.status(500).json({ error: 'Failed to generate tip' });
  }
});

module.exports = router;
