const express = require('express');
const router = express.Router();
const segment = require('../utils/segment');

// Simple analytics tracking endpoint for Segment → Mixpanel
router.post('/track', async (req, res) => {
  try {
    const { event, properties = {}, userId } = req.body;
    
    // Send to Segment (which forwards to Mixpanel)
    await segment.track(userId || 'anonymous', event, {
      ...properties,
      timestamp: new Date().toISOString(),
      source: 'api'
    });
    
    console.log(`📊 Event tracked via Segment → Mixpanel: ${event}`, properties);
    res.json({ message: 'Event tracked via Segment → Mixpanel' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

module.exports = router;